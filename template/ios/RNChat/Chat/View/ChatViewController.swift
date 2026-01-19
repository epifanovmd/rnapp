//
// ChatLayout
// ChatViewController.swift
// https://github.com/ekazaev/ChatLayout
//
// Created by Eugene Kazaev in 2020-2026.
// Distributed under the MIT license.
//
// Become a sponsor:
// https://github.com/sponsors/ekazaev
//

import DifferenceKit
import Foundation
import UIKit


final class ChatViewController: UIViewController {
  var delegate: ChatControllerDelegate?
  
  var initialScrollId: UUID?      // Только для сообщений
  var initialScrollDate: Date?    // Для перехода к конкретному времени
  var initialScrollIndex: Int?    // По порядковому номеру
  var initialScrollOffset: CGFloat? // Абсолютное смещение от низа
  private var isInitialScrollDone = false
  
  var scrollThreshold: CGFloat = 1.0 // В единицах высоты экрана
  var onScrollUpdateInterval: TimeInterval = 0.1 // Как часто уведомлять о скролле (сек)
  var scrollVelocityThreshold: CGFloat = 2000 // Скорость, выше которой чтение не засчитывается
  
  private var keyboardScrollOffset: CGFloat = 0
  
  var viewabilityConfig = Constants.ViewabilityConfig()
  
  private var lastReportedOffset: CGPoint = .zero
  private var userHasInteracted: Bool = false
  private var lastScrollNotifyTime: TimeInterval = 0
  private var viewTimeTracker: [UUID: TimeInterval] = [:]
  private var lastVisibilityCheckTime: TimeInterval = CACurrentMediaTime()
  
  private enum ReactionTypes {
    case delayedUpdate
  }
  
  private enum InterfaceActions {
    case changingKeyboardFrame
    case changingContentInsets
    case changingFrameSize
    case sendingMessage
    case scrollingToTop
    case scrollingToBottom
    case showingPreview
    case showingAccessory
    case updatingCollectionInIsolation
  }
  
  private enum ControllerActions {
    case loadingInitialMessages
    case loadingPreviousMessages
    case updatingCollection
  }
  
  override var canBecomeFirstResponder: Bool {
    true
  }
  
  private var currentInterfaceActions: SetActor<Set<InterfaceActions>, ReactionTypes> = SetActor()
  private var currentControllerActions: SetActor<Set<ControllerActions>, ReactionTypes> = SetActor()
  
  private var collectionView: UICollectionView!
  private var chatLayout = CollectionViewChatLayout()
  private let dataSource: ChatCollectionDataSource
  private var animator: ManualAnimator?
  
  private lazy var scrollDownButton: UIButton = {
    let button = UIButton(type: .system)
    let config = UIImage.SymbolConfiguration(pointSize: 24, weight: .medium)
    button.setImage(UIImage(systemName: "chevron.down.circle.fill", withConfiguration: config), for: .normal)
    button.tintColor = .systemBlue
    button.backgroundColor = .systemBackground
    button.layer.cornerRadius = 20
    button.layer.shadowColor = UIColor.black.cgColor
    button.layer.shadowOpacity = 0.2
    button.layer.shadowOffset = CGSize(width: 0, height: 2)
    button.layer.shadowRadius = 4
    button.alpha = 0 // Скрыта по умолчанию
    button.translatesAutoresizingMaskIntoConstraints = false
    button.addTarget(self, action: #selector(scrollDownTapped), for: .touchUpInside)
    return button
  }()
  
  private var translationX: CGFloat = 0
  private var currentOffset: CGFloat = 0
  
  init(
    dataSource: ChatCollectionDataSource
  ) {
    self.dataSource = dataSource
    super.init(nibName: nil, bundle: nil)
  }
  
  deinit {
    NotificationCenter.default.removeObserver(self)
  }
  
  @available(*, unavailable, message: "Use init(messageController:) instead")
  override convenience init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: Bundle?) {
    fatalError()
  }
  
  @available(*, unavailable, message: "Use init(messageController:) instead")
  required init?(coder: NSCoder) {
    fatalError()
  }
  
  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .systemBackground
    
