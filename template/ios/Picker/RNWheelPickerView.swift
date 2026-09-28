import React
import UIKit

/// Колесо выбора на UICollectionView: переиспользуемые ячейки, цилиндрическая
/// развёртка в слое, снап по центру, бесконечная прокрутка и жёсткий упор в
/// недоступные элементы.
@objc(RNWheelPickerView)
final class RNWheelPickerView: UIView {

  // MARK: - Модель

  struct Item {
    let label: String
    let value: String
    let disabled: Bool
    let color: UIColor?
  }

  private enum ScrollState: Int {
    case idle = 0
    case dragging = 1
    case settling = 2
  }

  /// Число повторов набора в режиме бесконечной прокрутки.
  private static let loopCycles = 201

  // MARK: - Данные

  private var parsedItems: [Item] = []
  private var currentIndex: Int = 0
  private var isApplyingProps = false
  private var didLayoutOnce = false
  private var pendingScrollToIndex: Int?
  private var lastEmittedIndex: Int = -1
  private var lastScrollEventTime: CFTimeInterval = 0
  private var allowedRange: ClosedRange<Int>?
  private var needsReload = false
  private let feedback = UISelectionFeedbackGenerator()

  private var cycles: Int { loop && parsedItems.count > 1 ? Self.loopCycles : 1 }
  private var rowCount: Int { parsedItems.count * cycles }
  private var rowHeight: CGFloat { max(itemHeight.doubleValue.cgFloat, 1) + itemSpacing.doubleValue.cgFloat }

  // MARK: - Props: данные и поведение

  @objc var items: NSArray = [] {
    didSet { parseItems() }
  }

  /// Позиция берётся из props целиком в `didSetProps`, вместе с новым набором.
  @objc var selectedIndex: NSNumber = 0

  @objc var loop: Bool = false {
    didSet { needsReload = true }
  }

  @objc var enabled: Bool = true {
    didSet { collectionView.isScrollEnabled = enabled }
  }

  @objc var stopAtDisabled: Bool = true {
    didSet { updateAllowedRange() }
  }

  @objc var haptics: Bool = true

  @objc var scrollEventThrottle: NSNumber = 0

  // MARK: - Props: геометрия

  @objc var itemHeight: NSNumber = 44 {
    didSet { invalidateGeometry() }
  }

  @objc var visibleItemCount: NSNumber = 5

  @objc var itemSpacing: NSNumber = 0 {
    didSet { invalidateGeometry() }
  }

  // MARK: - Props: текст

  @objc var itemColor: UIColor? { didSet { needsReload = true } }
  @objc var selectedItemColor: UIColor? { didSet { needsReload = true } }
  @objc var disabledItemColor: UIColor? { didSet { needsReload = true } }
  @objc var fontSize: NSNumber = 20 { didSet { needsReload = true } }
  @objc var selectedFontSize: NSNumber = 20 { didSet { needsReload = true } }
  @objc var fontFamily: NSString? { didSet { needsReload = true } }
  @objc var fontWeight: NSString = "normal" { didSet { needsReload = true } }
  @objc var selectedFontWeight: NSString = "normal" { didSet { needsReload = true } }
  @objc var textAlign: NSString = "center" { didSet { needsReload = true } }
  @objc var numberOfLines: NSNumber = 1 { didSet { needsReload = true } }
  @objc var itemPaddingHorizontal: NSNumber = 8 { didSet { needsReload = true } }

  // MARK: - Props: объём

  @objc var curvature: NSNumber = 1 { didSet { layout.curvature = curvature.doubleValue.cgFloat; layout.invalidateLayout() } }
  @objc var edgeOpacity: NSNumber = 0.25 { didSet { layout.edgeOpacity = edgeOpacity.doubleValue.cgFloat; layout.invalidateLayout() } }
  @objc var edgeScale: NSNumber = 0.8 { didSet { layout.edgeScale = edgeScale.doubleValue.cgFloat; layout.invalidateLayout() } }

  // MARK: - Props: индикатор и шторка

