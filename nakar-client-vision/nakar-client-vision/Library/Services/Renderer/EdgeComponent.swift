//
//  EdgeComponent.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit

class EdgeComponent: Component {
    var physicalEdge: Components.Schemas.Edge
    weak var source: Entity?
    weak var target: Entity?
    weak var lineEntity: Entity?
    weak var textEntity: Entity?
    var globalScale: RendererService.GlobalScale
    weak var logger: LoggerService?

    init(
        physicalEdge: Components.Schemas.Edge,
        source: Entity,
        target: Entity,
        lineEntity: Entity,
        textEntity: Entity,
        globalScale: RendererService.GlobalScale,
        logger: LoggerService
    ) {
        self.physicalEdge = physicalEdge
        self.source = source
        self.target = target
        self.lineEntity = lineEntity
        self.textEntity = textEntity
        self.globalScale = globalScale
        self.logger = logger
    }
}