    chatLayout.settings.interItemSpacing = 8
    chatLayout.settings.interSectionSpacing = 8
    chatLayout.settings.additionalInsets = UIEdgeInsets(top: 8, left: 5, bottom: 8, right: 5)
    
    chatLayout.keepContentOffsetAtBottomOnBatchUpdates = true
    chatLayout.processOnlyVisibleItemsOnAnimatedBatchUpdates = false
    chatLayout.keepContentAtBottomOfVisibleArea = true
    
    collectionView = UICollectionView(frame: view.frame, collectionViewLayout: chatLayout)
    collectionView.alpha = 0
    
    view.addSubview(collectionView)
    
    collectionView.alwaysBounceVertical = true
    collectionView.dataSource = dataSource
    chatLayout.delegate = dataSource
    collectionView.delegate = self
    collectionView.keyboardDismissMode = .interactive
    collectionView.isPrefetchingEnabled = false
    collectionView.contentInsetAdjustmentBehavior = .always
    collectionView.automaticallyAdjustsScrollIndicatorInsets = true
    //        collectionView.selfSizingInvalidation = .enabled
    //        chatLayout.supportSelfSizingInvalidation = true
    
    collectionView.translatesAutoresizingMaskIntoConstraints = false
    collectionView.frame = view.bounds
    NSLayoutConstraint.activate([
      collectionView.topAnchor.constraint(equalTo: view.topAnchor, constant: 0),
      collectionView.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: 0),
      collectionView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 0),
      collectionView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: 0)
    ])
    collectionView.backgroundColor = .clear
    collectionView.showsHorizontalScrollIndicator = false
    dataSource.prepare(with: collectionView)
    
    setupScrollDownButton()
    KeyboardListener.shared.add(delegate: self)
  }
  
  override func viewWillAppear(_ animated: Bool) {
    super.viewWillAppear(animated)
  }
  
  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    collectionView.collectionViewLayout.invalidateLayout()
  }
  
  override func viewWillTransition(to size: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {
    guard isViewLoaded else {
      return
    }
    
    currentInterfaceActions.options.insert(.changingFrameSize)
    let positionSnapshot = chatLayout.getContentOffsetSnapshot(from: .bottom)
    collectionView.collectionViewLayout.invalidateLayout()
    collectionView.setNeedsLayout()
    coordinator.animate(alongsideTransition: { _ in
      // Gives nicer transition behaviour
      // self.collectionView.collectionViewLayout.invalidateLayout()
      self.collectionView.performBatchUpdates(nil)
    }, completion: { _ in
      if let positionSnapshot,
         !self.isUserInitiatedScrolling {
        // As contentInsets may change when size transition has already started. For example, `UINavigationBar` height may change
        // to compact and back. `CollectionViewChatLayout` may not properly predict the final position of the element. So we try
        // to restore it after the rotation manually.
        self.chatLayout.restoreContentOffset(with: positionSnapshot)
      }
      self.collectionView.collectionViewLayout.invalidateLayout()
      self.currentInterfaceActions.options.remove(.changingFrameSize)
    })
    super.viewWillTransition(to: size, with: coordinator)
  }
  
  private func setupScrollDownButton() {
    view.addSubview(scrollDownButton)
    NSLayoutConstraint.activate([
      scrollDownButton.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -16),
      scrollDownButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16),
      scrollDownButton.widthAnchor.constraint(equalToConstant: 40),
      scrollDownButton.heightAnchor.constraint(equalToConstant: 40)
    ])
  }
  
  @objc private func scrollDownTapped() {
    scrollToBottom()
  }
  
  func setDirectionalLockEnabled(_ enabled: Bool) {
    collectionView.isDirectionalLockEnabled = enabled
  }
  
  func setKeyboardDismissMode(_ mode: UIScrollView.KeyboardDismissMode = .interactive) {
    collectionView.keyboardDismissMode = mode
  }
  
  func setKeyboardScrollOffset(_ offset: CGFloat = 0) {
    print("set offset \(offset)")
    keyboardScrollOffset = offset
  }
  
  func setScrollsToTop(_ enabled: Bool) {
    collectionView.scrollsToTop = enabled
  }
  
  func setShowsVerticalScrollIndicator(_ visible: Bool) {
    collectionView.showsVerticalScrollIndicator = visible
  }
  
  func setScrollEnabled(_ enabled: Bool) {
    collectionView.isScrollEnabled = enabled
  }
}

