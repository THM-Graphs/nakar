//
//  EdgeEntity.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit
import NakarKit
import Foundation
import SwiftUI

extension Entity {
    class func createEdgeEntity(physicalEdge: PhysicalEdge, source: Entity, target: Entity, renderer: RendererViewController) -> Entity {
        let entity = Entity()
        let start: SIMD3<Float> = [source.position.x, source.position.y, renderer.globalScale.defaultDepth]
        let end: SIMD3<Float> = [target.position.x, target.position.y, renderer.globalScale.defaultDepth]
        let length = distance(start, end)

        // Create a very thin box that will act as the line
        let lineMaterial = UnlitMaterial(color: .white)
        let lineMesh = MeshResource.generateBox(size: [1, Float(physicalEdge.width) * renderer.globalScale.defaultScale, 0.00001])
        let lineEntity = ModelEntity(mesh: lineMesh, materials: [lineMaterial])
        lineEntity.name = "line"
        entity.addChild(lineEntity)

        entity.components.set(EdgeComponent(physicalEdge: physicalEdge, source: source, target: target, renderer: renderer))

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
        textComponent.edgeInsets = TextComponent.EdgeInsets(top: 4, left: 4, bottom: 4, right: 4)
        let height = textString.height() + 8
        let width = textString.width() + 8
        textComponent.size = CGSize(width: width, height: height)
        let textEntity = Entity()
        textEntity.components.set(textComponent)
        textEntity.scale = SIMD3<Float>(SIMD2<Float>(repeating: 2.8), 1) // idk why

        entity.addChild(textEntity)

        return entity
    }
}


