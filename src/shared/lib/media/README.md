---
module: shared/lib/media
summary: DI-сервис доступа к медиа-устройствам (getUserMedia, остановка потока) поверх react-native-webrtc.
---

# media

Абстракция над `mediaDevices` react-native-webrtc: получение медиапотока и его
остановка. Peer connection, SDP и ICE — отдельная ответственность
([shared/lib/webrtc](../webrtc/README.md)).

## Public API

| Экспорт         | Что                                                                      |
| --------------- | ------------------------------------------------------------------------ |
| `IMediaService` | интерфейс и DI-токен: `getUserMedia(constraints?)`, `stopStream(stream)` |
| `MediaService`  | реализация (singleton)                                                   |
| `mediaModule`   | `ContainerModule` с биндингом `IMediaService`                            |

## Устройство

- `getUserMedia` без ограничений запрашивает только аудио (`{ audio: true, video: false }`).
- `stopStream` останавливает все треки потока.

## Зависимости

- `shared/lib/di`, `inversify`, `react-native-webrtc`.
- Регистрация — `app/app.module.ts`; потребителей сервиса в `src` сейчас нет.
