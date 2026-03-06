// MARK: - ContextMenuTheme.swift
// Автономная тема для кастомного контекстного меню.
// Полностью независима от ChatTheme — может использоваться с любым View.

import UIKit

// MARK: - ContextMenuTheme

public struct ContextMenuTheme {

    // MARK: Backdrop

    public let backdropColor: UIColor
    public let backdropBlurStyle: UIBlurEffect.Style

    // MARK: Emoji panel

    public let emojiPanelBackground: UIColor
    public let emojiPanelCornerRadius: CGFloat
    public let emojiPanelShadowColor: UIColor
    public let emojiPanelShadowOpacity: Float
    public let emojiPanelShadowRadius: CGFloat
    public let emojiFontSize: CGFloat
    public let emojiItemSize: CGFloat

    // MARK: Action menu

    public let menuBackground: UIColor
    public let menuCornerRadius: CGFloat
    public let menuShadowColor: UIColor
    public let menuShadowOpacity: Float
    public let menuShadowRadius: CGFloat
    public let menuSeparatorColor: UIColor

    public let actionTitleFont: UIFont
    public let actionTitleColor: UIColor
    public let actionDestructiveTitleColor: UIColor
    public let actionIconColor: UIColor
    public let actionDestructiveIconColor: UIColor
    public let actionItemHeight: CGFloat
    public let actionHorizontalPadding: CGFloat
    public let actionHighlightColor: UIColor

    // MARK: Animation

    public let openDuration: TimeInterval
    public let closeDuration: TimeInterval
    public let springDamping: CGFloat
    public let springVelocity: CGFloat

    // MARK: Layout

    public let emojiPanelSpacing: CGFloat   // расстояние между emoji-панелью и пузырём
    public let menuSpacing: CGFloat         // расстояние между пузырём и меню
    public let horizontalPadding: CGFloat   // отступы от краёв экрана
    public let verticalPadding: CGFloat     // отступы от safe area
    public let menuWidth: CGFloat

    public init(
        backdropColor: UIColor,
        backdropBlurStyle: UIBlurEffect.Style,
        emojiPanelBackground: UIColor,
        emojiPanelCornerRadius: CGFloat,
        emojiPanelShadowColor: UIColor,
        emojiPanelShadowOpacity: Float,
        emojiPanelShadowRadius: CGFloat,
        emojiFontSize: CGFloat,
        emojiItemSize: CGFloat,
        menuBackground: UIColor,
        menuCornerRadius: CGFloat,
        menuShadowColor: UIColor,
        menuShadowOpacity: Float,
        menuShadowRadius: CGFloat,
        menuSeparatorColor: UIColor,
        actionTitleFont: UIFont,
        actionTitleColor: UIColor,
        actionDestructiveTitleColor: UIColor,
        actionIconColor: UIColor,
        actionDestructiveIconColor: UIColor,
        actionItemHeight: CGFloat,
        actionHorizontalPadding: CGFloat,
        actionHighlightColor: UIColor,
        openDuration: TimeInterval,
        closeDuration: TimeInterval,
        springDamping: CGFloat,
        springVelocity: CGFloat,
        emojiPanelSpacing: CGFloat,
        menuSpacing: CGFloat,
        horizontalPadding: CGFloat,
        verticalPadding: CGFloat,
        menuWidth: CGFloat
    ) {
        self.backdropColor              = backdropColor
        self.backdropBlurStyle          = backdropBlurStyle
        self.emojiPanelBackground       = emojiPanelBackground
        self.emojiPanelCornerRadius     = emojiPanelCornerRadius
        self.emojiPanelShadowColor      = emojiPanelShadowColor
        self.emojiPanelShadowOpacity    = emojiPanelShadowOpacity
        self.emojiPanelShadowRadius     = emojiPanelShadowRadius
        self.emojiFontSize              = emojiFontSize
        self.emojiItemSize              = emojiItemSize
        self.menuBackground             = menuBackground
        self.menuCornerRadius           = menuCornerRadius
        self.menuShadowColor            = menuShadowColor
        self.menuShadowOpacity          = menuShadowOpacity
        self.menuShadowRadius           = menuShadowRadius
        self.menuSeparatorColor         = menuSeparatorColor
        self.actionTitleFont            = actionTitleFont
        self.actionTitleColor           = actionTitleColor
        self.actionDestructiveTitleColor = actionDestructiveTitleColor
        self.actionIconColor            = actionIconColor
        self.actionDestructiveIconColor = actionDestructiveIconColor
        self.actionItemHeight           = actionItemHeight
        self.actionHorizontalPadding    = actionHorizontalPadding
        self.actionHighlightColor       = actionHighlightColor
        self.openDuration               = openDuration
        self.closeDuration              = closeDuration
        self.springDamping              = springDamping
        self.springVelocity             = springVelocity
        self.emojiPanelSpacing          = emojiPanelSpacing
        self.menuSpacing                = menuSpacing
        self.horizontalPadding          = horizontalPadding
        self.verticalPadding            = verticalPadding
        self.menuWidth                  = menuWidth
    }
}