  @objc var indicatorVisible: Bool = true { didSet { setNeedsLayout() } }
  @objc var indicatorColor: UIColor? { didSet { setNeedsLayout() } }
  @objc var indicatorSize: NSNumber = 1 { didSet { setNeedsLayout() } }
  @objc var indicatorStyle: NSString = "fill" { didSet { setNeedsLayout() } }
  @objc var indicatorRadius: NSNumber = 0 { didSet { setNeedsLayout() } }
  @objc var indicatorInset: NSNumber = 0 { didSet { setNeedsLayout() } }
  @objc var curtainVisible: Bool = false { didSet { setNeedsLayout() } }
  @objc var curtainColor: UIColor? { didSet { setNeedsLayout() } }
  @objc var curtainRadius: NSNumber = 0 { didSet { setNeedsLayout() } }

  // MARK: - События

  @objc var onValueChange: RCTDirectEventBlock?
  @objc var onScrollStateChange: RCTDirectEventBlock?
  @objc var onScroll: RCTDirectEventBlock?
  @objc var onItemPress: RCTDirectEventBlock?

  // MARK: - Вью

  private let layout = WheelLayout()
  private lazy var collectionView: UICollectionView = {
    let view = UICollectionView(frame: .zero, collectionViewLayout: layout)
    view.backgroundColor = .clear
    view.showsVerticalScrollIndicator = false
    view.showsHorizontalScrollIndicator = false
    view.decelerationRate = .fast
    view.dataSource = self
    view.delegate = self
    view.register(WheelCell.self, forCellWithReuseIdentifier: WheelCell.reuseId)
    return view
  }()

  private let topCurtain = UIView()
  private let bottomCurtain = UIView()
  private let indicatorTop = UIView()
  private let indicatorBottom = UIView()
  private let indicatorBox = UIView()

  // MARK: - Жизненный цикл

  override init(frame: CGRect) {
    super.init(frame: frame)
    addSubview(collectionView)
    [topCurtain, bottomCurtain, indicatorBox, indicatorTop, indicatorBottom].forEach {
      $0.isUserInteractionEnabled = false
      addSubview($0)
    }
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) { fatalError("init(coder:) is not supported") }

  override func layoutSubviews() {
    super.layoutSubviews()

    collectionView.frame = bounds
    layout.itemHeight = rowHeight
    layout.itemSpacing = itemSpacing.doubleValue.cgFloat
    layout.viewportHeight = bounds.height
    layout.width = bounds.width

    let inset = max((bounds.height - rowHeight) / 2, 0)
    collectionView.contentInset = UIEdgeInsets(top: inset, left: 0, bottom: inset, right: 0)
    layout.invalidateLayout()

    layoutDecorations()

    if !didLayoutOnce, bounds.height > 0 {
      didLayoutOnce = true
      collectionView.reloadData()
      scroll(to: pendingScrollToIndex ?? selectedIndex.intValue, animated: false)
      pendingScrollToIndex = nil
    }
  }

  // MARK: - Публичные команды

  @objc func scrollToIndex(_ index: Int, animated: Bool) {
    guard didLayoutOnce else {
      pendingScrollToIndex = index
      return
    }
    scroll(to: index, animated: animated)
  }

  // MARK: - Props → состояние

  /// Props применяются пачкой: набор и позиция обновляются одним проходом.
  override func didSetProps(_ changedProps: [String]!) {
    guard didLayoutOnce else { return }

    let reloaded = needsReload

    if needsReload {
      needsReload = false
      collectionView.reloadData()
    }

    let target = min(max(selectedIndex.intValue, 0), max(parsedItems.count - 1, 0))

    // Пока колесо под пальцем, props его не перепозиционируют.
    let isIdle = !collectionView.isDragging && !collectionView.isDecelerating

    if isIdle, reloaded || target != currentIndex {
      isApplyingProps = true
      scroll(to: target, animated: !reloaded)
      isApplyingProps = false
    }

    updateAllowedRange()
    setNeedsLayout()
  }

