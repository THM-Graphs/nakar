//
//  EdgeSystem.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit

class EdgeSystem: System {
    private static let query = EntityQuery(where: .has(EdgeComponent.self))

    required init(scene: Scene) { }

    func update(context: SceneUpdateContext) {
        for entity in context.entities(
            matching: Self.query,
            updatingSystemWhen: .rendering
        ) {
            guard let edgeComponent = entity.components[EdgeComponent.self] else {
                print("Error: Cannot get node component")
                return
            }
            guard let globalScale = edgeComponent.renderer?.globalScale else {
                print("Error: no global scale in node system")
                return
            }

            let physicalEdge = edgeComponent.physicalEdge
            let source = edgeComponent.source
            let target = edgeComponent.target
            
            let start: SIMD3<Float> = [source.position.x, source.position.y, globalScale.defaultDepth]
            let end: SIMD3<Float> = [target.position.x, target.position.y, globalScale.defaultDepth]
            entity.position = (start + end) / 2

            let direction = normalize(end - start)
            let angle = acos(dot(SIMD3<Float>(0, 0, 1), direction))
            let axis = cross(SIMD3<Float>(0, 0, 1), direction)
            entity.orientation = simd_quatf(angle: angle, axis: axis)
        }
    }
}
