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

## Current Message Types

`MessageContent` is an enum with associated payloads:

```
text(TextPayload)              — plain text
image(ImagePayload)            — one or more images
mixed(TextPayload, Image...)   — images + caption text
video(VideoPayload)            — single video
mixedTextVideo(Text, Video)    — video + caption text
voice(VoicePayload)            — voice message with waveform
poll(PollPayload)              — poll with options
file(FilePayload)              — file attachment
```

**Mixed types**: currently only `image+text` and `video+text` support captions. Other combinations (e.g. `file+text`) render as the primary type only.

**Emoji-only**: messages with 1-3 emoji characters get special rendering (large font, transparent bubble).

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

Add a case to `MessageContent`:

```swift
enum MessageContent: Equatable, Hashable {
    // ... existing cases ...
    case location(LocationPayload)

    // Add computed accessor:
    var location: LocationPayload? {
        if case .location(let l) = self { return l }
        return nil
    }
}
```

### 4. Parser — `ChatParsing.swift`

Add parsing in `parseContent()`. Order matters — types checked earlier take priority:

```swift
private static func parseContent(dict: NSDictionary, text: String?) -> MessageContent {
    // ... existing checks (poll, file, voice, video, images) ...

    // Add before the final `return .text(...)`:
    if let locDict = dict["location"] as? NSDictionary {
        return .location(parseLocation(locDict))
    }

    return .text(TextPayload(text: text ?? ""))
}

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

Add a case in `createContentView()`:

```swift
case .location(let l):
    let view = LocationContentView()
    view.configure(location: l, isMine: isMine, theme: theme, width: width)
    return view
```

If you need callbacks (e.g. `onLocationTap`), add them to `MessageBubbleView`, `MessageCell`, section controller, delegate protocol, and bridge — same chain as existing callbacks like `onVideoTap`.

### 7. Size Calculator — `MessageSizeCalculator.swift`

Add width and height calculations.

**`bubbleWidth()`** — add the case to the rich-content group:

```swift
case .image, .mixed, .video, .mixedTextVideo, .poll, .file, .voice, .location:
    return maxW
```

**`contentHeight()`** — add a case:

```swift
case .location:
    return locationHeight(width: width)
```

Add helper:

```swift
static func locationHeight(width: CGFloat) -> CGFloat {
    let mapH = width * 0.6  // 3:5 aspect ratio
    return mapH + ChatLayout.messageFont.lineHeight + 8
}
```

> **Important**: `contentHeight()` and `createContentView()` must produce consistent results. If they diverge, cells will have wrong sizes.

### 8. Mixed Support (optional)

To support `location + text` caption, add a new enum case:

```swift
case mixedTextLocation(TextPayload, LocationPayload)
```

Then update: `parseContent()`, `createContentView()`, `contentHeight()`, `bubbleWidth()`, and computed accessors on `MessageContent`.

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
- [ ] Enum case in `MessageContent`
- [ ] Computed accessor on `MessageContent`
- [ ] Parser in `ChatParsing.swift`
- [ ] Content view in `Views/Content/`
- [ ] Case in `MessageBubbleView.createContentView()`
- [ ] Case in `MessageSizeCalculator.bubbleWidth()`
- [ ] Case in `MessageSizeCalculator.contentHeight()`
- [ ] Callback chain (if interactive)
- [ ] Mixed case support (if caption text needed)
