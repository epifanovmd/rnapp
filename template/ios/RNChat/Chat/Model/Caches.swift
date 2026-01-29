//
// ChatLayout
// Caches.swift
// https://github.com/ekazaev/ChatLayout
//
// Created by Eugene Kazaev in 2020-2026.
// Distributed under the MIT license.
//
// Become a sponsor:
// https://github.com/sponsors/ekazaev
//

import Foundation

let loader = CachingImageLoader(cache: imageCache, loader: DefaultImageLoader())

let imageCache = IterativeCache(
    mainCache: ImageForUrlCache(cache: MemoryDataCache<CacheableImageKey>()),
    backupCache: ImageForUrlCache(cache: PersistentDataCache<CacheableImageKey>())
)

//// Uncomment to reload dynamic content on every start.
// let imageCache = ImageForUrlCache(cache: MemoryDataCache<CacheableImageKey>())
