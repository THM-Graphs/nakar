//
//  EdgeComponent.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit
import NakarKit

class EdgeComponent: Component {
    var physicalEdge: PhysicalEdge

    var source: Entity
    var target: Entity
    
    weak var renderer: RendererViewController?

    init(physicalEdge: PhysicalEdge, source: Entity, target: Entity, renderer: RendererViewController?) {
        self.physicalEdge = physicalEdge
        self.source = source
        self.target = target
        self.renderer = renderer
    }
}
