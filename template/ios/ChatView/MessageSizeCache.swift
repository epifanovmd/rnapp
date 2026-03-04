// MARK: - MessageSizeCache.swift
// Deterministic, thread-safe cell size cache for chat messages.
//
// Architecture:
//   MessageSizeCalculator  — pure functions, no UIKit, no state
//   MessageSizeCache       — NSCache wrapper with typed API + width-aware invalidation
//
// Why FlowLayout + sizeForItemAt instead of Compositional Layout + preferredLayoutAttributesFitting:
//   Compositional Layout asks the *cell* for its preferred size after first layout, which means
//   Auto Layout runs twice per cell and the layout engine can produce different results on reuse
//   (especially when the cell width isn't yet final). FlowLayout with a delegate gives the layout
//   a deterministic size *before* the cell is dequeued, so every dequeue produces a cell that
//   exactly matches the reserved space — zero jumps.

import UIKit

// MARK: - Layout constants (single source of truth)
// These must match the actual subview constraints in MessageBubbleView / MessageCell.

enum MessageLayoutConstants {
    // Cell
    static let cellVerticalPadding: CGFloat  = 4    // top(2) + bottom(2)
    /// Horizontal gap between the bubble edge and the collection view edge (leading or trailing).
    static let cellSideMargin: CGFloat       = 8

    // Bubble
    static let bubbleMaxWidthRatio: CGFloat  = 0.80
    static let bubbleHorizontalPad: CGFloat  = 20   // leading(10) + trailing(10)
    static let bubbleTopPad: CGFloat         = 8
    static let bubbleBottomPad: CGFloat      = 6

    // Content stack spacing
    static let stackSpacing: CGFloat         = 4

    // Reply bubble (fixed height)
    static let replyBubbleHeight: CGFloat    = 52

    // Footer
    static let footerHeight: CGFloat         = 18
    static let footerTopSpacing: CGFloat     = 2
    static let footerTrailingPad: CGFloat    = 10
    static let footerInternalSpacing: CGFloat = 3
    static let statusIconWidth: CGFloat      = 16

    // Fonts
    static let messageFont   = UIFont.systemFont(ofSize: 16)
    static let footerFont    = UIFont.systemFont(ofSize: 11)

    // Minimum cell height
    static let minimumCellHeight: CGFloat    = 44
}

// MARK: - MessageSizeCalculator

/// Pure, stateless size calculator. All methods are static — safe to call from any thread.
enum MessageSizeCalculator {

    // MARK: - Public API

    /// Returns the exact CGSize for a cell.
    /// Width is always collectionViewWidth so FlowLayout places exactly one cell per row.
    /// Bubble width is stored separately and applied as an exact constraint inside MessageCell.
    static func cellSize(for message: ChatMessage, collectionViewWidth: CGFloat) -> CGSize {
        let maxBubble = floor(collectionViewWidth * MessageLayoutConstants.bubbleMaxWidthRatio)
        let bubbleW   = bubbleWidth(for: message, maxWidth: maxBubble)
        let bubbleH   = bubbleHeight(for: message, bubbleWidth: bubbleW)
        let cellH     = max(
            ceil(bubbleH) + MessageLayoutConstants.cellVerticalPadding,
            MessageLayoutConstants.minimumCellHeight
        )
        return CGSize(width: collectionViewWidth, height: cellH)
    }

    /// Exact bubble width: minimum of (content-driven natural width) and maxWidth.
    static func bubbleWidth(for message: ChatMessage, maxWidth: CGFloat) -> CGFloat {
        // Images and reply previews always fill the max width
        if message.hasImages || message.replyTo != nil {
            return maxWidth
        }

        // Text-only: measure natural text width, clamp to [minWidth, maxWidth]
        let minWidth = minimumBubbleWidth(for: message)

        if message.hasText, let text = message.text {
            let textNatural = naturalTextWidth(for: text)
            // bubble = text + horizontal padding, clamped
            let candidate = ceil(textNatural) + MessageLayoutConstants.bubbleHorizontalPad
            return min(max(candidate, minWidth), maxWidth)
        }

        return minWidth
    }

