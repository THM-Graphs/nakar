//
//  PhysicalPosition.swift
//  NakarKit
//
//  Created by Samuel Schepp on 11.02.25.
//

public struct PhysicalPosition: Equatable {
    public var x: Double
    public var y: Double

    init(x: Double, y: Double) {
        self.x = x
        self.y = y
    }

    init(of schemaPosition: Components.Schemas.Position) {
        self.init(x: schemaPosition.x, y: schemaPosition.y)
    }
}
