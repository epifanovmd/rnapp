// MARK: - ChatTheme.swift
// Единственная точка истины для всех визуальных настроек чата.
// Добавление новой темы: создать статический экземпляр ChatTheme ниже.
// Переключение темы: передать нужный ChatTheme в ChatViewController.

import UIKit

// MARK: - ChatTheme

struct ChatTheme {

    // MARK: Bubble — исходящие

    let outgoingBubbleColor:      UIColor
    let outgoingTextColor:        UIColor
    let outgoingTimeColor:        UIColor
    let outgoingStatusColor:      UIColor
    let outgoingStatusReadColor:  UIColor
    let outgoingEditedColor:      UIColor

    // MARK: Bubble — входящие

    let incomingBubbleColor:      UIColor
    let incomingTextColor:        UIColor
    let incomingTimeColor:        UIColor
    let incomingEditedColor:      UIColor

    // MARK: Reply inside bubble

    let outgoingReplyBackground:  UIColor
    let outgoingReplyAccent:      UIColor
    let outgoingReplySender:      UIColor
    let outgoingReplyText:        UIColor

    let incomingReplyBackground:  UIColor
    let incomingReplyAccent:      UIColor
    let incomingReplySender:      UIColor
    let incomingReplyText:        UIColor

    // MARK: Input bar

    let inputBarBackground:       UIColor
    let inputBarSeparator:        UIColor
    let inputBarTextViewBg:       UIColor
    let inputBarPlaceholder:      UIColor
    let inputBarText:             UIColor
    let inputBarTint:             UIColor

    let replyPanelBackground:     UIColor
    let replyPanelAccent:         UIColor
    let replyPanelSender:         UIColor
    let replyPanelText:           UIColor
    let replyPanelClose:          UIColor

    // MARK: Date separator

    let dateSeparatorBackground:  UIColor
    let dateSeparatorText:        UIColor

    // MARK: FAB

    let fabBlurStyle:             UIBlurEffect.Style
    let fabArrowColor:            UIColor

    // MARK: Empty state

    let emptyStateText:           UIColor

    // MARK: Background

    let collectionViewBackground: UIColor

    // MARK: Theme identity

    /// Признак тёмной темы — используется для выбора темы дочерних компонентов
    /// (например, ContextMenuTheme). Позволяет избежать Equatable на UIColor.
    let isDark: Bool
}

// MARK: - Built-in themes

extension ChatTheme {

    /// Светлая тема (используется по умолчанию).
    static let light = ChatTheme(
        outgoingBubbleColor:      UIColor(red: 0.24, green: 0.62, blue: 0.98, alpha: 1),
        outgoingTextColor:        .white,
        outgoingTimeColor:        UIColor.white.withAlphaComponent(0.75),
        outgoingStatusColor:      UIColor.white.withAlphaComponent(0.7),
        outgoingStatusReadColor:  .white,
        outgoingEditedColor:      UIColor.white.withAlphaComponent(0.60),

        incomingBubbleColor:      UIColor(white: 0.94, alpha: 1),
        incomingTextColor:        .label,
        incomingTimeColor:        .secondaryLabel,
        incomingEditedColor:      .secondaryLabel,

        outgoingReplyBackground:  UIColor.white.withAlphaComponent(0.20),
        outgoingReplyAccent:      UIColor.white.withAlphaComponent(0.70),
        outgoingReplySender:      UIColor.white.withAlphaComponent(0.90),
        outgoingReplyText:        UIColor.white.withAlphaComponent(0.85),

        incomingReplyBackground:  UIColor.black.withAlphaComponent(0.06),
        incomingReplyAccent:      .systemBlue,
        incomingReplySender:      .systemBlue,
        incomingReplyText:        .secondaryLabel,

        inputBarBackground:       .systemBackground,
        inputBarSeparator:        UIColor.separator.withAlphaComponent(0.3),
        inputBarTextViewBg:       .systemGray6,
        inputBarPlaceholder:      .placeholderText,
        inputBarText:             .label,
        inputBarTint:             .systemBlue,

        replyPanelBackground:     .systemBackground,
        replyPanelAccent:         .systemBlue,
        replyPanelSender:         .systemBlue,
        replyPanelText:           .secondaryLabel,
        replyPanelClose:          .tertiaryLabel,

        dateSeparatorBackground:  UIColor.systemGray6.withAlphaComponent(0.85),
        dateSeparatorText:        .secondaryLabel,

        fabBlurStyle:             .systemThickMaterial,
        fabArrowColor:            .label,

        emptyStateText:           .secondaryLabel,

        collectionViewBackground: .clear,
        isDark: false
    )
    static let dark = ChatTheme(
        outgoingBubbleColor:      UIColor(red: 0.14, green: 0.45, blue: 0.80, alpha: 1),
        outgoingTextColor:        .white,
        outgoingTimeColor:        UIColor.white.withAlphaComponent(0.65),
        outgoingStatusColor:      UIColor.white.withAlphaComponent(0.6),
        outgoingStatusReadColor:  UIColor.white.withAlphaComponent(0.9),
        outgoingEditedColor:      UIColor.white.withAlphaComponent(0.50),

        incomingBubbleColor:      UIColor(white: 0.18, alpha: 1),
        incomingTextColor:        UIColor(white: 0.93, alpha: 1),
        incomingTimeColor:        UIColor(white: 0.55, alpha: 1),
        incomingEditedColor:      UIColor(white: 0.55, alpha: 1),

        outgoingReplyBackground:  UIColor.white.withAlphaComponent(0.15),
        outgoingReplyAccent:      UIColor.white.withAlphaComponent(0.60),
        outgoingReplySender:      UIColor.white.withAlphaComponent(0.85),
        outgoingReplyText:        UIColor.white.withAlphaComponent(0.75),

        incomingReplyBackground:  UIColor.white.withAlphaComponent(0.08),
        incomingReplyAccent:      UIColor(red: 0.35, green: 0.60, blue: 1.0, alpha: 1),
        incomingReplySender:      UIColor(red: 0.35, green: 0.60, blue: 1.0, alpha: 1),
        incomingReplyText:        UIColor(white: 0.60, alpha: 1),

        inputBarBackground:       UIColor(white: 0.12, alpha: 1),
        inputBarSeparator:        UIColor.white.withAlphaComponent(0.1),
        inputBarTextViewBg:       UIColor(white: 0.22, alpha: 1),
        inputBarPlaceholder:      UIColor(white: 0.45, alpha: 1),
        inputBarText:             UIColor(white: 0.93, alpha: 1),
        inputBarTint:             UIColor(red: 0.35, green: 0.60, blue: 1.0, alpha: 1),

        replyPanelBackground:     UIColor(white: 0.12, alpha: 1),
        replyPanelAccent:         UIColor(red: 0.35, green: 0.60, blue: 1.0, alpha: 1),
        replyPanelSender:         UIColor(red: 0.35, green: 0.60, blue: 1.0, alpha: 1),
        replyPanelText:           UIColor(white: 0.60, alpha: 1),
        replyPanelClose:          UIColor(white: 0.40, alpha: 1),

        dateSeparatorBackground:  UIColor(white: 0.20, alpha: 0.90),
        dateSeparatorText:        UIColor(white: 0.60, alpha: 1),

        fabBlurStyle:             .systemThickMaterialDark,
        fabArrowColor:            UIColor(white: 0.90, alpha: 1),

        emptyStateText:           UIColor(white: 0.50, alpha: 1),

        collectionViewBackground: .clear,
        isDark: true
    )
}
