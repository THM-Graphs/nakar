//
//  EdgeComponent.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit

class EdgeComponent: Component {
    var physicalEdge: Components.Schemas.Edge

    let source: Entity
    let target: Entity
    let lineEntity: Entity
    let textEntity: Entity

    let globalScale: RendererTools.GlobalScale

    init(
        physicalEdge: Components.Schemas.Edge,
        source: Entity,
        target: Entity,
        lineEntity: Entity,
        textEntity: Entity,
        globalScale: RendererTools.GlobalScale
    ) {
        self.physicalEdge = physicalEdge
        self.source = source
        self.target = target
        self.lineEntity = lineEntity
        self.textEntity = textEntity
        self.globalScale = globalScale
    }
}
