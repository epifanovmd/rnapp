import SwiftUI
import UIKit

// MARK: - Модели данных для RN
struct RNGridItem: Identifiable, Codable, Hashable {
    let id: String
    let title: String

    static func == (lhs: RNGridItem, rhs: RNGridItem) -> Bool {
        lhs.id == rhs.id
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

// MARK: - Оптимизированная ячейка
final class RNGridCell: UICollectionViewCell {
    static let reuseIdentifier = "RNGridCell"

    // MARK: - UI Components
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 16, weight: .medium)
        label.numberOfLines = 1
        label.textAlignment = .left
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()

    // MARK: - Init
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupViews()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup
    private func setupViews() {
        contentView.addSubview(titleLabel)

        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 12),
            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            titleLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            titleLabel.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -12)
        ])

        // Разделитель
        let separator = UIView()
        separator.backgroundColor = .separator
        separator.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(separator)

        NSLayoutConstraint.activate([
            separator.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            separator.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            separator.bottomAnchor.constraint(equalTo: contentView.bottomAnchor),
            separator.heightAnchor.constraint(equalToConstant: 0.5)
        ])
    }

    // MARK: - Configuration
    func configure(with item: RNGridItem) {
        titleLabel.text = item.title
    }

    // MARK: - Reuse
    override func prepareForReuse() {
        super.prepareForReuse()
        titleLabel.text = nil
        contentView.transform = .identity
    }
}

// MARK: - Основной UICollectionView
final class RNGridView: UICollectionView {
    // MARK: - Properties
    private var items: [RNGridItem] = []
    private var isLoading = false
    private var isLoadingEnabled = true
    private var hasPerformedInitialScroll = false

    var hasMoreData = true
    var endReachedThreshold: CGFloat = 0.3

    // Layout
    var itemHeight: CGFloat = 60
    var verticalSpacing: CGFloat = 1
    var horizontalInset: CGFloat = 0

    // Scroll
    var inverted: Bool = false

    // Initial scroll position
    var initialScrollIndex: Int?
    var initialScrollId: String?
    var initialScrollOffset: CGFloat?

    // Callbacks для RN
    var onEndReached: (() -> Void)?
    var onItemPress: ((String, String) -> Void)?
    var onScroll: ((CGFloat) -> Void)?
    var onMomentumScrollStart: (() -> Void)?
    var onMomentumScrollEnd: (() -> Void)?

    // MARK: - Init
    init() {
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .vertical
        layout.minimumInteritemSpacing = 0

        super.init(frame: .zero, collectionViewLayout: layout)
        setupCollectionView()
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Setup
    private func setupCollectionView() {
        // Регистрация ячейки
        register(RNGridCell.self, forCellWithReuseIdentifier: RNGridCell.reuseIdentifier)

        // Оптимизации
        backgroundColor = .systemBackground
        delaysContentTouches = true
        keyboardDismissMode = .onDrag
        showsHorizontalScrollIndicator = false
        contentInsetAdjustmentBehavior = .never

        // Prefetching для производительности
        prefetchDataSource = self
        isPrefetchingEnabled = true

        // Делегаты
        dataSource = self
        delegate = self

        // Для инвертированного скролла
        if inverted {
            transform = CGAffineTransform(scaleX: 1, y: -1)
        }

        translatesAutoresizingMaskIntoConstraints = false
    }

    // MARK: - Public Methods
    func updateItems(_ newItems: [RNGridItem]) {
        items = newItems

        if items.isEmpty {
          hasPerformedInitialScroll = false
        }

        isLoading = false
        reloadData()
    }

  func changeInverted(_ newInverted: Bool) {
        let oldInverted = inverted
        inverted = newInverted

        // Обновляем инвертирование если изменилось
        if oldInverted != inverted {
            transform = inverted
                ? CGAffineTransform(scaleX: 1, y: -1)
                : .identity

          reloadData()
        }

    }

    func scrollToIndex(_ index: Int, animated: Bool = true) {
        guard index >= 0 && index < items.count else { return }

        let indexPath = IndexPath(item: index, section: 0)
        scrollToItem(at: indexPath, at: .centeredVertically, animated: animated)
    }

    func scrollToId(_ id: String, animated: Bool = true) {
        guard let index = items.firstIndex(where: { $0.id == id }) else { return }
        scrollToIndex(index, animated: animated)
    }

    func getScrollOffset() -> CGFloat {
        return contentOffset.y
    }

    // MARK: - Initial Scroll
    private func performInitialScrollIfNeeded() {
        if let initialIndex = initialScrollIndex {
            scrollToItem(at: IndexPath(item: initialIndex, section: 0), at: .top, animated: false)
        } else if let initialId = initialScrollId {
            guard let index = items.firstIndex(where: { $0.id == initialId }) else { return }
            scrollToItem(at: IndexPath(item: index, section: 0), at: .top, animated: false)
        } else if let offset = initialScrollOffset {
            contentOffset.y = offset
        }
    }

    // MARK: - Layout
    override func layoutSubviews() {
        super.layoutSubviews()

        // Выполняем начальный скролл после layout
        if items.count > 0 && !hasPerformedInitialScroll {
            performInitialScrollIfNeeded()
            hasPerformedInitialScroll = true
        }
    }

    // MARK: - Check for End Reached
  private func checkForEndReached(scrollView: UIScrollView) {
      guard !isLoading,
            isLoadingEnabled,
            hasMoreData,
            items.count > 0
      else { return }

      let contentHeight = scrollView.contentSize.height
      let scrollOffset = scrollView.contentOffset.y
      let frameHeight = scrollView.frame.height

      // Проверяем, что контента достаточно
      guard contentHeight > frameHeight else { return }

      // Вычисляем доступное для скролла расстояние
      let scrollableDistance = contentHeight - frameHeight

      // Если уже проскроллили (100% - 30%) = 70% или больше
      if scrollOffset >= scrollableDistance * (1 - endReachedThreshold) {
          isLoading = true
          isLoadingEnabled = false
          onEndReached?()
      }
  }
}

// MARK: - UICollectionViewDataSource
extension RNGridView: UICollectionViewDataSource {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return items.count
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        guard let cell = collectionView.dequeueReusableCell(
            withReuseIdentifier: RNGridCell.reuseIdentifier,
            for: indexPath
        ) as? RNGridCell else {
            return UICollectionViewCell()
        }

