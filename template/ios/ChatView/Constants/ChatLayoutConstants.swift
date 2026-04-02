import UIKit

enum ChatLayout {
    // MARK: - Bubble
    static let bubbleCornerRadius: CGFloat = 18
    static let bubbleTailWidth: CGFloat = 6
    static let bubbleMaxWidthRatio: CGFloat = 0.78
    static let bubbleMinWidth: CGFloat = 60
    static let bubbleHPad: CGFloat = 12
    static let bubbleVPad: CGFloat = 6
    static let bubbleBottomPad: CGFloat = 5
    static let bubbleSpacing: CGFloat = 4

    // MARK: - Cell
    static let cellHMargin: CGFloat = 8
    static let cellVSpacing: CGFloat = 2
    static let cellMinHeight: CGFloat = 36

    // MARK: - Content
    static let messageFont: UIFont = .systemFont(ofSize: 16)
    static let senderNameFont: UIFont = .systemFont(ofSize: 13, weight: .semibold)
    static let timeFont: UIFont = .systemFont(ofSize: 11)
    static let editedFont: UIFont = .systemFont(ofSize: 11)
    static let forwardedFont: UIFont = .systemFont(ofSize: 13, weight: .medium)

    // MARK: - Footer
    static let footerHeight: CGFloat = 16
    static let footerSpacing: CGFloat = 3
    static let statusIconSize: CGFloat = 14

    // MARK: - Reply Preview
    static let replyHeight: CGFloat = 38
    static let replyAccentWidth: CGFloat = 2.5
    static let replyCornerRadius: CGFloat = 6
    static let replyFont: UIFont = .systemFont(ofSize: 13)
    static let replySenderFont: UIFont = .systemFont(ofSize: 13, weight: .semibold)

    // MARK: - Reactions
    static let reactionChipHeight: CGFloat = 28
    static let reactionChipSpacing: CGFloat = 4
    static let reactionFont: UIFont = .systemFont(ofSize: 13)

    // MARK: - Images
    static let imageMaxHeight: CGFloat = 280
    static let imageMinHeight: CGFloat = 100
    static let imageCornerRadius: CGFloat = 12

    // MARK: - Video
    static let videoPlaySize: CGFloat = 48
    static let videoDurationFont: UIFont = .monospacedDigitSystemFont(ofSize: 12, weight: .medium)

    // MARK: - Voice
    static let voiceWaveformHeight: CGFloat = 28
    static let voiceBarWidth: CGFloat = 2.5
    static let voiceBarSpacing: CGFloat = 2
    static let voiceDurationFont: UIFont = .monospacedDigitSystemFont(ofSize: 14, weight: .regular)
    static let voicePlaySize: CGFloat = 36

    // MARK: - Poll
    static let pollQuestionFont: UIFont = .systemFont(ofSize: 15, weight: .semibold)
    static let pollOptionFont: UIFont = .systemFont(ofSize: 15)
    static let pollBarHeight: CGFloat = 30
    static let pollBarCornerRadius: CGFloat = 6
    static let pollSpacing: CGFloat = 6
    static let pollOptionSpacing: CGFloat = 4
    static let pollVotesFont: UIFont = .systemFont(ofSize: 13)

    // MARK: - File
    static let fileIconSize: CGFloat = 40
    static let fileNameFont: UIFont = .systemFont(ofSize: 15, weight: .medium)
    static let fileSizeFont: UIFont = .systemFont(ofSize: 13)

    // MARK: - Emoji Only
    static let emojiFont1: UIFont = .systemFont(ofSize: 48)
    static let emojiFont2: UIFont = .systemFont(ofSize: 40)
    static let emojiFont3: UIFont = .systemFont(ofSize: 34)

    // MARK: - Date Separator
    static let dateSeparatorFont: UIFont = .systemFont(ofSize: 13, weight: .medium)
    static let dateSeparatorVPad: CGFloat = 4
    static let dateSeparatorHPad: CGFloat = 12
    static let dateSeparatorCornerRadius: CGFloat = 12

    // MARK: - Collection
    static let collectionTopPadding: CGFloat = 8
    static let collectionBottomPadding: CGFloat = 8
    static let sectionSpacing: CGFloat = 6

    // MARK: - Input Bar
    static let inputBarMinHeight: CGFloat = 52
    static let inputBarVPad: CGFloat = 8
    static let inputBarHPad: CGFloat = 8
    static let textViewMinHeight: CGFloat = 36
    static let textViewMaxHeight: CGFloat = 120
    static let textViewCornerRadius: CGFloat = 18
    static let textViewFont: UIFont = .systemFont(ofSize: 16)
    static let inputReplyPanelHeight: CGFloat = 48
    static let inputButtonSize: CGFloat = 36

    // MARK: - FAB
    static let fabSize: CGFloat = 40
    static let fabMargin: CGFloat = 12

    // MARK: - Shadows
    static let bubbleShadowOpacity: Float = 0.12
    static let bubbleShadowRadius: CGFloat = 8

    // MARK: - Audio Recording
    static let recordDotSize: CGFloat = 10
    static let recordTimerFont: UIFont = .monospacedDigitSystemFont(ofSize: 16, weight: .regular)
}
