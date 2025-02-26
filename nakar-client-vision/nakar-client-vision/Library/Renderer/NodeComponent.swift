//
//  NodeComponent.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit

class NodeComponent: Component {
    var source: Components.Schemas.Node
    let globalScale: RendererTools.GlobalScale

    var velocity: SIMD3<Float> = .zero
    var dragStartPosition: SIMD3<Float>? = nil

    init(source: Components.Schemas.Node, globalScale: RendererTools.GlobalScale) {
        self.source = source
        self.globalScale = globalScale
    }

    var dragging: Bool {
        dragStartPosition != nil
    }
}