extension ChatViewController: UIScrollViewDelegate {
  func scrollViewShouldScrollToTop(_ scrollView: UIScrollView) -> Bool {
    guard scrollView.contentSize.height > 0,
          !currentInterfaceActions.options.contains(.showingAccessory),
          !currentInterfaceActions.options.contains(.showingPreview),
          !currentInterfaceActions.options.contains(.scrollingToTop),
          !currentInterfaceActions.options.contains(.scrollingToBottom) else {
      return false
    }
    // Blocking the call of loadPreviousMessages() as UIScrollView behaves the way that it will scroll to the top even if we keep adding
    // content there and keep changing the content offset until it actually reaches the top. So instead we wait until it reaches the top and initiate
    // the loading after.
    currentInterfaceActions.options.insert(.scrollingToTop)
    return true
  }
  
  func scrollViewDidScrollToTop(_ scrollView: UIScrollView) {
    guard !currentControllerActions.options.contains(.loadingInitialMessages),
          !currentControllerActions.options.contains(.loadingPreviousMessages) else {
      return
    }
    currentInterfaceActions.options.remove(.scrollingToTop)
    loadPreviousMessages()
  }
  
  func scrollViewDidScroll(_ scrollView: UIScrollView) {
    updateScrollDownButtonVisibility(scrollView)
    
    guard isUserInitiatedScrolling || scrollView.isZooming else {
      return
    }
    
    let currentTime = CACurrentMediaTime()
    
    handleVisibilityTracking(currentTime: currentTime)
    
    let offsetFromBottom = scrollView.contentSize.height - (scrollView.contentOffset.y + scrollView.frame.height - scrollView.adjustedContentInset.bottom)
    let currentInvertedOffset = CGPoint(x: scrollView.contentOffset.x, y: max(0, offsetFromBottom))
    
    
    if currentTime - lastScrollNotifyTime >= onScrollUpdateInterval {
      if currentInvertedOffset != lastReportedOffset {
        delegate?.onScrollMessages(offset: currentInvertedOffset, contentSize: scrollView.contentSize)
        lastReportedOffset = currentInvertedOffset
        lastScrollNotifyTime = currentTime
      }
    }
    
    if currentControllerActions.options.contains(.updatingCollection), collectionView.isDragging {
      // Interrupting current update animation if user starts to scroll while batchUpdate is performed. It helps to
      // avoid presenting blank area if user scrolls out of the animation rendering area.
      UIView.performWithoutAnimation {
        self.collectionView.performBatchUpdates({}, completion: { _ in
          let context = ChatLayoutInvalidationContext()
          context.invalidateLayoutMetrics = false
          self.collectionView.collectionViewLayout.invalidateLayout(with: context)
        })
      }
    }
    
    guard !currentControllerActions.options.contains(.loadingInitialMessages),
          !currentControllerActions.options.contains(.loadingPreviousMessages),
          !currentInterfaceActions.options.contains(.scrollingToTop),
          !currentInterfaceActions.options.contains(.scrollingToBottom) else {
      return
    }
    
    let thresholdHeight = scrollView.bounds.height * scrollThreshold
    if !currentControllerActions.options.contains(.loadingPreviousMessages),
       scrollView.contentOffset.y <= -scrollView.adjustedContentInset.top + thresholdHeight {
      loadPreviousMessages()
    }
  }
  
