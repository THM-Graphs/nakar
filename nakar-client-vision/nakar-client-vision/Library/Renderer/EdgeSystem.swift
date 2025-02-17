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
            let globalScale = edgeComponent.globalScale

            let source = edgeComponent.source
            let sourceNode = edgeComponent.source.components[NodeComponent.self]!.source
            let target = edgeComponent.target
            let targetNode = edgeComponent.target.components[NodeComponent.self]!.source

            let start: SIMD2<Float> = [source.position.x, source.position.y]
            let end: SIMD2<Float> = [target.position.x, target.position.y]
            let direction = normalize(end - start)


            let length: Float
            if distance(start, end) < Float(sourceNode.radius) * globalScale.defaultScale + Float(targetNode.radius) * globalScale.defaultScale {
                // Nodes to close (overlap)
                length = 0
                edgeComponent.textEntity.isEnabled = false
                edgeComponent.lineEntity.isEnabled = false
            } else {
                // good distance between nodes
                length = distance(
                    start + direction * Float(sourceNode.radius) * Float(globalScale.defaultScale),
                    end - direction * Float(targetNode.radius) * Float(globalScale.defaultScale)
                )
                edgeComponent.textEntity.isEnabled = true
                edgeComponent.lineEntity.isEnabled = true
            }
            let angle = -atan2(direction.x, direction.y) + (0.5 * .pi)

            edgeComponent.lineEntity.scale.x = length

            edgeComponent.textEntity.position = [
                length / 2,
                Float(edgeComponent.physicalEdge.parallelIndex) * globalScale.curvature * globalScale.defaultScale,
                edgeComponent.textEntity.position.z
            ]
            if angle > 0.5 * .pi || angle < -0.5 * .pi {
                // rotate title by 180 degrees
                edgeComponent.textEntity.orientation = simd_quatf(angle: .pi, axis: SIMD3<Float>(0, 0, 1))
            } else {
                edgeComponent.textEntity.orientation = simd_quatf(angle: 0, axis: SIMD3<Float>(0, 0, 1))
            }

            entity.position = SIMD3<Float>(start + direction * Float(sourceNode.radius) * Float(globalScale.defaultScale), globalScale.defaultDepth)
            entity.orientation = simd_quatf(angle: angle, axis: SIMD3<Float>(0, 0, 1))
        }
    }
}
