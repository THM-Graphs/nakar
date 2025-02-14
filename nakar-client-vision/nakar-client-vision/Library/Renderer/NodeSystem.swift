//
//  NodeSystem.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit
import Foundation

class NodeSystem: System {
    private static let query = EntityQuery(where: .has(NodeComponent.self))

    required init(scene: Scene) { }

    func update(context: SceneUpdateContext) {
        for entity in context.entities(
            matching: Self.query,
            updatingSystemWhen: .rendering
        ) {
            guard let nodeComponent = entity.components[NodeComponent.self] else {
                print("Error: Cannot get node component")
                return
            }
            guard let renderer = nodeComponent.renderer else {
                print("Error: no renderer")
                return
            }
            let globalScale = renderer.globalScale

            let physicalNode = nodeComponent.source

            var velocity = nodeComponent.velocity
            let smoothTime: Float = (1 / renderer.fps) * 1.5; // compensate slow ws
            let position = smoothDamp(
                current: entity.position,
                target: [
                    Float(physicalNode.position.x) * globalScale.defaultScale,
                    -Float(physicalNode.position.y) * globalScale.defaultScale + globalScale.personHeight,
                    globalScale.defaultDepth
                ],
                currentVelocity: &velocity,
                smoothTime: smoothTime,
                maxSpeed: renderer.maxSpeed,
                deltaTime: Float(context.deltaTime)
            )
            nodeComponent.velocity = velocity

            entity.position = position
        }
    }

    private func smoothDamp(
        current: SIMD3<Float>,
        target: SIMD3<Float>,
        currentVelocity: inout SIMD3<Float>,
        smoothTime: Float,
        maxSpeed: Float,
        deltaTime: Float
    ) -> SIMD3<Float> {

        let omega = 2.0 / smoothTime
        let x = omega * deltaTime
        let exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x)

        var change = current - target
        let maxChange = maxSpeed * smoothTime
        let magnitude = simd_length(change)

        if magnitude > maxChange {
            change *= maxChange / magnitude
        }

        let temp = (currentVelocity + omega * change) * deltaTime
        currentVelocity = (currentVelocity - omega * temp) * exp
        let result = target + (change + temp) * exp

        return result
    }

}
