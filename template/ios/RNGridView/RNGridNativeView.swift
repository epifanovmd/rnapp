import UIKit
import React

// MARK: - Вспомогательные расширения для конвертации данных
extension RNGridItem {
    static func fromDictionary(_ dict: [String: Any]) -> RNGridItem? {
        guard let id = dict["id"] as? String,
              let title = dict["title"] as? String else {
            return nil
        }
        return RNGridItem(id: id, title: title)
    }
}

// MARK: - UIView для React Native
class RNGridNativeView: UIView {
    
    // MARK: - Properties
    private var gridView: RNGridView!
    
    // MARK: - React Native Props
    @objc var items: [[String: Any]] = [] {
        didSet {
            updateItems()
        }
    }
  
  @objc var itemHeight: CGFloat = 60 {
      didSet {
          gridView?.itemHeight = itemHeight
      }
  }
  
  @objc var verticalSpacing: CGFloat = 1 {
      didSet {
          gridView?.verticalSpacing = verticalSpacing
          gridView.reloadData()
      
      }
  }
  
  @objc var horizontalInset: CGFloat = 0 {
      didSet {
          gridView?.horizontalInset = horizontalInset
        gridView.reloadData()
      }
  }
  
  @objc var inverted: Bool = false {
      didSet {
        gridView?.changeInverted(inverted)
      }
  }
  
  @objc var showsScrollIndicator: Bool = true {
      didSet {
          gridView?.showsVerticalScrollIndicator = showsScrollIndicator
          gridView?.showsHorizontalScrollIndicator = showsScrollIndicator
      }
  }
  
  @objc var bounces: Bool = true {
      didSet {
        guard let gridView = gridView else { return }
        
        if gridView.bounces != bounces {
          gridView.bounces = bounces
        }
      }
  }
  
  @objc var initialScrollIndex: NSNumber? {
      didSet {
        guard let gridView = gridView else { return }

        if let initialScrollIndex {
            gridView.initialScrollIndex = initialScrollIndex.intValue
          }
      }
  }
  
  @objc var initialScrollId: String? {
      didSet {
          gridView?.initialScrollId = initialScrollId
      }
  }
  
  @objc var initialScrollOffset: NSNumber? {
      didSet {
          if let value = initialScrollOffset {
              gridView?.initialScrollOffset = CGFloat(value.doubleValue)
          }
      }
  }
    
    @objc var onEndReached: RCTDirectEventBlock? {
        didSet {
            gridView?.onEndReached = { [weak self] in
                self?.onEndReached?([:])
            }
        }
    }
    
    @objc var hasMoreData: Bool = true {
        didSet {
            gridView?.hasMoreData = hasMoreData
        }
    }
    
    @objc var endReachedThreshold: CGFloat = 100 {
        didSet {
            gridView?.endReachedThreshold = endReachedThreshold
        }
    }
    
    @objc var onItemPress: RCTDirectEventBlock? {
        didSet {
            gridView?.onItemPress = { [weak self] id, title in
              self?.onItemPress?(["id": id, "title": title])
            }
        }
    }
    
    @objc var onScroll: RCTDirectEventBlock? {
        didSet {
            gridView?.onScroll = { [weak self] offset in
                self?.onScroll?(["offset": offset])
            }
        }
    }
    
    @objc var onMomentumScrollStart: RCTDirectEventBlock? {
        didSet {
            gridView?.onMomentumScrollStart = { [weak self] in
                self?.onMomentumScrollStart?([:])
            }
        }
    }
    
    @objc var onMomentumScrollEnd: RCTDirectEventBlock? {
        didSet {
            gridView?.onMomentumScrollEnd = { [weak self] in
                self?.onMomentumScrollEnd?([:])
            }
        }
    }
    
    // MARK: - Init
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupGridView()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Setup
    private func setupGridView() {
        gridView = RNGridView()
        gridView.translatesAutoresizingMaskIntoConstraints = false
        
        addSubview(gridView)
        
        NSLayoutConstraint.activate([
            gridView.topAnchor.constraint(equalTo: topAnchor),
            gridView.leadingAnchor.constraint(equalTo: leadingAnchor),
            gridView.trailingAnchor.constraint(equalTo: trailingAnchor),
            gridView.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
        
        // Initial items setup
        updateItems()
    }
    
    // MARK: - Updates
    private func updateItems() {
        let rnItems = items.compactMap { RNGridItem.fromDictionary($0) }
        gridView?.updateItems(rnItems)
    }
    
    // MARK: - Public Methods для React Native
    func getScrollOffset() -> CGFloat {
        return gridView?.getScrollOffset() ?? 0
    }
    
    func scrollToIndexAnimated(_ index: Int, animated: Bool) {
        gridView?.scrollToIndex(index, animated: animated)
    }
    
    func scrollToIdAnimated(_ id: String, animated: Bool) {
        gridView?.scrollToId(id, animated: animated)
    }
    
    // MARK: - Layout
    override func layoutSubviews() {
        super.layoutSubviews()
        gridView?.collectionViewLayout.invalidateLayout()
    }
}