  private func parseItems() {
    parsedItems = items.compactMap { raw in
      guard let dict = raw as? NSDictionary else { return nil }
      let label = dict["label"] as? String ?? ""
      let value = dict["value"] as? String ?? label
      let disabled = dict["disabled"] as? Bool ?? false
      let color = dict["color"].flatMap { RCTConvert.uiColor($0) }
      return Item(label: label, value: value, disabled: disabled, color: color)
    }

    needsReload = true
  }

  private func invalidateGeometry() {
    needsReload = true
    setNeedsLayout()
  }

  // MARK: - Прокрутка

  /// `silent` — прокрутка от props: не считается выбором пользователя.
  private func scroll(to index: Int, animated: Bool, silent: Bool = true) {
    guard !parsedItems.isEmpty, rowHeight > 0 else { return }

    let clamped = min(max(index, 0), parsedItems.count - 1)
    let row = loop ? parsedItems.count * (cycles / 2) + clamped : clamped
    let offset = CGPoint(x: 0, y: CGFloat(row) * rowHeight - collectionView.contentInset.top)

    collectionView.setContentOffset(offset, animated: animated)

    currentIndex = clamped

    if silent {
      lastEmittedIndex = clamped
    }

    updateAllowedRange()
  }

  private func centeredRow() -> Int {
    guard rowHeight > 0 else { return 0 }
    let center = collectionView.contentOffset.y + collectionView.contentInset.top

    return Int((center / rowHeight).rounded())
  }

  private func index(forRow row: Int) -> Int {
    guard !parsedItems.isEmpty else { return 0 }
    let normalized = row % parsedItems.count

    return normalized < 0 ? normalized + parsedItems.count : normalized
  }

  private func offset(forRow row: Int) -> CGFloat {
    CGFloat(row) * rowHeight - collectionView.contentInset.top
  }

  /// Диапазон строк, доступных из текущего положения: упирается в ближайшие
  /// недоступные элементы сверху и снизу.
  private func updateAllowedRange() {
    guard stopAtDisabled, !loop, !parsedItems.isEmpty else {
      allowedRange = nil
      return
    }

    var lower = currentIndex
    while lower - 1 >= 0, !parsedItems[lower - 1].disabled { lower -= 1 }

    var upper = currentIndex
    while upper + 1 < parsedItems.count, !parsedItems[upper + 1].disabled { upper += 1 }

    // Без недоступных элементов ограничивать нечего — кламп не вмешивается.
    allowedRange = lower == 0 && upper == parsedItems.count - 1 ? nil : lower...upper
  }

  private func clampOffsetIfNeeded() {
    guard let range = allowedRange else { return }

    let minOffset = offset(forRow: range.lowerBound)
    let maxOffset = offset(forRow: range.upperBound)
    let current = collectionView.contentOffset.y

    if current < minOffset {
      collectionView.setContentOffset(CGPoint(x: 0, y: minOffset), animated: false)
    } else if current > maxOffset {
      collectionView.setContentOffset(CGPoint(x: 0, y: maxOffset), animated: false)
    }
  }

  private func recenterIfNeeded() {
    guard loop, !parsedItems.isEmpty else { return }

    let cycleHeight = CGFloat(parsedItems.count) * rowHeight
    let total = CGFloat(rowCount) * rowHeight
    let y = collectionView.contentOffset.y

    if y < cycleHeight {
      collectionView.setContentOffset(CGPoint(x: 0, y: y + cycleHeight * CGFloat(cycles / 2)), animated: false)
    } else if y > total - cycleHeight * 2 {
      collectionView.setContentOffset(CGPoint(x: 0, y: y - cycleHeight * CGFloat(cycles / 2)), animated: false)
    }
  }

  // MARK: - События

  private func emitState(_ state: ScrollState) {
    guard let onScrollStateChange else { return }
    onScrollStateChange([
      "state": state.rawValue,
      "index": currentIndex,
      "value": parsedItems.indices.contains(currentIndex) ? parsedItems[currentIndex].value : "",
    ])
  }

