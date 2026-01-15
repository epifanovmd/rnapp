import Foundation
import React

// MARK: - Менеджер для React Native
@objc(RNGridViewManager)
class RNGridViewManager: RCTViewManager {
    
    // MARK: - Setup
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override func view() -> UIView! {
        return RNGridNativeView()
    }
    
    // MARK: - Methods для JavaScript
    @objc func getScrollOffset(
        _ reactTag: NSNumber,
        resolver: @escaping RCTPromiseResolveBlock,
        rejecter: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async {
            guard let view = self.bridge.uiManager.view(forReactTag: reactTag) as? RNGridNativeView else {
                rejecter("ERROR", "View not found", nil)
                return
            }
            
            let offset = view.getScrollOffset()
            resolver(["offset": offset])
        }
    }
    
    @objc func scrollToIndex(
        _ reactTag: NSNumber,
        index: NSNumber,
        animated: Bool
    ) {
        DispatchQueue.main.async {
            guard let view = self.bridge.uiManager.view(forReactTag: reactTag) as? RNGridNativeView else {
                return
            }
            
            view.scrollToIndexAnimated(index.intValue, animated: animated)
        }
    }
    
    @objc func scrollToId(
        _ reactTag: NSNumber,
        id: String,
        animated: Bool
    ) {
        DispatchQueue.main.async {
            guard let view = self.bridge.uiManager.view(forReactTag: reactTag) as? RNGridNativeView else {
                return
            }
            
            view.scrollToIdAnimated(id, animated: animated)
        }
    }
}