  func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
    userHasInteracted = true
    delegate?.onScrollMessagesBeginDrag()
  }
  
  func scrollViewDidEndDragging(_ scrollView: UIScrollView, willowDecelerate decelerate: Bool) {
    if !decelerate {
      delegate?.onScrollMessagesEndDrag()
    }
  }
  
  func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
    delegate?.onMomentumScrollMessagesEnd()
  }
  
  func scrollViewDidEndScrollingAnimation(_ scrollView: UIScrollView) {
    delegate?.onScrollMessagesAnimationEnd()
  }
  
  private func updateScrollDownButtonVisibility(_ scrollView: UIScrollView) {
    // Вычисляем расстояние от низа
    let offsetFromBottom = scrollView.contentSize.height - (scrollView.contentOffset.y + scrollView.frame.height - scrollView.adjustedContentInset.bottom)
    
    // Если до низа больше 300 пикселей — показываем кнопку
    let shouldShow = offsetFromBottom > 300
    
    if (shouldShow && scrollDownButton.alpha == 0) || (!shouldShow && scrollDownButton.alpha == 1) {
      UIView.animate(withDuration: 0.2) {
        self.scrollDownButton.alpha = shouldShow ? 1 : 0
        self.scrollDownButton.transform = shouldShow ? .identity : CGAffineTransform(scaleX: 0.5, y: 0.5)
      }
    }
  }
  
  private func loadPreviousMessages() {
    guard !currentControllerActions.options.contains(.loadingPreviousMessages) else {
      return
    }
    
    currentControllerActions.options.insert(.loadingPreviousMessages)
    
    delegate?.onLoadPreviousMessages { [weak self] in
      // TODO: Убрать костыль в виде задержки и перейти на completion замыкание
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
        self?.currentControllerActions.options.remove(.loadingPreviousMessages)
      }
    }
  }
  
  fileprivate var isUserInitiatedScrolling: Bool {
    collectionView.isDragging || collectionView.isDecelerating
  }
  
  func scrollTo(messageId: UUID? = nil, index: Int? = nil, date: Date? = nil, offset: CGFloat? = nil, animated: Bool = true, completion: (() -> Void)? = nil) {
    animator?.reset()
    animator = nil
    
    // Прерываем системный скролл, если он идет
    collectionView.setContentOffset(collectionView.contentOffset, animated: false)
    
    guard isViewLoaded else {
      initialScrollId = messageId
      initialScrollIndex = index
      initialScrollOffset = offset
      completion?()
      return
    }
    
    let startOffset = collectionView.contentOffset
    var targetOffset: CGPoint?
    
    // 1. Определяем целевой IndexPath или сразу Offset
    if let offset = offset {
      let height = chatLayout.collectionViewContentSize.height
      let viewportHeight = collectionView.frame.height
      let bottomInset = collectionView.adjustedContentInset.bottom
      let topInset = collectionView.adjustedContentInset.top
      let maxAllowed = max(-topInset, height - viewportHeight + bottomInset)
      
      let calculatedY = height - viewportHeight + bottomInset - offset
      targetOffset = CGPoint(x: 0, y: min(maxAllowed, max(-topInset, calculatedY)))
    } else {
      var targetIndexPath: IndexPath?
      
      if let messageId = messageId {
        targetIndexPath = findIndexPath(in: dataSource.sections) { cell in
          if case let .message(msg, _) = cell { return msg.id == messageId }
          return false
        }
      } else if let index = index {
        targetIndexPath = getIndexPath(fromMessageIndex: index, in: dataSource.sections)
      } else if let date = date {
        targetIndexPath = findIndexPath(in: dataSource.sections) { cell in
          if case let .date(grp) = cell { return Calendar.current.isDate(grp.date, inSameDayAs: date) }
          return false
        }
      }
      
      if let indexPath = targetIndexPath {
        // ТРЮК: Вычисляем финальную позицию через мгновенный переход
        let snapshot = ChatLayoutPositionSnapshot(indexPath: indexPath, edge: .top, offset: 0)
        UIView.performWithoutAnimation {
          self.chatLayout.restoreContentOffset(with: snapshot)
          targetOffset = self.collectionView.contentOffset
          // Возвращаем вью в исходное состояние для начала анимации
          self.collectionView.contentOffset = startOffset
        }
      }
    }
    
    // 2. Выполняем анимацию, если цель найдена
    guard let finalPoint = targetOffset else {
      completion?()
      return
    }
    
    if !animated {
      collectionView.setContentOffset(finalPoint, animated: false)
      completion?()
      return
    }
    
    let delta = finalPoint.y - startOffset.y
    if abs(delta) < 0.1 {
      completion?()
      return
    }
    
    // Используем ManualAnimator для длинных дистанций или сложного лейаута
    if abs(delta) > chatLayout.visibleBounds.height {
      animator = ManualAnimator()
      animator?.animate(duration: 0.4, curve: .parametric) { [weak self] percentage in
        guard let self = self else { return }
        self.collectionView.contentOffset.y = startOffset.y + (delta * percentage)
        if percentage == 1.0 {
          self.animator = nil
          completion?()
        }
      }
    } else {
      // Для коротких дистанций стандартная анимация ощущается нативнее
      UIView.animate(withDuration: 0.3, delay: 0, options: [.curveEaseInOut, .allowUserInteraction], animations: {
        self.collectionView.contentOffset = finalPoint
      }, completion: { _ in
        completion?()
      })
    }
  }
  
  func scrollToBottom(animated: Bool = true, completion: (() -> Void)? = nil) {
    let maxOffset = (chatLayout.collectionViewContentSize.height - collectionView.frame.height + collectionView.adjustedContentInset.bottom)
    
    // Проверяем, не находимся ли мы уже внизу (микро-оптимизация)
    let isAtBottom = (collectionView.contentOffset.y >= maxOffset - 1.0)
    
    guard !isAtBottom else {
      completion?()
      return
    }
    
    currentInterfaceActions.options.insert(.scrollingToBottom)
    
    // Вызываем универсальный метод с offset = 0
    scrollTo(offset: 0, animated: animated) { [weak self] in
      self?.currentInterfaceActions.options.remove(.scrollingToBottom)
      completion?()
    }
  }
  
  private func handleVisibilityTracking(currentTime: TimeInterval) {
    // Если waitForInteraction включен и взаимодействия еще не было — выходим
    if viewabilityConfig.waitForInteraction && !userHasInteracted {
      return
    }
    
    let deltaTime = currentTime - lastVisibilityCheckTime
    lastVisibilityCheckTime = currentTime
    
    let visibleRect = CGRect(origin: collectionView.contentOffset, size: collectionView.bounds.size)
    let visibleArea = visibleRect.width * visibleRect.height
    
    var reportableIds: [UUID] = []
    
    for indexPath in collectionView.indexPathsForVisibleItems {
      guard let cell = dataSource.sections[indexPath.section].cells[indexPath.item] as? Cell,
            case let .message(message, _) = cell,
            message.type == .incoming,
            message.status != .read else { continue }
      
      if let attributes = collectionView.layoutAttributesForItem(at: indexPath) {
        let itemFrame = attributes.frame
        let intersection = itemFrame.intersection(visibleRect)
        
        if intersection.isNull {
          viewTimeTracker.removeValue(forKey: message.id)
          continue
        }
        
        // 1. Расчет процента видимости самого элемента (Item Visible Percent)
        let itemVisiblePercent = (intersection.width * intersection.height) / (itemFrame.width * itemFrame.height) * 100
        
        // 2. Расчет покрытия видимой области экрана (View Area Coverage)
        let viewAreaCoveragePercent = (intersection.width * intersection.height) / visibleArea * 100
        
        let isItemVisibleEnough = itemVisiblePercent >= viewabilityConfig.itemVisiblePercentThreshold
        let isAreaCoveredEnough = viewAreaCoveragePercent >= viewabilityConfig.viewAreaCoveragePercentThreshold
        
        if isItemVisibleEnough && isAreaCoveredEnough {
          let totalTime = (viewTimeTracker[message.id] ?? 0) + deltaTime
          viewTimeTracker[message.id] = totalTime
          
          if totalTime >= viewabilityConfig.minimumViewTime {
            reportableIds.append(message.id)
          }
        } else {
          viewTimeTracker.removeValue(forKey: message.id)
        }
      }
    }
    
    if !reportableIds.isEmpty {
      delegate?.onVisibleMessages(reportableIds)
      // Помечаем как обработанные, чтобы не слать повторно в этом цикле жизни видимости
      reportableIds.forEach { id in
        viewTimeTracker[id] = -999999
      }
    }
  }
  
  private func applyInitialScroll(in sections: [Section]) {
    if isInitialScrollDone || sections.isEmpty { return }
    
    // Используем универсальный метод scrollTo для исключения дублирования логики
    if let scrollOffset = initialScrollOffset {
      scrollTo(offset: scrollOffset, animated: false)
      isInitialScrollDone = true
    } else if let scrollId = initialScrollId {
      scrollTo(messageId: scrollId, animated: false)
      isInitialScrollDone = true
    } else if let scrollDate = initialScrollDate {
      scrollTo(date: scrollDate, animated: false)
      isInitialScrollDone = true
    } else if let scrollIndex = initialScrollIndex {
      scrollTo(index: scrollIndex, animated: false)
      isInitialScrollDone = true
    }
  }
  
  private func getIndexPath(fromMessageIndex targetIndex: Int, in sections: [Section]) -> IndexPath? {
    var currentMsgCount = 0
    for (sIndex, section) in sections.enumerated() {
      for (iIndex, cell) in section.cells.enumerated() {
        if case .message = cell {
          if currentMsgCount == targetIndex {
            return IndexPath(item: iIndex, section: sIndex)
          }
          currentMsgCount += 1
        }
      }
    }
    return nil
  }
  
  private func findIndexPath(in sections: [Section], predicate: (Cell) -> Bool) -> IndexPath? {
    for (sIndex, section) in sections.enumerated() {
      if let iIndex = section.cells.firstIndex(where: predicate) {
        return IndexPath(item: iIndex, section: sIndex)
      }
    }
    return nil
  }
}

