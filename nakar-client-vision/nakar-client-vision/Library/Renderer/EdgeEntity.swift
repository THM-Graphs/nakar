//
//  EdgeEntity.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit
import Foundation
import SwiftUI

extension Entity {
    class func createEdgeEntity(physicalEdge: PhysicalEdge, source: Entity, target: Entity, renderer: RendererViewController, meshCache: MeshCache) async -> Entity {
        let entity = Entity()
        let start: SIMD3<Float> = [source.position.x, source.position.y, renderer.globalScale.defaultDepth]
        let end: SIMD3<Float> = [target.position.x, target.position.y, renderer.globalScale.defaultDepth]

        // Line
        // let lineMaterial = UnlitMaterial(color: .white)
        var lineMaterial = PhysicallyBasedMaterial()
        lineMaterial.baseColor = .init(tint: .black)
        lineMaterial.sheen = .init(tint: .black)
        lineMaterial.emissiveColor = .init(color: .white)
        lineMaterial.emissiveIntensity = 2
        let lineThickness = renderer.globalScale.elementThickness / 2
        let lineMesh = await meshCache.generateCurve(
            curvature: Float(physicalEdge.parallelIndex) * renderer.globalScale.curvature * renderer.globalScale.defaultScale,
            width: Float(physicalEdge.width) * renderer.globalScale.defaultScale,
            length: 1,
            thickness: lineThickness
        )
        let lineEntity = ModelEntity(mesh: lineMesh, materials: [lineMaterial, lineMaterial])
        renderer.jiggleZPosition(&lineEntity.position.z)
        entity.addChild(lineEntity)

        // Title Label
        var textString = AttributedString(physicalEdge.type)
        let fontSize: CGFloat = 12
        textString.font = .systemFont(ofSize: fontSize, weight: .bold)
        textString.foregroundColor = .black
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.alignment = .center
        textString.paragraphStyle = paragraphStyle
        var textComponent = TextComponent()
        textComponent.text = textString
        textComponent.backgroundColor = CGColor.init(gray: 1, alpha: 1)
        textComponent.cornerRadius = 4
        textComponent.edgeInsets = TextComponent.EdgeInsets(top: 4, left: 8, bottom: 4, right: 8)
        let height = textString.height() + 8
        let width = textString.width() + 16
        textComponent.size = CGSize(width: width, height: height)
        let textEntity = Entity()
        textEntity.components.set(textComponent)
        textEntity.scale = SIMD3<Float>(SIMD2<Float>(repeating: 2.8), 1) // idk why
        textEntity.position.z = lineEntity.position.z + lineThickness / 2
        renderer.jiggleZPosition(&textEntity.position.z)
        entity.addChild(textEntity)

        // Hover
        textEntity.components.set(InputTargetComponent())
        textEntity.components.set(CollisionComponent(
            shapes: [ShapeResource.generateBox(width: Float(width), height: Float(height), depth: renderer.globalScale.elementThickness)]
        ))
        textEntity.components.set(HoverEffectComponent(.highlight(.init(color: .black, strength: 1))))

        // Edge
        entity.components.set(EdgeComponent(
            physicalEdge: physicalEdge,
            source: source,
            target: target,
            lineEntity: lineEntity,
            textEntity: textEntity,
            renderer: renderer)
        )

        return entity
    }
}