    /// Computes exact bubble height for a known bubble width.
    static func bubbleHeight(for message: ChatMessage, bubbleWidth: CGFloat) -> CGFloat {
        var h = MessageLayoutConstants.bubbleTopPad

        if message.replyTo != nil {
            h += MessageLayoutConstants.replyBubbleHeight
            h += MessageLayoutConstants.stackSpacing
        }

        if message.hasImages, let imgs = message.images {
            let imgWidth = bubbleWidth - MessageLayoutConstants.bubbleHorizontalPad
            h += imageGridHeight(count: imgs.count, width: imgWidth)
            h += MessageLayoutConstants.stackSpacing
        }

        if message.hasText, let text = message.text {
            let textWidth = bubbleWidth - MessageLayoutConstants.bubbleHorizontalPad
            h += textHeight(for: text, constrainedTo: textWidth)
            h += MessageLayoutConstants.stackSpacing
        }

        h += MessageLayoutConstants.footerHeight
        h += MessageLayoutConstants.footerTopSpacing
        h += MessageLayoutConstants.bubbleBottomPad

        return h
    }

    /// Minimum bubble width so footer (time + status icon) always fits without clipping.
    static func minimumBubbleWidth(for message: ChatMessage) -> CGFloat {
        let timeText  = DateHelper.shared.timeString(from: message.timestamp)
        let timeWidth = ceil((timeText as NSString).size(
            withAttributes: [.font: MessageLayoutConstants.footerFont]
        ).width)
        let statusW: CGFloat = message.isMine
            ? MessageLayoutConstants.footerInternalSpacing + MessageLayoutConstants.statusIconWidth
            : 0
        return timeWidth + statusW + MessageLayoutConstants.footerTrailingPad * 2
    }

    // MARK: - Private helpers

    /// Width that the text would occupy if unconstrained (single longest line).
    private static func naturalTextWidth(for text: String) -> CGFloat {
        // Use a very wide constraint so wrapping doesn't occur — gives us the natural single-line width.
        // For multi-line text this will be the width of the widest line.
        let size = (text as NSString).boundingRect(
            with: CGSize(width: 10_000, height: CGFloat.greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: [.font: MessageLayoutConstants.messageFont],
            context: nil
        )
        return ceil(size.width)
    }

    private static func textHeight(for text: String, constrainedTo width: CGFloat) -> CGFloat {
        guard width > 0 else { return 0 }
        let size = (text as NSString).boundingRect(
            with: CGSize(width: width, height: .greatestFiniteMagnitude),
            options: [.usesLineFragmentOrigin, .usesFontLeading],
            attributes: [.font: MessageLayoutConstants.messageFont],
            context: nil
        )
        return ceil(size.height)
    }

    private static func imageGridHeight(count: Int, width: CGFloat) -> CGFloat {
        switch count {
        case 1:  return width * 0.6
        case 2:  return width * 0.5
        default: return width * 0.5
        }
    }
}

// MARK: - MessageSizeCache

/// Thread-safe NSCache wrapper. Keyed by message ID.
/// Automatically invalidates all entries when the collection view width changes.
final class MessageSizeCache {

    // NSCache is already thread-safe for concurrent reads/writes.
    private let cache = NSCache<NSString, CacheEntry>()
    private(set) var layoutWidth: CGFloat = 0

    init(countLimit: Int = 500) {
        cache.countLimit = countLimit
    }

    // MARK: - Public API

    /// Returns a cached size, or computes, caches, and returns a new one.
    func size(for message: ChatMessage, collectionViewWidth: CGFloat) -> CGSize {
        if collectionViewWidth != layoutWidth {
            invalidateAll()
            layoutWidth = collectionViewWidth
        }

        let key = message.id as NSString
        if let entry = cache.object(forKey: key) {
            return entry.size
        }

        let computed = MessageSizeCalculator.cellSize(
            for: message,
            collectionViewWidth: collectionViewWidth
        )
        cache.setObject(CacheEntry(computed), forKey: key)
        return computed
    }

    /// Invalidates a specific set of message IDs (e.g. after status/text change).
    func invalidate(ids: some Collection<String>) {
        ids.forEach { cache.removeObject(forKey: $0 as NSString) }
    }

    /// Drops all cached sizes (e.g. on rotation or font-size change).
    func invalidateAll() {
        cache.removeAllObjects()
    }

    // MARK: - Cache entry

    private final class CacheEntry: NSObject {
        let size: CGSize
        init(_ size: CGSize) { self.size = size }
    }
}
