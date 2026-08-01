import IOSChatView
import UIKit
import React

final class RNInputBar: UIView {

    // MARK: - Event Handlers

    @objc var onSendMessage: RCTDirectEventBlock?
    @objc var onEditMessage: RCTDirectEventBlock?
    @objc var onCancelInputAction: RCTDirectEventBlock?
    @objc var onAttachmentPress: RCTDirectEventBlock?
    @objc var onVoiceRecordingComplete: RCTDirectEventBlock?
    @objc var onInputTyping: RCTDirectEventBlock?
    @objc var onRecordingStateChange: RCTDirectEventBlock?
    @objc var onHeightChange: RCTDirectEventBlock?

    // MARK: - Props

    @objc var theme: NSString = "light" {
        didSet { applyCurrentTheme() }
    }

    @objc var placeholder: NSString? {
        didSet {
            if let text = placeholder as? String {
                inputBar.placeholder = text
            }
        }
    }

    @objc var inputAction: NSDictionary? {
        didSet { applyInputAction() }
    }

    // MARK: - Internal

    private let inputBar = InputBarView()
    private var isSetup = false

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) { fatalError() }

    private func setup() {
        guard !isSetup else { return }
        isSetup = true

        inputBar.delegate = self
        inputBar.translatesAutoresizingMaskIntoConstraints = false
        addSubview(inputBar)

        // Панель растёт вверх от нижнего края, как в чате: снизу — required-пин,
        // сверху — .defaultLow. Высоту RN-фрейма задаёт хост по onHeightChange,
        // и она по определению отстаёт от контента на кадр; если бы панель была
        // прибита к верху, на этот кадр она уезжала бы вниз (за клавиатуру), а
        // потом дёргалась обратно. С нижним якорем лаг не виден: панель сразу
        // раскрывается вверх в своей натуральной высоте (RN-вью не клипует
        // содержимое), а фрейм молча догоняет следующим кадром.
        //
        // Верхний пин слабее внутренних констрейнтов пода (.defaultHigh), чтобы
        // слишком большой фрейм не растягивал панель — она всегда своей высоты
        // и всегда прижата к низу.
        let top = inputBar.topAnchor.constraint(equalTo: topAnchor)

        top.priority = .defaultLow

        NSLayoutConstraint.activate([
            top,
            inputBar.leadingAnchor.constraint(equalTo: leadingAnchor),
            inputBar.trailingAnchor.constraint(equalTo: trailingAnchor),
            inputBar.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])

        applyCurrentTheme()
    }

    // MARK: - Theme

    private func applyCurrentTheme() {
        let barTheme: InputBarTheme = (theme == "dark") ? .dark : .light
        inputBar.applyTheme(barTheme)
    }

    // MARK: - Commands

    func clearInput() {
        inputBar.clearInput()
        scheduleHeightReport()
    }

    func focus() {
        inputBar.activateKeyboard()
    }

    func blur() {
        inputBar.dismissKeyboard()
    }

    // MARK: - Input Action

    private func applyInputAction() {
        defer { scheduleHeightReport() }

        guard let dict = inputAction else {
            inputBar.cancelMode()
            return
        }
        let type = dict["type"] as? String ?? "none"

        switch type {
        case "reply":
            let info = InputBarReplyInfo(
                messageId: dict["messageId"] as? String ?? "",
                senderName: dict["senderName"] as? String,
                text: dict["text"] as? String,
                hasImage: dict["hasImage"] as? Bool ?? false
            )
            inputBar.beginReply(info: info)
        case "edit":
            let messageId = dict["messageId"] as? String ?? ""
            let text = dict["text"] as? String ?? ""
            inputBar.beginEdit(messageId: messageId, text: text)
        default:
            inputBar.cancelMode()
        }
    }

    // MARK: - Высота

    /// Панель управляет своей высотой через Auto Layout, но под Fabric RN-вью
    /// в измерении Yoga не участвует (intrinsicContentSize никто не спросит) —
    /// высоту фрейма задаёт хост по `onHeightChange`. Поэтому пересчитываем её
    /// сами и сообщаем наверх.
    private var lastReportedHeight: CGFloat = 0
    private var pendingShrinkReport: DispatchWorkItem?

    /// Под анимирует изменение своей высоты сам (панель ответа: 0.25 с на показ,
    /// 0.2 с на скрытие). Ждём чуть дольше, прежде чем отдать RN уменьшение.
    private static let shrinkReportDelay: TimeInterval = 0.3

    private func measuredHeight() -> CGFloat {
        let width = bounds.width > 0 ? bounds.width : UIScreen.main.bounds.width

        return inputBar.systemLayoutSizeFitting(
            CGSize(width: width, height: UIView.layoutFittingCompressedSize.height),
            withHorizontalFittingPriority: .required,
            verticalFittingPriority: .fittingSizeLevel
        ).height
    }

    private func applyHeight(_ height: CGFloat) {
        lastReportedHeight = height
        onHeightChange?(["height": height])
    }

    /// Отчёт асимметричный, потому что асимметричны последствия:
    /// - рост отдаём сразу — маленький фрейм обрезает панель от тапов;
    /// - уменьшение откладываем до конца собственной анимации пода. RN-коммит
    ///   меняет фрейм без анимации, и если сделать это посреди анимации, под
    ///   переложится в конечную геометрию рывком. Пока фрейм больше нужного,
    ///   не видно ничего: панель прижата к его нижнему краю.
    private func reportHeight() {
        let height = measuredHeight()

        guard height > 0, abs(height - lastReportedHeight) > 0.5 else { return }

        pendingShrinkReport?.cancel()
        pendingShrinkReport = nil

        guard height < lastReportedHeight else {
            applyHeight(height)
            return
        }

        let work = DispatchWorkItem { [weak self] in
            guard let self else { return }

            self.pendingShrinkReport = nil

            let current = self.measuredHeight()

            guard current > 0, abs(current - self.lastReportedHeight) > 0.5 else { return }

            self.applyHeight(current)
        }

        pendingShrinkReport = work
        DispatchQueue.main.asyncAfter(deadline: .now() + Self.shrinkReportDelay, execute: work)
    }

    /// Контент меняется внутри пода (панель ответа, рост текста, строка записи),
    /// фрейм RN-вью при этом не трогается — значит `layoutSubviews` сам не
    /// вызовется и высота осталась бы от прошлого состояния. Констрейнты под
    /// проставляет синхронно (анимирует только их применение), поэтому хватает
    /// одного тика — без `layoutIfNeeded`, который оборвал бы анимацию.
    private func scheduleHeightReport() {
        DispatchQueue.main.async { [weak self] in
            self?.reportHeight()
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        reportHeight()
    }

    deinit {
        pendingShrinkReport?.cancel()
    }
}

