//
//  ColorService.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 26.03.25.
//

import CoreGraphics
import Foundation

class ColorService: Service {
    private let logger: LoggerService

    init(logger: LoggerService) {
        self.logger = logger
    }

    func bootstrap() async {
        /* */
    }

    func destory() async {
        /* */
    }

    func colorFrom(hex: String) -> CGColor? {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()

        if hexSanitized.hasPrefix("#") {
            hexSanitized.removeFirst()
        }

        if hexSanitized.count == 3 {
            hexSanitized = hexSanitized.map { "\($0)\($0)" }.joined()
        }

        guard hexSanitized.count == 6 else {
            logger.error(sender: self, message: "Cannot convert \(hex) into uicolor.")
            return nil
        }

        var rgbValue: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgbValue)

        let red = CGFloat((rgbValue >> 16) & 0xFF) / 255.0
        let green = CGFloat((rgbValue >> 8) & 0xFF) / 255.0
        let blue = CGFloat(rgbValue & 0xFF) / 255.0

        return CGColor(red: red, green: green, blue: blue, alpha: 1)
    }

    func backgroundColorOfNode(physicalNode: Components.Schemas.Node, metaData: Components.Schemas.GraphMetaData) -> CGColor {
        if let customBackgroundColor = physicalNode.customBackgroundColor, let color = colorFrom(hex: customBackgroundColor) {
            return color
        }
        guard let firstLabel = physicalNode.labels.first else {
            return backgroundColor(index: ._0)
        }
        guard let foundLabel = metaData.labels.first(where: { $0.label == firstLabel }) else {
            return backgroundColor(index: ._0)
        }
        return colorOfLabel(label: foundLabel)
    }

    func colorOfLabel(label: Components.Schemas.GraphLabel) -> CGColor {
        switch label.color {
        case .presetColor(let presetColor): return backgroundColor(index: presetColor.index)
        case .customColor(let customColor): return colorFrom(hex: customColor.backgroundColor) ?? backgroundColor(index: ._0)
        }
    }

    func backgroundColor(index: Components.Schemas.PresetColorIndex) -> CGColor {
        switch index {
        case ._0: return colorFrom(hex: "#3B71CA")!
        case ._1: return colorFrom(hex: "#14A44D")!
        case ._2: return colorFrom(hex: "#DC4C64")!
        case ._3: return colorFrom(hex: "#E4A11B")!
        case ._4: return colorFrom(hex: "#54B4D3")!
        case ._5: return colorFrom(hex: "#332D2D")!
        }
    }
}