extension ChatViewController: UICollectionViewDelegate {
  private func preview(for configuration: UIContextMenuConfiguration) -> UITargetedPreview? {
    guard let identifier = configuration.identifier as? String else {
      return nil
    }
    let components = identifier.split(separator: "|")
    guard components.count == 2,
          let sectionIndex = Int(components[0]),
          let itemIndex = Int(components[1]),
          let cell = collectionView.cellForItem(at: IndexPath(item: itemIndex, section: sectionIndex)) as? TextMessageCollectionCell else {
      return nil
    }
    
    let item = dataSource.sections[0].cells[itemIndex]
    switch item {
    case let .message(message, bubbleType: _):
      switch message.data {
      case .text:
        let parameters = UIPreviewParameters()
        // `UITargetedPreview` doesnt support image mask (Why?) like the one I use to mask the message bubble in the example app.
        // So I replaced default `ImageMaskedView` with `BezierMaskedView` that can uses `UIBezierPath` to mask the message view
        // instead. So we are reusing that path here.
        //
        // NB: This way of creating the preview is not valid for long texts as `UITextView` within message view uses `CATiledLayer`
        // to render its content, so it may not render itself fully when it is partly outside the collection view. You will have to
        // recreate a brand new view that will behave as a preview. It is outside of the scope of the example app.
        parameters.visiblePath = cell.customView.customView.customView.maskingPath
        var center = cell.customView.customView.customView.center
        center.x += (message.type.isIncoming ? cell.customView.customView.customView.offset : -cell.customView.customView.customView.offset) / 2
        
        return UITargetedPreview(
          view: cell.customView.customView.customView,
          parameters: parameters,
          target: UIPreviewTarget(container: cell.customView.customView, center: center)
        )
      default:
        return nil
      }
    default:
      return nil
    }
  }
  
