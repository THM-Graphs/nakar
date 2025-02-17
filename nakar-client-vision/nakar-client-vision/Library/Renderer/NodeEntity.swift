//
//  NodeEntity.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit
import SwiftUI
import Foundation

extension Entity {
    class func createNodeEntity(physicalNode: Components.Schemas.Node, meshCache: MeshCache, globalScale: RendererTools.GlobalScale, metaData: Components.Schemas.GraphMetaData) throws -> Entity {
        let entity = Entity()

        // Model
        // let material = UnlitMaterial(color: renderer.backgroundColorOfNode(physicalNode: physicalNode).platformNative)
        let material = SimpleMaterial(color: RendererTools.backgroundColorOfNode(physicalNode: physicalNode, metaData: metaData).platformNative, isMetallic: false)
        let radius = Float(physicalNode.radius) * globalScale.defaultScale
        let mesh = meshCache.generateCircle(radius: radius, thickness: globalScale.elementThickness)
        let model = ModelEntity(mesh: mesh, materials: [material])
        model.transform.rotation = simd_quatf.init(angle: .pi / 2, axis: SIMD3<Float>.init(x: 1, y: 0, z: 0))
        RendererTools.jiggleZPosition(&model.position.z, globalScale: globalScale)
        entity.addChild(model)

        // Node
        entity.components.set(NodeComponent(source: physicalNode, globalScale: globalScale))

        // Hover
        model.components.set(InputTargetComponent())
        model.components.set(CollisionComponent(
            shapes: [ShapeResource.generateSphere(radius: Float(physicalNode.radius) * globalScale.defaultScale)]
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
        textEntity.position.z = model.position.z + globalScale.elementThickness / 2
        entity.addChild(textEntity)


        return entity
    }
}
