//
//  PhysicalNode.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 07.02.25.
//

import SpriteKit

public struct PhysicalNode: Identifiable, Equatable {
    public var id: String
    public var x: Double
    public var y: Double
    public var radius: Double
    public var title: String

    static func from(schemaNode: Components.Schemas.Node) -> PhysicalNode {
        PhysicalNode(
            id: schemaNode.id,
            x: schemaNode.position.x,
            y: schemaNode.position.y,
            radius: schemaNode.radius,
            title: schemaNode.title
        )
    }
}
