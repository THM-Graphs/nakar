//
//  UIColor.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import SwiftUI

extension CGColor {
    class func from(hex: String) -> CGColor? {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()

        if hexSanitized.hasPrefix("#") {
            hexSanitized.removeFirst()
        }

        if hexSanitized.count == 3 {
            hexSanitized = hexSanitized.map { "\($0)\($0)" }.joined()
        }

        guard hexSanitized.count == 6 else {
            print("Cannot convert \(hex) into uicolor.")
            return nil
        }

        var rgbValue: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgbValue)

        let red = CGFloat((rgbValue >> 16) & 0xFF) / 255.0
        let green = CGFloat((rgbValue >> 8) & 0xFF) / 255.0
        let blue = CGFloat(rgbValue & 0xFF) / 255.0

        return Self.init(red: red, green: green, blue: blue, alpha: 1)
    }

    #if os(visionOS)
    var platformNative: UIColor {
        return UIColor(cgColor: self)
    }
    #endif

    #if os(macOS)
    var platformNative: NSColor {
        return NSColor(cgColor: self) ?? NSColor.systemPink
    }
    #endif
}
