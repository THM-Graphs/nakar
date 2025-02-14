//
//  NodeEntity.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit
import NakarKit
import SwiftUI
import Foundation

extension Entity {
    class func createNodeEntity(physicalNode: PhysicalNode, renderer: RendererViewController, meshCache: MeshCache) throws -> Entity {
        let entity = Entity()

        // Model
        // let material = UnlitMaterial(color: renderer.backgroundColorOfNode(physicalNode: physicalNode).platformNative)
        let material = SimpleMaterial(color: renderer.backgroundColorOfNode(physicalNode: physicalNode).platformNative, isMetallic: false)
        let radius = Float(physicalNode.radius) * renderer.globalScale.defaultScale
        let mesh = meshCache.generateCircle(radius: radius, thickness: renderer.globalScale.elementThickness)
        let model = ModelEntity(mesh: mesh, materials: [material])
        model.transform.rotation = simd_quatf.init(angle: .pi / 2, axis: SIMD3<Float>.init(x: 1, y: 0, z: 0))
        renderer.jiggleZPosition(&model.position.z)
        entity.addChild(model)

        // Node
        entity.components.set(NodeComponent(source: physicalNode, renderer: renderer))

        // Hover
        model.components.set(InputTargetComponent())
        model.components.set(CollisionComponent(
            shapes: [ShapeResource.generateSphere(radius: Float(physicalNode.radius) * renderer.globalScale.defaultScale)]
        ))
        model.components.set(HoverEffectComponent(.highlight(.init(color: .white, strength: 1))))

        // Title Label
        var textString = AttributedString(physicalNode.title)
        let fontSize: CGFloat = (CGFloat(physicalNode.radius) / 5 + 3)
        textString.font = .systemFont(ofSize: fontSize, weight: .bold)
        textString.foregroundColor = .white
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = .center
        textString.paragraphStyle = paragraphStyle
        var textComponent = TextComponent()
        textComponent.text = textString
        let height = min(textString.height(withWidth: physicalNode.radius * 2), physicalNode.radius * 2)
        textComponent.size = CGSize(width: physicalNode.radius * 2, height: height)
        let textEntity = Entity()
        textEntity.components.set(textComponent)
        textEntity.scale = SIMD3<Float>(SIMD2<Float>(repeating: 2.8), 1) // idk why
        textEntity.position.z = model.position.z + renderer.globalScale.elementThickness / 2
        entity.addChild(textEntity)


        return entity
    }
}
