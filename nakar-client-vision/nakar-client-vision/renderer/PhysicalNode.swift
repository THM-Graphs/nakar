//
//  PhysicalNode.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 07.02.25.
//

import SpriteKit

class PhysicalNode: SKShapeNode {
    class func setup(node: Components.Schemas.Node) -> PhysicalNode {
        let shapeNode = PhysicalNode(circleOfRadius: node.radius)
        shapeNode.position = CGPoint(x: node.position.x, y: node.position.y)
        shapeNode.fillColor = .blue
        shapeNode.strokeColor = .brown

        let text = SKLabelNode(text: node.title)
        text.fontColor = .white
        text.fontName = "Helvetica"
        text.preferredMaxLayoutWidth = node.radius * 2
        text.lineBreakMode = .byCharWrapping
        text.horizontalAlignmentMode = .center
        text.verticalAlignmentMode = .center
        text.fontSize = node.radius * 0.3 + 8
        shapeNode.addChild(text)

        return shapeNode
    }
}
