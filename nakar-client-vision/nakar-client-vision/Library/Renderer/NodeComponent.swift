//
//  NodeComponent.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit

class NodeComponent: Component {
    var source: PhysicalNode
    weak var renderer: RendererViewController?
    var velocity: SIMD3<Float> = .zero

    init(source: PhysicalNode, renderer: RendererViewController?) {
        self.source = source
        self.renderer = renderer
    }
}