  func collectionView(_ collectionView: UICollectionView, previewForHighlightingContextMenuWithConfiguration configuration: UIContextMenuConfiguration) -> UITargetedPreview? {
    preview(for: configuration)
  }
  
  func collectionView(_ collectionView: UICollectionView, previewForDismissingContextMenuWithConfiguration configuration: UIContextMenuConfiguration) -> UITargetedPreview? {
    preview(for: configuration)
  }
  
  func collectionView(_ collectionView: UICollectionView, contextMenuConfigurationForItemAt indexPath: IndexPath, point: CGPoint) -> UIContextMenuConfiguration? {
    guard !currentInterfaceActions.options.contains(.showingPreview),
          !currentControllerActions.options.contains(.updatingCollection) else {
      return nil
    }
    let item = dataSource.sections[indexPath.section].cells[indexPath.item]
    switch item {
    case let .message(message, bubbleType: _):
      switch message.data {
      case let .text(body):
        let copyAction = UIAction(title: "Copy", image: UIImage(systemName: "doc.on.doc")) { _ in
          UIPasteboard.general.string = body
        }
        
        let deleteAction = UIAction(title: "Удалить", image: UIImage(systemName: "trash"), attributes: .destructive) { [weak self] _ in
          self?.delegate?.onDeleteMessage(messageId: message.id)
        }
        
        let menu = UIMenu(title: "", children: [copyAction, deleteAction])
        // Custom NSCopying identifier leads to the crash. No other requirements for the identifier to avoid the crash are provided.
        let identifier: NSString = "\(indexPath.section)|\(indexPath.item)" as NSString
        currentInterfaceActions.options.insert(.showingPreview)
        return UIContextMenuConfiguration(identifier: identifier, previewProvider: nil, actionProvider: { _ in menu })
      default:
        return nil
      }
    default:
      return nil
    }
  }
  