  private func emitChangeIfNeeded(fromUser: Bool) {
    guard parsedItems.indices.contains(currentIndex), currentIndex != lastEmittedIndex else { return }

    lastEmittedIndex = currentIndex
    onValueChange?([
      "index": currentIndex,
      "value": parsedItems[currentIndex].value,
      "fromUser": fromUser,
    ])
  }

  private func emitScrollIfNeeded() {
    let throttle = scrollEventThrottle.doubleValue

    guard throttle > 0, let onScroll, rowHeight > 0 else { return }

    let now = CACurrentMediaTime()

    guard (now - lastScrollEventTime) * 1000 >= throttle else { return }

    lastScrollEventTime = now
    let raw = (collectionView.contentOffset.y + collectionView.contentInset.top) / rowHeight

    onScroll([
      "offset": Double(raw),
      "index": index(forRow: Int(raw.rounded())),
    ])
  }

  // MARK: - Индикатор и шторка

  private func layoutDecorations() {
    let bandHeight = rowHeight
    let bandTop = (bounds.height - bandHeight) / 2
    let inset = indicatorInset.doubleValue.cgFloat
    let thickness = indicatorSize.doubleValue.cgFloat
    let style = indicatorStyle as String
    let color = indicatorColor ?? UIColor.separator

    topCurtain.isHidden = !curtainVisible
    bottomCurtain.isHidden = !curtainVisible

    if curtainVisible {
      let curtain = curtainColor ?? UIColor.black.withAlphaComponent(0.05)

      topCurtain.backgroundColor = curtain
      bottomCurtain.backgroundColor = curtain
      topCurtain.frame = CGRect(x: 0, y: 0, width: bounds.width, height: bandTop)
      bottomCurtain.frame = CGRect(
        x: 0,
        y: bandTop + bandHeight,
        width: bounds.width,
        height: max(bounds.height - bandTop - bandHeight, 0)
      )
      topCurtain.layer.cornerRadius = curtainRadius.doubleValue.cgFloat
      bottomCurtain.layer.cornerRadius = curtainRadius.doubleValue.cgFloat
    }

    let showLines = indicatorVisible && style != "fill" && style != "box"
    let showBox = indicatorVisible && (style == "box" || style == "fill")

    indicatorTop.isHidden = !showLines
    indicatorBottom.isHidden = !showLines
    indicatorBox.isHidden = !showBox

    if showLines {
      indicatorTop.backgroundColor = color
      indicatorBottom.backgroundColor = color
      indicatorTop.frame = CGRect(x: inset, y: bandTop, width: bounds.width - inset * 2, height: thickness)
      indicatorBottom.frame = CGRect(
        x: inset,
        y: bandTop + bandHeight - thickness,
        width: bounds.width - inset * 2,
        height: thickness
      )
      indicatorTop.layer.cornerRadius = indicatorRadius.doubleValue.cgFloat
      indicatorBottom.layer.cornerRadius = indicatorRadius.doubleValue.cgFloat
    }

    if showBox {
      indicatorBox.frame = CGRect(x: inset, y: bandTop, width: bounds.width - inset * 2, height: bandHeight)
      indicatorBox.layer.cornerRadius = indicatorRadius.doubleValue.cgFloat

      if style == "fill" {
        indicatorBox.backgroundColor = color
        indicatorBox.layer.borderWidth = 0
      } else {
        indicatorBox.backgroundColor = .clear
        indicatorBox.layer.borderWidth = thickness
        indicatorBox.layer.borderColor = color.cgColor
      }
    }

    // Заливка уходит под колесо, остальное оформление остаётся поверх.
    if style == "fill" {
      sendSubviewToBack(indicatorBox)
    } else {
      bringSubviewToFront(indicatorBox)
    }

    [topCurtain, bottomCurtain, indicatorTop, indicatorBottom].forEach(bringSubviewToFront)
  }
}

// MARK: - UICollectionViewDataSource

