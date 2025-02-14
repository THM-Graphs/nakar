//
//  EdgeComponent.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit

class EdgeComponent: Component {
    var physicalEdge: PhysicalEdge

    let source: Entity
    let target: Entity
    let lineEntity: Entity
    let textEntity: Entity

    weak var renderer: RendererViewController?

    init(
        physicalEdge: PhysicalEdge,
        source: Entity,
        target: Entity,
        lineEntity: Entity,
        textEntity: Entity,
        renderer: RendererViewController?
    ) {
        self.physicalEdge = physicalEdge
        self.source = source
        self.target = target
        self.lineEntity = lineEntity
        self.textEntity = textEntity
        self.renderer = renderer
    }
}
