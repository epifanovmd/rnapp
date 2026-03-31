// import { ISocketPlatformBridge } from "./socketPlatformBridge.types";
//
// /**
//  * Web (browser) implementation of ISocketPlatformBridge.
//  *
//  * Uses document.visibilityState for foreground detection
//  * and window "online" event for network recovery.
//  */
// @ISocketPlatformBridge({ inSingleton: true })
// export class WebSocketPlatformBridge implements ISocketPlatformBridge {
//   isAppActive(): boolean {
//     return document.visibilityState === "visible";
//   }
//
//   onAppActive(callback: () => void): () => void {
//     const handler = () => {
//       if (document.visibilityState === "visible") {
//         callback();
//       }
//     };
//
//     document.addEventListener("visibilitychange", handler);
//
//     return () => document.removeEventListener("visibilitychange", handler);
//   }
//
//   onNetworkOnline(callback: () => void): () => void {
//     window.addEventListener("online", callback);
//
//     return () => window.removeEventListener("online", callback);
//   }
// }