extension RNWheelPickerView: UICollectionViewDataSource {

  func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
    rowCount
  }

  func collectionView(
    _ collectionView: UICollectionView,
    cellForItemAt indexPath: IndexPath
  ) -> UICollectionViewCell {
    let cell = collectionView.dequeueReusableCell(
      withReuseIdentifier: WheelCell.reuseId,
      for: indexPath
    ) as! WheelCell
    let index = index(forRow: indexPath.item)

    guard parsedItems.indices.contains(index) else { return cell }

    let item = parsedItems[index]
    let isSelected = index == currentIndex
    let color: UIColor = item.disabled
      ? (disabledItemColor ?? UIColor.tertiaryLabel)
      : (item.color ?? (isSelected ? (selectedItemColor ?? itemColor ?? .label) : (itemColor ?? .label)))

    cell.configure(
      label: item.label,
      color: color,
      font: font(selected: isSelected),
      alignment: alignment(),
      numberOfLines: numberOfLines.intValue,
      paddingHorizontal: itemPaddingHorizontal.doubleValue.cgFloat,
      testID: nil
    )

    return cell
  }

  private func font(selected: Bool) -> UIFont {
    let size = (selected ? selectedFontSize : fontSize).doubleValue.cgFloat
    let weight = weightValue(selected ? selectedFontWeight : fontWeight)

    if let family = fontFamily as String?, !family.isEmpty,
       let descriptor = UIFont(name: family, size: size)?.fontDescriptor {
      return UIFont(descriptor: descriptor, size: size)
    }

    return UIFont.systemFont(ofSize: size, weight: weight)
  }

  private func weightValue(_ raw: NSString) -> UIFont.Weight {
    switch raw as String {
    case "medium": return .medium
    case "semibold": return .semibold
    case "bold": return .bold
    default: return .regular
    }
  }

  private func alignment() -> NSTextAlignment {
    switch textAlign as String {
    case "left": return .left
    case "right": return .right
    default: return .center
    }
  }
}

// MARK: - UICollectionViewDelegate

extension RNWheelPickerView: UICollectionViewDelegate {

  /// Выбор нажатием: элемент доезжает до центра и считается выбранным.
  func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
    let index = index(forRow: indexPath.item)

    guard enabled, parsedItems.indices.contains(index), !parsedItems[index].disabled else { return }

    if let range = allowedRange, !range.contains(index) {
      return
    }

    onItemPress?(["index": index, "value": parsedItems[index].value])

    if loop {
      let offset = CGPoint(
        x: 0,
        y: CGFloat(indexPath.item) * rowHeight - collectionView.contentInset.top
      )

      currentIndex = index
      collectionView.setContentOffset(offset, animated: true)
    } else {
      scroll(to: index, animated: true, silent: false)
    }
  }

  func scrollViewDidScroll(_ scrollView: UIScrollView) {
    clampOffsetIfNeeded()
    recenterIfNeeded()
    emitScrollIfNeeded()

    let index = index(forRow: centeredRow())

    if index != currentIndex {
      currentIndex = index

      if haptics {
        feedback.selectionChanged()
      }
    }
  }

  func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
    if haptics {
      feedback.prepare()
    }
    emitState(.dragging)
  }

  func scrollViewWillEndDragging(
    _ scrollView: UIScrollView,
    withVelocity velocity: CGPoint,
    targetContentOffset: UnsafeMutablePointer<CGPoint>
  ) {
    guard rowHeight > 0 else { return }

    let proposed = targetContentOffset.pointee.y + scrollView.contentInset.top
    var row = Int((proposed / rowHeight).rounded())

    if let range = allowedRange {
      row = min(max(row, range.lowerBound), range.upperBound)
    }

    targetContentOffset.pointee.y = offset(forRow: row)
  }

  func scrollViewDidEndDragging(_ scrollView: UIScrollView, willDecelerate decelerate: Bool) {
    if decelerate {
      emitState(.settling)
    } else {
      settle()
    }
  }

  func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
    settle()
  }

  func scrollViewDidEndScrollingAnimation(_ scrollView: UIScrollView) {
    settle()
  }

  private func settle() {
    let row = centeredRow()
    let target = offset(forRow: row)

    if abs(collectionView.contentOffset.y - target) > 0.5 {
      collectionView.setContentOffset(CGPoint(x: 0, y: target), animated: false)
    }

    currentIndex = index(forRow: row)
    updateAllowedRange()
    collectionView.reloadData()
    emitChangeIfNeeded(fromUser: !isApplyingProps)
    emitState(.idle)
  }
}

