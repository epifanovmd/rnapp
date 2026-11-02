---
module: shared/lib/webrtc
summary: DI-сервис WebRTC-примитивов — peer connection, offer/answer, удалённое описание и ICE-кандидаты поверх react-native-webrtc.
---

# webrtc

Тонкая абстракция над WebRTC-классами react-native-webrtc. Медиапотоки — отдельная
ответственность ([shared/lib/media](../media/README.md)).

## Public API

| Экспорт          | Что                                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `IWebRTCService` | интерфейс и DI-токен: `createPeerConnection`, `createOffer`, `createAnswer`, `setRemoteDescription`, `addIceCandidate` |
| `WebRTCService`  | реализация (singleton)                                                                                                 |
| `webrtcModule`   | `ContainerModule` с биндингом `IWebRTCService`                                                                         |

## Устройство

- `createPeerConnection` подставляет публичные STUN-серверы Google; переданный
  `config` перекрывает их.
- `createOffer`/`createAnswer` сразу ставят результат локальным описанием.
- Типы — браузерные (`RTCPeerConnection`, `RTCSessionDescriptionInit`); на классы
  react-native-webrtc они приводятся внутри сервиса.

## Зависимости

- `shared/lib/di`, `inversify`, `react-native-webrtc`.
- Регистрация — `app/app.module.ts`; потребителей сервиса в `src` сейчас нет.
