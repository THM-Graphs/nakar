//
//  PhysicalColor.swift
//  NakarKit
//
//  Created by Samuel Schepp on 11.02.25.
//

public enum PhysicalColor: Equatable {
    case preset(index: Int)
    case custom(backgroundColor: String, textColor: String)

    init(of schemaColor: Components.Schemas.Color) {
        switch schemaColor {
        case .customColor(let customColor):
            self = .custom(
                backgroundColor: customColor.backgroundColor,
                textColor: customColor.textColor
            )
        case .presetColor(let presetColor):
            self = .preset(
                index: presetColor.index.rawValue
            )
        }
    }
}
