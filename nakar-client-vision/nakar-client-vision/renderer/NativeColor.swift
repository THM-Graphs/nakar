//
//  UIColor.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import SwiftUI

struct NativeColor {
    var r: CGFloat
    var g: CGFloat
    var b: CGFloat

    init(red: CGFloat, green: CGFloat, blue: CGFloat) {
        self.r = red
        self.g = green
        self.b = blue
    }

    init?(hex: String) {
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

        self.init(red: red, green: green, blue: blue)
    }

#if os(visionOS)
    var native: UIColor {
        UIColor(red: r, green: g, blue: b, alpha: 1)
    }
#endif
#if os(macOS)
    var native: NSColor {
        NSColor(red: r, green: g, blue: b, alpha: 1)
    }
#endif
}
