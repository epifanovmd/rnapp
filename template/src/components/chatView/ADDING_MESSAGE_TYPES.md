# Adding a New Message Type to ChatView

This guide walks through adding a new message content type (e.g. `location`, `contact`, `sticker`) to the native iOS ChatView.

## Architecture Overview

Message rendering involves 6 layers that must stay in sync:

| Layer | File | Role |
|-------|------|------|
| **TS Spec** | `src/NativeChatViewSpec.ts` | Codegen types for React Native bridge |
| **TS Component** | `src/components/chatView/ChatView.tsx` | React wrapper, props, event handlers |
| **ObjC Bridge** | `ios/ChatView/Bridge/RNChatViewManager.m` | Exports props/events to RN |
| **Swift Bridge** | `ios/ChatView/Bridge/RNChatView.swift` | Passes props to ChatViewController |
| **Models + Parsing** | `ios/ChatView/Models/` | Data model, NSDictionary parser |
| **Rendering** | `ios/ChatView/Views/`, `IGList/` | UI, size calculation |

## Content Model

`MessageContent` is a **struct with optional fields**. Any combination of fields is valid — text can accompany any media type automatically:

```swift
struct MessageContent: Equatable, Hashable {
    let text: String?       // text / caption for any media
    let images: [ImageItem]?
    let video: VideoPayload?
    let voice: VoicePayload?
    let poll: PollPayload?
    let file: FilePayload?
}
```

**Mixed messages work automatically**: if both `text` and any media field are set, the bubble renders media on top and text (caption) below. No special "mixed" types needed.

**Rendering priority** (when multiple media fields are set): `poll > file > voice > video > image`. Only one media type renders per message.

**Emoji-only**: messages with 1-3 emoji characters and no media get special rendering (large font, transparent bubble).

## Size Calculation

IGListKit recommends **manual size calculation** (not Auto Layout / self-sizing cells). All sizes are computed in `MessageSizeCalculator.swift`, which mirrors the rendering logic in `MessageBubbleView.swift`. These two files must stay in sync.

## Step-by-step: Adding a New Type

### Example: adding `location` type

---

### 1. TypeScript Spec — `NativeChatViewSpec.ts`

Add the payload type and include it in `NativeChatMessage`:

```ts
export type NativeChatLocationItem = {
  latitude: Double;
  longitude: Double;
  title?: string;
};

export type NativeChatMessage = {
  // ... existing fields ...
  location?: NativeChatLocationItem;
};
```

### 2. TypeScript Component — `ChatView.tsx`

Export the new type if consumers need it:

```ts
export type ChatLocationItem = {
  latitude: number;
  longitude: number;
  title?: string;
};
```

Add to `ChatMessage` interface:

```ts
location?: ChatLocationItem;
```

### 3. Swift Model — `ChatModels.swift`

Add a payload struct:

```swift
struct LocationPayload: Equatable, Hashable {
    let latitude: Double
    let longitude: Double
    let title: String?
}
```

Add the field to `MessageContent`:

```swift
struct MessageContent: Equatable, Hashable {
    // ... existing fields ...
    let location: LocationPayload?
}
```

Update `hasMedia` and `primaryMedia` computed properties:

```swift
var hasMedia: Bool {
    images != nil || video != nil || voice != nil || poll != nil || file != nil || location != nil
}

var primaryMedia: MediaType? {
    if let _ = poll { return .poll }
    if let _ = file { return .file }
    if let _ = voice { return .voice }
    if let _ = video { return .video }
    if let _ = images { return .image }
    if let _ = location { return .location }
    return nil
}
```

### 4. Parser — `ChatParsing.swift`

Add parsing in `parseContent()`:

```swift
let location: LocationPayload?
if let locDict = dict["location"] as? NSDictionary {
    location = parseLocation(locDict)
} else {
    location = nil
}

return MessageContent(
    text: finalText,
    images: images,
    video: video,
    voice: voice,
    poll: poll,
    file: file,
    location: location
)
```

Add the parser method:

```swift
private static func parseLocation(_ dict: NSDictionary) -> LocationPayload {
    LocationPayload(
        latitude: dict["latitude"] as? Double ?? 0,
        longitude: dict["longitude"] as? Double ?? 0,
        title: dict["title"] as? String
    )
}
```

### 5. Content View — `Views/Content/LocationContentView.swift`

Create a new UIView subclass:

```swift
import UIKit

final class LocationContentView: UIView {
    private let mapImage = UIImageView()
    private let titleLabel = UILabel()

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) { fatalError() }

    private func setup() {
        // Layout subviews
    }

    func configure(location: LocationPayload, isMine: Bool, theme: ChatTheme, width: CGFloat) {
        // Set data, apply theme colors
    }
}
```

### 6. Bubble View — `MessageBubbleView.swift`

Add to the media priority chain in `createContentView()`:

```swift
// Before the existing image check:
} else if let location = content.location {
    let view = LocationContentView()
    view.configure(location: location, isMine: isMine, theme: theme, width: width)
    views.append(view)
}
```

Text caption is handled automatically — if `content.text` is set, it renders below the media.

If you need callbacks (e.g. `onLocationTap`), add them to `MessageBubbleView`, `MessageCell`, section controller, delegate protocol, and bridge — same chain as existing callbacks like `onVideoTap`.

### 7. Size Calculator — `MessageSizeCalculator.swift`

Add to the media height chain in `contentHeight()`:

```swift
// Before the existing image check:
} else if content.location != nil {
    h += locationHeight(width: width)
}
```

Add helper:

```swift
static func locationHeight(width: CGFloat) -> CGFloat {
    let mapH = width * 0.6  // 3:5 aspect ratio
    return mapH
}
```

Text caption height is handled automatically.

> **Important**: `contentHeight()` media priority order must match `createContentView()` in `MessageBubbleView`. If they diverge, cells will have wrong sizes.

## Callback Chain (if your type is interactive)

For a tap callback like `onLocationTap`:

1. `LocationContentView` — `var onTap: (() -> Void)?`
2. `MessageBubbleView` — `var onLocationTap: ((Double, Double) -> Void)?`, wire in `createContentView`
3. `MessageCell` — `var onLocationTap: ((Double, Double) -> Void)?`, pass to bubble in `configure()`
4. `MessageSectionController` — set callback in `cellForItem`, call `sectionDelegate`
5. `MessageSectionDelegate` protocol — add method
6. `ChatViewController+ListAdapter` — implement delegate, forward to `ChatViewControllerDelegate`
7. `ChatViewControllerDelegate` — add method
8. `RNChatView` — implement delegate, fire `onLocationTap` event block
9. `RNChatViewManager.m` — `RCT_EXPORT_VIEW_PROPERTY(onLocationTap, RCTDirectEventBlock)`
10. `NativeChatViewSpec.ts` — add event type and handler prop
11. `ChatView.tsx` — add prop, handler, forward to consumer

## Checklist

- [ ] TS type in `NativeChatViewSpec.ts`
- [ ] TS type/prop in `ChatView.tsx`
- [ ] Swift payload struct in `ChatModels.swift` (must be `Equatable, Hashable`)
- [ ] Field in `MessageContent` struct + update `hasMedia`/`primaryMedia`
- [ ] Parser in `ChatParsing.swift` + pass to `MessageContent` init
- [ ] Content view in `Views/Content/`
- [ ] Media branch in `MessageBubbleView.createContentView()`
- [ ] Media branch in `MessageSizeCalculator.contentHeight()`
- [ ] Callback chain (if interactive)