// MARK: - Ячейка

private final class WheelCell: UICollectionViewCell {

  static let reuseId = "RNWheelPickerCell"

  private let label = UILabel()
  private var leading: NSLayoutConstraint?
  private var trailing: NSLayoutConstraint?

  override init(frame: CGRect) {
    super.init(frame: frame)
    backgroundColor = .clear
    label.translatesAutoresizingMaskIntoConstraints = false
    contentView.addSubview(label)

    let leading = label.leadingAnchor.constraint(equalTo: contentView.leadingAnchor)
    let trailing = contentView.trailingAnchor.constraint(equalTo: label.trailingAnchor)

    self.leading = leading
    self.trailing = trailing

    NSLayoutConstraint.activate([
      leading,
      trailing,
      label.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
    ])
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) { fatalError("init(coder:) is not supported") }

  func configure(
    label text: String,
    color: UIColor,
    font: UIFont,
    alignment: NSTextAlignment,
    numberOfLines: Int,
    paddingHorizontal: CGFloat,
    testID: String?
  ) {
    label.text = text
    label.textColor = color
    label.font = font
    label.textAlignment = alignment
    label.numberOfLines = numberOfLines
    label.adjustsFontSizeToFitWidth = true
    label.minimumScaleFactor = 0.6
    leading?.constant = paddingHorizontal
    trailing?.constant = paddingHorizontal
    accessibilityIdentifier = testID
  }
}

// MARK: - Раскладка барабана

private final class WheelLayout: UICollectionViewFlowLayout {

  var itemHeight: CGFloat = 44
  var itemSpacing: CGFloat = 0
  var viewportHeight: CGFloat = 0
  var width: CGFloat = 0
  var curvature: CGFloat = 1
  var edgeOpacity: CGFloat = 0.25
  var edgeScale: CGFloat = 0.8

  override func prepare() {
    scrollDirection = .vertical
    minimumLineSpacing = 0
    minimumInteritemSpacing = 0
    itemSize = CGSize(width: max(width, 1), height: max(itemHeight, 1))
    super.prepare()
  }

  override func shouldInvalidateLayout(forBoundsChange newBounds: CGRect) -> Bool { true }

  override func layoutAttributesForElements(in rect: CGRect) -> [UICollectionViewLayoutAttributes]? {
    guard let collectionView, let base = super.layoutAttributesForElements(in: rect) else { return nil }

    let center = collectionView.contentOffset.y + collectionView.contentInset.top + itemHeight / 2
    let radius = max(viewportHeight / 2, itemHeight)

    return base.compactMap { attributes in
      guard let copy = attributes.copy() as? UICollectionViewLayoutAttributes else { return attributes }

      let distance = copy.center.y - center
      let ratio = min(abs(distance) / radius, 1)

      copy.alpha = 1 - (1 - edgeOpacity) * ratio

      var transform = CATransform3DIdentity

      if curvature > 0 {
        // Наклон вокруг X даёт объём барабана, сжатие по Y — перспективу.
        let angle = (distance / radius) * (.pi / 2) * curvature

        transform.m34 = -1 / 900
        transform = CATransform3DRotate(transform, angle, 1, 0, 0)
      }

      let scale = 1 - (1 - edgeScale) * ratio

      transform = CATransform3DScale(transform, scale, scale, 1)
      copy.transform3D = transform

      return copy
    }
  }
}

private extension Double {
  var cgFloat: CGFloat { CGFloat(self) }
}
