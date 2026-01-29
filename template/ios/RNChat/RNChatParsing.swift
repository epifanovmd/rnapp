 //
 // RNChatParsing.swift
 // chat-ios
 //
 // Created by Andrei on 17.01.2026.
 //

 import Foundation
 import UIKit

 enum RNChatParsing {
     static func color(from value: Any?) -> UIColor? {
         guard let value else { return nil }
         if let number = value as? NSNumber {
             let argb = UInt32(bitPattern: Int32(number.intValue))
             let a = CGFloat((argb >> 24) & 0xFF) / 255.0
             let r = CGFloat((argb >> 16) & 0xFF) / 255.0
             let g = CGFloat((argb >> 8) & 0xFF) / 255.0
             let b = CGFloat(argb & 0xFF) / 255.0
             return UIColor(red: r, green: g, blue: b, alpha: a)
         }
         if let string = value as? String {
             let hex = string.trimmingCharacters(in: CharacterSet(charactersIn: "#")).uppercased()
             let scanner = Scanner(string: hex)
             var hexNumber: UInt64 = 0
             guard scanner.scanHexInt64(&hexNumber) else { return nil }
             switch hex.count {
             case 6:
                 let r = CGFloat((hexNumber & 0xFF0000) >> 16) / 255.0
                 let g = CGFloat((hexNumber & 0x00FF00) >> 8) / 255.0
                 let b = CGFloat(hexNumber & 0x0000FF) / 255.0
                 return UIColor(red: r, green: g, blue: b, alpha: 1.0)
             case 8:
                 let a = CGFloat((hexNumber & 0xFF000000) >> 24) / 255.0
                 let r = CGFloat((hexNumber & 0x00FF0000) >> 16) / 255.0
                 let g = CGFloat((hexNumber & 0x0000FF00) >> 8) / 255.0
                 let b = CGFloat(hexNumber & 0x000000FF) / 255.0
                 return UIColor(red: r, green: g, blue: b, alpha: a)
             default:
                 return nil
             }
         }
         return nil
     }

     static func insets(from value: Any?) -> UIEdgeInsets? {
         guard let dict = value as? [String: Any] else { return nil }
         let top = (dict["top"] as? CGFloat) ?? 0
         let left = (dict["left"] as? CGFloat) ?? 0
         let bottom = (dict["bottom"] as? CGFloat) ?? 0
         let right = (dict["right"] as? CGFloat) ?? 0
         return UIEdgeInsets(top: top, left: left, bottom: bottom, right: right)
     }

     static func font(from value: Any?, fallback: UIFont) -> UIFont {
         if let number = value as? NSNumber {
             return UIFont.systemFont(ofSize: CGFloat(number.doubleValue))
         }
         if let dict = value as? [String: Any] {
             let size = (dict["size"] as? NSNumber).map { CGFloat($0.doubleValue) } ?? fallback.pointSize
             if let name = dict["name"] as? String, let font = UIFont(name: name, size: size) {
                 return font
             }
             let weight = (dict["weight"] as? String).map { fontWeight(from: $0) } ?? .regular
             return UIFont.systemFont(ofSize: size, weight: weight)
         }
         return fallback
     }

     static func imageSource(from value: Any?) -> ImageMessageSource? {
         if let dict = value as? [String: Any], let uri = dict["uri"] as? String, let url = URL(string: uri) {
             return .imageURL(url)
         }
         if let uri = value as? String, let url = URL(string: uri) {
             return .imageURL(url)
         }
         return nil
     }

     static func messageStatus(from value: Any?) -> MessageStatus {
         switch value as? String {
         case "received":
             return .received
         case "read":
             return .read
         default:
             return .sent
         }
     }

     static func messageDirection(from value: Any?) -> MessageType? {
         switch value as? String {
         case "incoming":
             return .incoming
         case "outgoing":
             return .outgoing
         default:
             return nil
         }
     }

     static func rawMessage(from value: Any?) -> RawMessage? {
         guard let dict = value as? [String: Any] else { return nil }
         guard let idString = dict["id"] as? String, let id = UUID(uuidString: idString) else { return nil }

         let date: Date
         if let timestamp = dict["date"] as? Double {
             date = Date(timeIntervalSince1970: timestamp / 1000.0)
         } else {
             date = Date()
         }

         guard let userDict = dict["user"] as? [String: Any],
               let userId = userDict["id"] as? Int else {
             return nil
         }
         let displayName = (userDict["displayName"] as? String) ?? ""
         let avatar = imageSource(from: userDict["avatar"])
         let user = ChatUser(id: userId, displayName: displayName, avatar: avatar)

         let status = messageStatus(from: dict["status"])
         let direction = messageDirection(from: dict["direction"])
         let replyToId = (dict["replyToId"] as? String).flatMap { UUID(uuidString: $0) }

         let data: RawMessage.Data
         if let dataDict = dict["data"] as? [String: Any] {
             if let type = dataDict["type"] as? String {
                 switch type {
                 case "text":
                     if let text = dataDict["text"] as? String {
                         data = .text(text)
                     } else {
                         return nil
                     }
                 case "image":
                     if let imageValue = dataDict["image"], let source = imageSource(from: imageValue) {
                         data = .image(source)
                     } else {
                         return nil
                     }
                 case "custom":
                     if let kind = dataDict["kind"] as? String {
                         let payload = dataDict["payload"] as? AnyHashable
                         data = .custom(CustomMessage(kind: kind, payload: payload))
                     } else {
                         return nil
                     }
                 case "system":
                     if let text = dataDict["text"] as? String {
                         data = .system(text)
                     } else {
                         return nil
                     }
                 default:
                     return nil
                 }
             } else if let text = dataDict["text"] as? String {
                 data = .text(text)
             } else if let imageValue = dataDict["image"], let source = imageSource(from: imageValue) {
                 data = .image(source)
             } else if let customDict = dataDict["custom"] as? [String: Any],
                       let kind = customDict["kind"] as? String {
                 let payload = customDict["payload"] as? AnyHashable
                 data = .custom(CustomMessage(kind: kind, payload: payload))
             } else if let kind = dataDict["kind"] as? String {
                 let payload = dataDict["payload"] as? AnyHashable
                 data = .custom(CustomMessage(kind: kind, payload: payload))
             } else {
                 return nil
             }
         } else if let text = dict["text"] as? String {
             data = .text(text)
         } else {
             return nil
         }

         return RawMessage(id: id, date: date, data: data, user: user, direction: direction, status: status, replyToId: replyToId)
     }

     private static func fontWeight(from value: String) -> UIFont.Weight {
         switch value.lowercased() {
         case "ultralight":
             .ultraLight
         case "thin":
             .thin
         case "light":
             .light
         case "medium":
             .medium
         case "semibold":
             .semibold
         case "bold":
             .bold
         case "heavy":
             .heavy
         case "black":
             .black
         default:
             .regular
         }
     }
 }
