import UIKit

struct ChatTheme {
    let isDark: Bool

    // MARK: - Background
    let backgroundColor: UIColor
    let wallpaperColor: UIColor

    // MARK: - Outgoing Bubble
    let outgoingBubble: UIColor
    let outgoingText: UIColor
    let outgoingTime: UIColor
    let outgoingStatus: UIColor
    let outgoingStatusRead: UIColor
    let outgoingEdited: UIColor
    let outgoingLink: UIColor

    // MARK: - Incoming Bubble
    let incomingBubble: UIColor
    let incomingText: UIColor
    let incomingTime: UIColor
    let incomingEdited: UIColor
    let incomingSenderName: UIColor
    let incomingLink: UIColor

    // MARK: - Reply Preview
    let outgoingReplyBackground: UIColor
    let outgoingReplyAccent: UIColor
    let outgoingReplySender: UIColor
    let outgoingReplyText: UIColor
    let incomingReplyBackground: UIColor
    let incomingReplyAccent: UIColor
    let incomingReplySender: UIColor
    let incomingReplyText: UIColor

    // MARK: - Forwarded
    let outgoingForwardedLabel: UIColor
    let incomingForwardedLabel: UIColor

    // MARK: - Reactions
    let reactionBackground: UIColor
    let reactionMineBackground: UIColor
    let reactionText: UIColor
    let reactionMineBorder: UIColor

    // MARK: - Date Separator
    let dateSeparatorBackground: UIColor
    let dateSeparatorText: UIColor

    // MARK: - Input Bar
    let inputBarBackground: UIColor
    let inputBarSeparator: UIColor
    let inputBarTextViewBackground: UIColor
    let inputBarPlaceholder: UIColor
    let inputBarText: UIColor
    let inputBarTint: UIColor

    // MARK: - Input Reply/Edit Panel
    let replyPanelBackground: UIColor
    let replyPanelAccent: UIColor
    let replyPanelSender: UIColor
    let replyPanelText: UIColor
    let replyPanelClose: UIColor

    // MARK: - FAB
    let fabBlurStyle: UIBlurEffect.Style
    let fabArrowColor: UIColor

    // MARK: - Audio
    let voiceWaveformActive: UIColor
    let voiceWaveformInactive: UIColor
    let voiceRecordingIndicator: UIColor

    // MARK: - Poll
    let pollBarFilled: UIColor
    let pollBarEmpty: UIColor
    let pollSelectedCheck: UIColor

    // MARK: - Empty State
    let emptyStateText: UIColor
}

// MARK: - Presets

extension ChatTheme {
    static let light = ChatTheme(
        isDark: false,
        backgroundColor: UIColor(red: 0.94, green: 0.94, blue: 0.96, alpha: 1),
        wallpaperColor: UIColor(red: 0.84, green: 0.88, blue: 0.93, alpha: 1),
        outgoingBubble: UIColor(red: 0.88, green: 0.98, blue: 0.84, alpha: 1),
        outgoingText: .black,
        outgoingTime: UIColor(white: 0.0, alpha: 0.45),
        outgoingStatus: UIColor(white: 0.0, alpha: 0.35),
        outgoingStatusRead: UIColor(red: 0.2, green: 0.6, blue: 0.35, alpha: 1),
        outgoingEdited: UIColor(white: 0.0, alpha: 0.4),
        outgoingLink: UIColor.systemBlue,
        incomingBubble: .white,
        incomingText: .black,
        incomingTime: UIColor(white: 0.0, alpha: 0.45),
        incomingEdited: UIColor(white: 0.0, alpha: 0.4),
        incomingSenderName: UIColor.systemBlue,
        incomingLink: UIColor.systemBlue,
        outgoingReplyBackground: UIColor(red: 0.78, green: 0.93, blue: 0.74, alpha: 1),
        outgoingReplyAccent: UIColor(red: 0.2, green: 0.6, blue: 0.35, alpha: 1),
        outgoingReplySender: UIColor(red: 0.2, green: 0.6, blue: 0.35, alpha: 1),
        outgoingReplyText: UIColor(white: 0.0, alpha: 0.7),
        incomingReplyBackground: UIColor(red: 0.93, green: 0.93, blue: 0.95, alpha: 1),
        incomingReplyAccent: UIColor.systemBlue,
        incomingReplySender: UIColor.systemBlue,
        incomingReplyText: UIColor(white: 0.0, alpha: 0.7),
        outgoingForwardedLabel: UIColor(red: 0.2, green: 0.6, blue: 0.35, alpha: 1),
        incomingForwardedLabel: UIColor.systemBlue,
        reactionBackground: UIColor(white: 0.93, alpha: 1),
        reactionMineBackground: UIColor.systemBlue.withAlphaComponent(0.15),
        reactionText: .black,
        reactionMineBorder: UIColor.systemBlue.withAlphaComponent(0.5),
        dateSeparatorBackground: UIColor(white: 0.0, alpha: 0.08),
        dateSeparatorText: UIColor(white: 0.0, alpha: 0.5),
        inputBarBackground: UIColor(red: 0.97, green: 0.97, blue: 0.98, alpha: 1),
        inputBarSeparator: UIColor(white: 0.8, alpha: 1),
        inputBarTextViewBackground: .white,
        inputBarPlaceholder: UIColor(white: 0.6, alpha: 1),
        inputBarText: .black,
        inputBarTint: UIColor.systemBlue,
        replyPanelBackground: UIColor(red: 0.97, green: 0.97, blue: 0.98, alpha: 1),
        replyPanelAccent: UIColor.systemBlue,
        replyPanelSender: UIColor.systemBlue,
        replyPanelText: UIColor(white: 0.3, alpha: 1),
        replyPanelClose: UIColor(white: 0.5, alpha: 1),
        fabBlurStyle: .systemMaterial,
        fabArrowColor: UIColor(white: 0.3, alpha: 1),
        voiceWaveformActive: UIColor.systemBlue,
        voiceWaveformInactive: UIColor(white: 0.75, alpha: 1),
        voiceRecordingIndicator: .systemRed,
        pollBarFilled: UIColor.systemBlue,
        pollBarEmpty: UIColor(white: 0.9, alpha: 1),
        pollSelectedCheck: UIColor.systemBlue,
        emptyStateText: UIColor(white: 0.5, alpha: 1)
    )