        guard indexPath.item < items.count else { return cell }

        let item = items[indexPath.item]
        cell.configure(with: item)

        // Инвертируем содержимое ячейки для инвертированного скролла
        if inverted {
            cell.contentView.transform = CGAffineTransform(scaleX: 1, y: -1)
        }

        return cell
    }
}

// MARK: - UICollectionViewDelegateFlowLayout
extension RNGridView: UICollectionViewDelegateFlowLayout {
    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
      let width = collectionView.bounds.width - (horizontalInset * 2)

      return CGSize(width: max(0, width), height: itemHeight)
    }

    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, minimumLineSpacingForSectionAt section: Int) -> CGFloat {
      return verticalSpacing
    }

    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, insetForSectionAt section: Int) -> UIEdgeInsets {
        return UIEdgeInsets(top: 0, left: horizontalInset, bottom: 0, right: horizontalInset)
    }

    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        guard indexPath.item < items.count else { return }

        onItemPress?(items[indexPath.item].id, items[indexPath.item].title)

        // Простая анимация нажатия
        if let cell = collectionView.cellForItem(at: indexPath) {
            UIView.animate(withDuration: 0.1, animations: {
                cell.alpha = 0.7
            }) { _ in
                UIView.animate(withDuration: 0.1) {
                    cell.alpha = 1.0
                }
            }
        }
    }
}

// MARK: - UICollectionViewDataSourcePrefetching
extension RNGridView: UICollectionViewDataSourcePrefetching {
    func collectionView(_ collectionView: UICollectionView, prefetchItemsAt indexPaths: [IndexPath]) {
        // Можно использовать prefetching для загрузки данных, но для упрощения
        // оставляем логику в scrollViewDidScroll
    }

    func collectionView(_ collectionView: UICollectionView, cancelPrefetchingForItemsAt indexPaths: [IndexPath]) {
        // Отменяем prefetching если не нужно
    }
}

// MARK: - UIScrollViewDelegate
extension RNGridView: UICollectionViewDelegate {
    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        let offset = scrollView.contentOffset.y
        onScroll?(offset)

        // Проверяем необходимость загрузки новых данных
        checkForEndReached(scrollView: scrollView)
    }

    func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
      isLoadingEnabled = true
    }

    func scrollViewWillBeginDecelerating(_ scrollView: UIScrollView) {
        onMomentumScrollStart?()
    }

    func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
        isLoadingEnabled = true
        onMomentumScrollEnd?()
    }
}
