//
//  NodeComponent.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit

class NodeComponent: Component {
    var source: Components.Schemas.Node
    let globalScale: RendererService.GlobalScale
    weak var rendererService: RendererService?

    var velocity: SIMD3<Float> = .zero
    var dragStartPosition: SIMD3<Float>? = nil
    weak var logger: LoggerService?

    init(source: Components.Schemas.Node, globalScale: RendererService.GlobalScale, rendererService: RendererService, logger: LoggerService) {
        self.source = source
        self.globalScale = globalScale
        self.rendererService = rendererService
        self.logger = logger
    }

    var dragging: Bool {
        dragStartPosition != nil
    }
}