  func collectionView(_ collectionView: UICollectionView, willEndContextMenuInteraction configuration: UIContextMenuConfiguration, animator: UIContextMenuInteractionAnimating?) {
    animator?.addCompletion {
      self.currentInterfaceActions.options.remove(.showingPreview)
    }
  }
}

extension ChatViewController: ChatViewControllerDelegate {
  func update(with sections: [Section], requiresIsolatedProcess: Bool) {
    update(with: sections, requiresIsolatedProcess: requiresIsolatedProcess, animated: true)
  }
  
  func update(with sections: [Section], requiresIsolatedProcess: Bool, animated: Bool) {
    // if `chatLayout.keepContentAtBottomOfVisibleArea` is enabled and content size is actually smaller than the visible size - it is better to process each batch update
    // in isolation. Example: If you insert a cell animatingly and then reload some cell - the reload animation will appear on top of the insertion animation.
    // Basically everytime you see any animation glitches - process batch updates in isolation.
    let requiresIsolatedProcess = chatLayout.keepContentAtBottomOfVisibleArea == true && chatLayout.collectionViewContentSize.height < chatLayout.visibleBounds.height ? true : requiresIsolatedProcess
    processUpdates(with: sections, animated: animated, requiresIsolatedProcess: requiresIsolatedProcess)
  }
  
  private func processUpdates(with sections: [Section], animated: Bool = true, requiresIsolatedProcess: Bool, completion: (() -> Void)? = nil) {
    guard isViewLoaded else {
      dataSource.sections = sections
      return
    }
    
    guard currentInterfaceActions.options.isEmpty else {
      let reaction = SetActor<Set<InterfaceActions>, ReactionTypes>.Reaction(
        type: .delayedUpdate,
        action: .onEmpty,
        executionType: .once,
        actionBlock: { [weak self] in
          guard let self else {
            return
          }
          processUpdates(with: sections, animated: animated, requiresIsolatedProcess: requiresIsolatedProcess, completion: completion)
        }
      )
      currentInterfaceActions.add(reaction: reaction)
      return
    }
    
    func process() {
      // If there is a big amount of changes, it is better to move that calculation out of the main thread.
      // Here is on the main thread for the simplicity.
      let changeSet = StagedChangeset(source: dataSource.sections, target: sections).flattenIfPossible()
      
      guard !changeSet.isEmpty else {
        if !isInitialScrollDone && !sections.isEmpty {
          applyInitialScroll(in: sections)
        }
        completion?()
        return
      }
      
      if requiresIsolatedProcess {
        chatLayout.processOnlyVisibleItemsOnAnimatedBatchUpdates = true
        currentInterfaceActions.options.insert(.updatingCollectionInIsolation)
      }
      currentControllerActions.options.insert(.updatingCollection)
      collectionView.reload(
        using: changeSet,
        interrupt: { changeSet in
          guard changeSet.sectionInserted.isEmpty else {
            return true
          }
          return false
        },
        onInterruptedReload: {
          guard let lastSection = sections.last else {
            self.collectionView.reloadData()
            return
          }
          let positionSnapshot = ChatLayoutPositionSnapshot(indexPath: IndexPath(item: lastSection.cells.count - 1, section: sections.count - 1), edge: .bottom)
          self.collectionView.reloadData()
          // We want so that user on reload appeared at the very bottom of the layout
          self.chatLayout.restoreContentOffset(with: positionSnapshot)
        },
        completion: { _ in
          DispatchQueue.main.async {
            self.chatLayout.processOnlyVisibleItemsOnAnimatedBatchUpdates = false
            if requiresIsolatedProcess {
              self.currentInterfaceActions.options.remove(.updatingCollectionInIsolation)
            }
            
            if !self.isInitialScrollDone {
              self.applyInitialScroll(in: sections)
              UIView.animate(withDuration: 0.2) {
                self.collectionView.alpha = 1
              }
            }
            
            completion?()
            self.currentControllerActions.options.remove(.updatingCollection)
          }
        },
        setData: { data in
          self.dataSource.sections = data
        }
      )
    }
    
    if animated {
      process()
    } else {
      UIView.performWithoutAnimation {
        process()
      }
    }
  }
}