// MARK: - Built-in themes

public extension ContextMenuTheme {

    static let light = ContextMenuTheme(
        backdropColor:               UIColor.black.withAlphaComponent(0.3),
        backdropBlurStyle:           .systemUltraThinMaterial,
        emojiPanelBackground:        UIColor.systemBackground,
        emojiPanelCornerRadius:      16,
        emojiPanelShadowColor:       .black,
        emojiPanelShadowOpacity:     0.10,
        emojiPanelShadowRadius:      12,
        emojiFontSize:               20,
        emojiItemSize:               32,
        menuBackground:              UIColor.systemBackground,
        menuCornerRadius:            12,
        menuShadowColor:             .black,
        menuShadowOpacity:           0.10,
        menuShadowRadius:            16,
        menuSeparatorColor:          UIColor.separator.withAlphaComponent(0.5),
        actionTitleFont:             .systemFont(ofSize: 15),
        actionTitleColor:            .label,
        actionDestructiveTitleColor: .systemRed,
        actionIconColor:             .label,
        actionDestructiveIconColor:  .systemRed,
        actionItemHeight:            38,
        actionHorizontalPadding:     14,
        actionHighlightColor:        UIColor.systemGray5,
        openDuration:                0.40,
        closeDuration:               0.26,
        springDamping:               0.82,
        springVelocity:              0.5,
        emojiPanelSpacing:           6,
        menuSpacing:                 6,
        horizontalPadding:           12,
        verticalPadding:             10,
        menuWidth:                   220
    )

    static let dark = ContextMenuTheme(
        backdropColor:               UIColor.black.withAlphaComponent(0.5),
        backdropBlurStyle:           .systemUltraThinMaterialDark,
        emojiPanelBackground:        UIColor(white: 0.15, alpha: 1),
        emojiPanelCornerRadius:      16,
        emojiPanelShadowColor:       .black,
        emojiPanelShadowOpacity:     0.35,
        emojiPanelShadowRadius:      16,
        emojiFontSize:               20,
        emojiItemSize:               32,
        menuBackground:              UIColor(white: 0.15, alpha: 1),
        menuCornerRadius:            12,
        menuShadowColor:             .black,
        menuShadowOpacity:           0.45,
        menuShadowRadius:            20,
        menuSeparatorColor:          UIColor.white.withAlphaComponent(0.12),
        actionTitleFont:             .systemFont(ofSize: 15),
        actionTitleColor:            UIColor(white: 0.92, alpha: 1),
        actionDestructiveTitleColor: UIColor(red: 1.0, green: 0.35, blue: 0.35, alpha: 1),
        actionIconColor:             UIColor(white: 0.92, alpha: 1),
        actionDestructiveIconColor:  UIColor(red: 1.0, green: 0.35, blue: 0.35, alpha: 1),
        actionItemHeight:            38,
        actionHorizontalPadding:     14,
        actionHighlightColor:        UIColor(white: 0.25, alpha: 1),
        openDuration:                0.40,
        closeDuration:               0.26,
        springDamping:               0.82,
        springVelocity:              0.5,
        emojiPanelSpacing:           6,
        menuSpacing:                 6,
        horizontalPadding:           12,
        verticalPadding:             10,
        menuWidth:                   220
    )
}
