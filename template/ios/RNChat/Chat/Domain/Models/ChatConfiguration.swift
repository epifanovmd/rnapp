//
// ChatConfiguration.swift
// chat-ios
//
// Created by Andrei on 17.01.2026.
//

import Foundation
import UIKit

struct ChatConfiguration {
    struct Layout {
        var maxMessageWidthRatio: CGFloat
        var tailSize: CGFloat
        var bubbleCornerRadius: CGFloat
        var interItemSpacing: CGFloat
        var interSectionSpacing: CGFloat
        var bubbleContentInsets: UIEdgeInsets
        var dateSeparatorInsets: UIEdgeInsets
        var mediaOverlayInsets: UIEdgeInsets
        var systemMessageInsets: UIEdgeInsets
        var replyPreviewInsets: UIEdgeInsets
    }

    struct Colors {
        var background: UIColor
        var incomingBubble: UIColor
        var outgoingBubble: UIColor
        var incomingText: UIColor
        var outgoingText: UIColor
        var incomingLink: UIColor
        var outgoingLink: UIColor
        var dateSeparatorText: UIColor
        var dateSeparatorBorder: UIColor
        var dateSeparatorBackground: UIColor
        var messageSenderText: UIColor
        var messageTimeText: UIColor
        var mediaOverlayBackground: UIColor
        var statusSent: UIColor
        var statusReceived: UIColor
        var statusRead: UIColor
        var mediaPlaceholderBackground: UIColor
        var systemMessageText: UIColor
        var systemMessageBackground: UIColor
        var systemMessageBorder: UIColor
        var replyPreviewBackground: UIColor
        var replyPreviewText: UIColor
        var replyPreviewSenderText: UIColor
        var replyPreviewBorder: UIColor
        var scrollHighlight: UIColor
    }

    struct Fonts {
        var message: UIFont
        var dateSeparator: UIFont
        var groupTitle: UIFont
        var messageSender: UIFont
        var messageStatus: UIFont
        var messageTime: UIFont
        var systemMessage: UIFont
    }

    struct DateFormatting {
        var dateSeparatorTextProvider: (Date) -> String
        var messageTimeProvider: (Date) -> String
    }

    struct StatusIcons {
        var sent: UIImage?
        var received: UIImage?
        var read: UIImage?
    }

    struct Behavior {
        enum NameDisplayMode {
            case always
            case first
            case none
        }
      
        var showsBubbleTail: Bool
        var nameDisplayMode: NameDisplayMode
        var showsStatus: Bool
        var unsupportedMessageText: String
        var showsMessageTime: Bool
        var showsReplyPreview: Bool
        var replyPreviewTextProvider: (RawMessage.Data, ChatUser) -> String
        var showsScrollHighlight: Bool
        var scrollHighlightDuration: TimeInterval
    }

    struct ViewabilityConfig {
        var minimumViewTime: TimeInterval
        var viewAreaCoveragePercentThreshold: CGFloat
        var itemVisiblePercentThreshold: CGFloat
        var waitForInteraction: Bool
    }

    var layout: Layout
    var colors: Colors
    var fonts: Fonts
    var dateFormatting: DateFormatting
    var statusIcons: StatusIcons
    var behavior: Behavior
    var viewability: ViewabilityConfig
    var customCellProvider: ((Message, UICollectionView, IndexPath) -> UICollectionViewCell?)?

    static let `default` = ChatConfiguration(
        layout: Layout(
            maxMessageWidthRatio: 0.65,
            tailSize: 5,
            bubbleCornerRadius: 17,
            interItemSpacing: 8,
            interSectionSpacing: 50,
            bubbleContentInsets: UIEdgeInsets(top: 8, left: 16, bottom: 8, right: 16),
            dateSeparatorInsets: UIEdgeInsets(top: 2, left: 0, bottom: 2, right: 0),
            mediaOverlayInsets: UIEdgeInsets(top: 8, left: 16, bottom: 8, right: 16),
            systemMessageInsets: UIEdgeInsets(top: 4, left: 24, bottom: 4, right: 24),
            replyPreviewInsets: UIEdgeInsets(top: 6, left: 8, bottom: 6, right: 8)
        ),
        colors: Colors(
            background: .systemBackground,
            incomingBubble: .systemGray5,
            outgoingBubble: .systemBlue,
            incomingText: .label,
            outgoingText: .systemBackground,
            incomingLink: .systemBlue,
            outgoingLink: .systemGray6,
            dateSeparatorText: .gray,
            dateSeparatorBorder: .gray,
            dateSeparatorBackground: .white,
            messageSenderText: .secondaryLabel,
            messageTimeText: .secondaryLabel,
            mediaOverlayBackground: UIColor.black.withAlphaComponent(0.35),
            statusSent: .lightGray,
            statusReceived: .systemBlue,
            statusRead: .systemBlue,
            mediaPlaceholderBackground: .systemGray5,
            systemMessageText: .secondaryLabel,
            systemMessageBackground: .systemGray6,
            systemMessageBorder: .systemGray4,
            replyPreviewBackground: UIColor.black.withAlphaComponent(0.05),
            replyPreviewText: .secondaryLabel,
            replyPreviewSenderText: .label,
            replyPreviewBorder: .systemBlue,
            scrollHighlight: UIColor.systemYellow.withAlphaComponent(0.35)
        ),
        fonts: Fonts(
            message: .preferredFont(forTextStyle: .body),
            dateSeparator: .preferredFont(forTextStyle: .caption2),
            groupTitle: .preferredFont(forTextStyle: .caption2),
            messageSender: .preferredFont(forTextStyle: .caption2),
            messageStatus: .preferredFont(forTextStyle: .caption2),
            messageTime: .preferredFont(forTextStyle: .caption2),
            systemMessage: .preferredFont(forTextStyle: .caption1)
        ),
        dateFormatting: DateFormatting(
            dateSeparatorTextProvider: { date in
                ChatDateFormatter.shared.string(from: date)
            },
            messageTimeProvider: { date in
                MessageDateFormatter.shared.string(from: date)
            }
        ),
        statusIcons: StatusIcons(
            sent: UIImage(named: "sent_status"),
            received: UIImage(named: "sent_status"),
            read: UIImage(named: "read_status")
        ),
        behavior: Behavior(
            showsBubbleTail: true,
            nameDisplayMode: .first,
            showsStatus: true,
            unsupportedMessageText: "Unsupported message",
            showsMessageTime: true,
            showsReplyPreview: true,
            replyPreviewTextProvider: { data, _ in
                switch data {
                case let .text(text):
                    return text
                case .image:
                    return "Image"
                case let .system(text):
                    return text
                }
            },
            showsScrollHighlight: true,
            scrollHighlightDuration: 0.8
        ),
        viewability: ViewabilityConfig(
            minimumViewTime: 0.5,
            viewAreaCoveragePercentThreshold: 0,
            itemVisiblePercentThreshold: 50,
            waitForInteraction: false
        ),
        customCellProvider: nil
    )
}
