//
//  PhysicalGraphLabel.swift
//  NakarKit
//
//  Created by Samuel Schepp on 11.02.25.
//

public struct PhysicalGraphLabel: Equatable {
    public var label: String
    public var color: PhysicalColor
    public var count: Int

    init(label: String, color: PhysicalColor, count: Int) {
        self.label = label
        self.color = color
        self.count = count
    }

    init(of schemaGraphLabel: Components.Schemas.GraphLabel) {
        self.init(
            label: schemaGraphLabel.label,
            color: PhysicalColor(of: schemaGraphLabel.color),
            count: schemaGraphLabel.count
        )
    }
}
