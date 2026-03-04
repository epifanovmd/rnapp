// MARK: - ImageCache.swift
//
// Двухуровневый кэш изображений:
//   • NSCache<NSString, UIImage>  — память, автосброс при memory warning
//   • URLSession с URLCache       — диск (40 МБ), HTTP-заголовки кэширования
//
// Дедупликация in-flight запросов:
//   Если URL уже загружается, новый completion добавляется в очередь ожидающих.
//   Сетевой запрос делается ровно один раз — не важно, сколько ячеек одновременно
//   показывают одно изображение.
//
// Отмена через CancellationToken:
//   prepareForReuse вызывает token.cancel() → completion убирается из очереди →
//   устаревшее изображение не попадает в переиспользованную ячейку.
//
// UIImageView.loadImage(url:):
//   Синхронный кэш-хит — без fade, без мерцания при скролле.
//   Async hit — плавный crossDissolve 0.18 с.

import UIKit

// MARK: - CancellationToken

/// Лёгкий токен отмены. Не удерживает URLSessionTask — только убирает completion
/// из очереди ожидающих, что предотвращает устаревшие апдейты imageView.
final class ImageLoadToken {
    private let cancel: () -> Void
    init(_ cancel: @escaping () -> Void) { self.cancel = cancel }
    func invalidate() { cancel() }
}

// MARK: - ImageCache

final class ImageCache {

    static let shared = ImageCache()

    // MARK: Storage

    private let mem: NSCache<NSString, UIImage> = {
        let c = NSCache<NSString, UIImage>()
        c.countLimit     = 300
        c.totalCostLimit = 80 * 1024 * 1024   // 80 МБ
        return c
    }()

    private var inflight: [URL: [UUID: (UIImage?) -> Void]] = [:]
    private let lock = NSLock()

    private let session: URLSession = {
        let cfg = URLSessionConfiguration.default
        cfg.urlCache           = URLCache(memoryCapacity: 8  * 1024 * 1024,
                                          diskCapacity:   40 * 1024 * 1024)
        cfg.requestCachePolicy = .returnCacheDataElseLoad
        cfg.timeoutIntervalForRequest = 30
        return URLSession(configuration: cfg)
    }()

    private init() {
        NotificationCenter.default.addObserver(
            self, selector: #selector(onMemoryWarning),
            name: UIApplication.didReceiveMemoryWarningNotification, object: nil)
    }

    // MARK: Public API

    /// Загружает изображение. Синхронно возвращает из кэша если есть.
    /// Возвращает токен для отмены (вызвать в prepareForReuse).
    @discardableResult
    func load(url: URL, completion: @escaping (UIImage?) -> Void) -> ImageLoadToken {
        let cacheKey = url.absoluteString as NSString

        // Синхронный hit — completion вызывается прямо здесь, до возврата токена.
        // Caller обязан обработать это корректно (UIImageView.loadImage так и делает).
        if let img = mem.object(forKey: cacheKey) {
            completion(img)
            return ImageLoadToken({})
        }

        let id = UUID()

        lock.lock()
        let alreadyFetching = inflight[url] != nil
        inflight[url, default: [:]][id] = completion
        lock.unlock()

        if !alreadyFetching {
            session.dataTask(with: url) { [weak self] data, _, _ in
                guard let self else { return }
                let img = data.flatMap { UIImage(data: $0) }

                if let img {
                    let cost = Int(img.size.width * img.size.height * 4)
                    self.mem.setObject(img, forKey: cacheKey, cost: cost)
                }

                self.lock.lock()
                let waiters = self.inflight.removeValue(forKey: url) ?? [:]
                self.lock.unlock()

                DispatchQueue.main.async {
                    waiters.values.forEach { $0(img) }
                }
            }.resume()
        }

        return ImageLoadToken { [weak self] in
            self?.lock.lock()
            self?.inflight[url]?.removeValue(forKey: id)
            self?.lock.unlock()
        }
    }

    /// Синхронная проверка кэша без запуска загрузки.
    func cached(url: URL) -> UIImage? {
        mem.object(forKey: url.absoluteString as NSString)
    }

    @objc private func onMemoryWarning() { mem.removeAllObjects() }
}

// MARK: - UIImageView + ImageCache

private var tokenKey: UInt8 = 0

extension UIImageView {

    /// Загружает изображение с кэшированием и отменой предыдущего запроса.
    /// - Parameters:
    ///   - url: URL изображения. nil → показываем placeholder.
    ///   - placeholder: Изображение пока грузим (по умолчанию nil).
    func loadImage(url: URL?, placeholder: UIImage? = nil) {
        // Отменяем предыдущий запрос для этого imageView
        (objc_getAssociatedObject(self, &tokenKey) as? ImageLoadToken)?.invalidate()

        guard let url else {
            image = placeholder
            objc_setAssociatedObject(self, &tokenKey, nil, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
            return
        }

        // Синхронный кэш-хит → без анимации, без мерцания
        if let cached = ImageCache.shared.cached(url: url) {
            image = cached
            objc_setAssociatedObject(self, &tokenKey, nil, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
            return
        }

        image = placeholder

        let token = ImageCache.shared.load(url: url) { [weak self] img in
            guard let self else { return }
            UIView.transition(with: self, duration: 0.18,
                              options: [.transitionCrossDissolve, .allowUserInteraction]) {
                self.image = img
            }
        }

        objc_setAssociatedObject(self, &tokenKey, token, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
    }
}
