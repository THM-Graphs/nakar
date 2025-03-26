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
            let edgeComponent = entity.components[EdgeComponent.self]!
            let logger = edgeComponent.logger!
            let globalScale = edgeComponent.globalScale

            guard let source = edgeComponent.source else {
                logger.error(sender: self, message: "Cannot find source")
                continue
            }
            guard let sourceNode = source.components[NodeComponent.self]?.source else {
                logger.error(sender: self, message: "Cannot find sourceNode")
                continue
            }
            guard let target = edgeComponent.target else {
                logger.error(sender: self, message: "Cannot find target")
                continue
            }
            guard let targetNode = target.components[NodeComponent.self]?.source else {
                logger.error(sender: self, message: "Cannot find targetNode")
                continue
            }

            let start: SIMD2<Float> = [source.position.x, source.position.y]
            let end: SIMD2<Float> = [target.position.x, target.position.y]
            let direction = normalize(end - start)

            guard let textEntity = edgeComponent.textEntity else {
                logger.error(sender: self, message: "Cannot find textEntity")
                continue
            }
            guard let lineEntity = edgeComponent.lineEntity else {
                logger.error(sender: self, message: "Cannot find lineEntity")
                continue
            }

            let length: Float
            if distance(start, end) < Float(sourceNode.radius) * globalScale.defaultScale + Float(targetNode.radius) * globalScale.defaultScale {
                // Nodes to close (overlap)
                length = 0
                textEntity.isEnabled = false
                lineEntity.isEnabled = false
            } else {
                // good distance between nodes
                length = distance(
                    start + direction * Float(sourceNode.radius) * Float(globalScale.defaultScale),
                    end - direction * Float(targetNode.radius) * Float(globalScale.defaultScale)
                )
                textEntity.isEnabled = true
                lineEntity.isEnabled = true
            }
            let angle = -atan2(direction.x, direction.y) + (0.5 * .pi)

            lineEntity.scale.x = length

            textEntity.position = [
                length / 2,
                Float(edgeComponent.physicalEdge.parallelIndex) * globalScale.curvature * globalScale.defaultScale,
                textEntity.position.z
            ]
            if angle > 0.5 * .pi || angle < -0.5 * .pi {
                // rotate title by 180 degrees
                textEntity.orientation = simd_quatf(angle: .pi, axis: SIMD3<Float>(0, 0, 1))
            } else {
                textEntity.orientation = simd_quatf(angle: 0, axis: SIMD3<Float>(0, 0, 1))
            }

            entity.position = SIMD3<Float>(start + direction * Float(sourceNode.radius) * Float(globalScale.defaultScale), globalScale.defaultDepth)
            entity.orientation = simd_quatf(angle: angle, axis: SIMD3<Float>(0, 0, 1))
        }
    }
}