// MARK: - InputBarDelegate

extension RNInputBar: InputBarDelegate {
    func inputBarDidSend(text: String, replyToId: String?) {
        var data: [String: Any] = ["text": text]
        if let id = replyToId { data["replyToId"] = id }
        onSendMessage?(data)
        scheduleHeightReport()
    }

    func inputBarDidEdit(text: String, messageId: String) {
        onEditMessage?(["text": text, "messageId": messageId])
    }

    func inputBarDidCancelMode(type: String) {
        onCancelInputAction?(["type": type])
        scheduleHeightReport()
    }

    func inputBarDidTapAttachment() {
        onAttachmentPress?([:])
    }

    func inputBarDidCompleteVoiceRecording(fileURL: URL, duration: TimeInterval, waveform: [Float]) {
        onVoiceRecordingComplete?([
            "fileUrl": fileURL.absoluteString,
            "duration": duration,
            "waveform": waveform.map { Double($0) },
        ])
    }

    func inputBarDidChangeText(_ text: String) {
        onInputTyping?(["text": text])
        // Многострочный ввод растит поле — высота панели меняется вместе с ним.
        scheduleHeightReport()
    }

    func inputBarRecordingStateChanged(isRecording: Bool) {
        onRecordingStateChange?(["isRecording": isRecording])
        scheduleHeightReport()
    }
}