extension ChatViewController: KeyboardListenerDelegate {
  func keyboardWillChangeFrame(info: KeyboardInfo) {
    guard !currentInterfaceActions.options.contains(.changingFrameSize),
          collectionView.contentInsetAdjustmentBehavior != .never else {
      return
    }
    
    // Если пользователь активно скроллит - не вмешиваемся
    guard !isUserInitiatedScrolling else {
      return
    }
    
    currentInterfaceActions.options.insert(.changingKeyboardFrame)
    
    let keyboardHeight = info.frameEnd.height
    let isKeyboardVisible = keyboardHeight > 0
    
    if isKeyboardVisible {
      // Клавиатура показывается - ВСЕГДА поднимаем контент
      guard let keyboardFrame = collectionView.window?.convert(info.frameEnd, to: view),
            keyboardFrame.minY > 0 else {
        currentInterfaceActions.options.remove(.changingKeyboardFrame)
        return
      }
      
      // Вычисляем высоту клавиатуры над safe area
      let keyboardTop = keyboardFrame.minY
      let visibleAreaBottom = collectionView.frame.maxY - collectionView.safeAreaInsets.bottom
      let keyboardOverlap = visibleAreaBottom - keyboardTop
      
      if keyboardOverlap > 0 {
        // НОВОЕ: Добавляем текущий keyboardScrollOffset к смещению
        let neededOffset = keyboardOverlap + keyboardScrollOffset
        
        var targetOffset = collectionView.contentOffset
        targetOffset.y = collectionView.contentOffset.y + neededOffset
        
        // Ограничиваем максимальное значение
        let maxOffset = chatLayout.collectionViewContentSize.height -
        collectionView.bounds.height +
        collectionView.contentInset.bottom
        targetOffset.y = min(targetOffset.y, maxOffset)
        
        // Не даём уйти выше нуля (с учетом contentInset)
        targetOffset.y = max(targetOffset.y, -collectionView.contentInset.top)
        
        
        // Анимируем изменение позиции скролла
        UIView.animate(withDuration: info.animationDuration, animations: {
          self.collectionView.contentOffset = targetOffset
        }, completion: { _ in
          self.currentInterfaceActions.options.remove(.changingKeyboardFrame)
        })
      } else {
        currentInterfaceActions.options.remove(.changingKeyboardFrame)
      }
    } else {
      // Клавиатура скрывается - ВСЕГДА возвращаем контент обратно
      let neededOffset = info.frameEnd.origin.y - info.frameBegin.origin.y
      
      var targetOffset = collectionView.contentOffset
      // НОВОЕ: Учитываем накопленное смещение при возврате
      targetOffset.y = collectionView.contentOffset.y + neededOffset - keyboardScrollOffset
      
      // Ограничиваем максимальное значение
      let maxOffset = chatLayout.collectionViewContentSize.height -
      collectionView.bounds.height +
      collectionView.contentInset.bottom
      targetOffset.y = min(targetOffset.y, maxOffset)
      
      // Не даём уйти выше нуля (с учетом contentInset)
      targetOffset.y = max(targetOffset.y, -collectionView.contentInset.top)
      
      if targetOffset != collectionView.contentOffset {
        UIView.animate(withDuration: info.animationDuration, animations: {
          self.collectionView.contentOffset = targetOffset
        }, completion: { _ in
          self.currentInterfaceActions.options.remove(.changingKeyboardFrame)
        })
      } else {
        currentInterfaceActions.options.remove(.changingKeyboardFrame)
      }
    }
  }
  
  func keyboardDidChangeFrame(info: KeyboardInfo) {
    guard currentInterfaceActions.options.contains(.changingKeyboardFrame) else {
      return
    }
    currentInterfaceActions.options.remove(.changingKeyboardFrame)
  }
}
