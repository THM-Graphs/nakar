//
//  EdgeEntity.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit
import NakarKit

extension Entity {
    class func createEdgeEntity(physicalEdge: PhysicalEdge, source: Entity, target: Entity, renderer: RendererViewController) -> Entity {
        let start: SIMD3<Float> = [source.position.x, source.position.y, renderer.globalScale.defaultDepth]
        let end: SIMD3<Float> = [target.position.x, target.position.y, renderer.globalScale.defaultDepth]
        let length = distance(start, end)

        // Create a very thin box that will act as the line
        let lineMesh = MeshResource.generateBox(size: [Float(physicalEdge.width) * renderer.globalScale.defaultScale, Float(physicalEdge.width) * renderer.globalScale.defaultScale, length])
        let modelEntity = ModelEntity(mesh: lineMesh)

        modelEntity.components.set(EdgeComponent(physicalEdge: physicalEdge, source: source, target: target, renderer: renderer))

        return modelEntity
    }
}


