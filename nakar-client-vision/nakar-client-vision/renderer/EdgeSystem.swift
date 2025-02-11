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
            guard let lineEntity = entity.children.first(where: { $0.name == "line" }) else {
                print("No Line entity")
                return
            }

            let physicalEdge = edgeComponent.physicalEdge
            let source = edgeComponent.source
            let target = edgeComponent.target
            
            let start: SIMD2<Float> = [source.position.x, source.position.y]
            let end: SIMD2<Float> = [target.position.x, target.position.y]
            let length = distance(start, end)
            lineEntity.scale = [length, 1, 1]
            entity.position = SIMD3<Float>((start + end) / 2, globalScale.defaultDepth - 0.005)

            let direction = normalize(end - start)
            let vectorToRight = SIMD2<Float>(1, 0)
            var angle = -atan2(direction.x, direction.y)
            angle += (2 * .pi) / 4
            if angle > (2 * .pi) / 4 || angle < -(2 * .pi) / 4 {
                angle += .pi
            }

            entity.orientation = simd_quatf(angle: angle, axis: SIMD3<Float>(0, 0, 1))
        }
    }
}