    static let dark = ChatTheme(
        isDark: true,
        backgroundColor: UIColor(red: 0.06, green: 0.09, blue: 0.13, alpha: 1),
        wallpaperColor: UIColor(red: 0.06, green: 0.09, blue: 0.13, alpha: 1),
        outgoingBubble: UIColor(red: 0.17, green: 0.32, blue: 0.47, alpha: 1),
        outgoingText: .white,
        outgoingTime: UIColor(white: 1.0, alpha: 0.5),
        outgoingStatus: UIColor(white: 1.0, alpha: 0.4),
        outgoingStatusRead: UIColor(red: 0.4, green: 0.8, blue: 0.55, alpha: 1),
        outgoingEdited: UIColor(white: 1.0, alpha: 0.45),
        outgoingLink: UIColor(red: 0.45, green: 0.75, blue: 1.0, alpha: 1),
        incomingBubble: UIColor(red: 0.11, green: 0.15, blue: 0.20, alpha: 1),
        incomingText: .white,
        incomingTime: UIColor(white: 1.0, alpha: 0.5),
        incomingEdited: UIColor(white: 1.0, alpha: 0.45),
        incomingSenderName: UIColor(red: 0.45, green: 0.75, blue: 1.0, alpha: 1),
        incomingLink: UIColor(red: 0.45, green: 0.75, blue: 1.0, alpha: 1),
        outgoingReplyBackground: UIColor(red: 0.14, green: 0.27, blue: 0.40, alpha: 1),
        outgoingReplyAccent: UIColor(red: 0.4, green: 0.8, blue: 0.55, alpha: 1),
        outgoingReplySender: UIColor(red: 0.4, green: 0.8, blue: 0.55, alpha: 1),
        outgoingReplyText: UIColor(white: 1.0, alpha: 0.6),
        incomingReplyBackground: UIColor(red: 0.14, green: 0.18, blue: 0.24, alpha: 1),
        incomingReplyAccent: UIColor(red: 0.45, green: 0.75, blue: 1.0, alpha: 1),
        incomingReplySender: UIColor(red: 0.45, green: 0.75, blue: 1.0, alpha: 1),
        incomingReplyText: UIColor(white: 1.0, alpha: 0.6),
        outgoingForwardedLabel: UIColor(red: 0.4, green: 0.8, blue: 0.55, alpha: 1),
        incomingForwardedLabel: UIColor(red: 0.45, green: 0.75, blue: 1.0, alpha: 1),
        reactionBackground: UIColor(white: 0.2, alpha: 1),
        reactionMineBackground: UIColor.systemBlue.withAlphaComponent(0.25),
        reactionText: .white,
        reactionMineBorder: UIColor.systemBlue.withAlphaComponent(0.6),
        dateSeparatorBackground: UIColor(white: 1.0, alpha: 0.08),
        dateSeparatorText: UIColor(white: 1.0, alpha: 0.5),
        inputBarBackground: UIColor(red: 0.11, green: 0.14, blue: 0.19, alpha: 1),
        inputBarSeparator: UIColor(white: 0.25, alpha: 1),
        inputBarTextViewBackground: UIColor(red: 0.15, green: 0.19, blue: 0.25, alpha: 1),
        inputBarPlaceholder: UIColor(white: 0.45, alpha: 1),
        inputBarText: .white,
        inputBarTint: UIColor(red: 0.45, green: 0.75, blue: 1.0, alpha: 1),
        replyPanelBackground: UIColor(red: 0.11, green: 0.14, blue: 0.19, alpha: 1),
        replyPanelAccent: UIColor(red: 0.45, green: 0.75, blue: 1.0, alpha: 1),
        replyPanelSender: UIColor(red: 0.45, green: 0.75, blue: 1.0, alpha: 1),
        replyPanelText: UIColor(white: 0.65, alpha: 1),
        replyPanelClose: UIColor(white: 0.5, alpha: 1),
        fabBlurStyle: .systemMaterialDark,
        fabArrowColor: UIColor(white: 0.7, alpha: 1),
        voiceWaveformActive: UIColor(red: 0.45, green: 0.75, blue: 1.0, alpha: 1),
        voiceWaveformInactive: UIColor(white: 0.35, alpha: 1),
        voiceRecordingIndicator: .systemRed,
        pollBarFilled: UIColor(red: 0.45, green: 0.75, blue: 1.0, alpha: 1),
        pollBarEmpty: UIColor(white: 0.2, alpha: 1),
        pollSelectedCheck: UIColor(red: 0.45, green: 0.75, blue: 1.0, alpha: 1),
        emptyStateText: UIColor(white: 0.5, alpha: 1)
    )
}
