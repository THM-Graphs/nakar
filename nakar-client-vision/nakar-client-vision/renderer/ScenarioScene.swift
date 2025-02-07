//
//  ScenarioScene.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 07.02.25.
//

import SpriteKit
import SwiftUI

class ScenarioScene: SKScene {
    var nodes: [String: SKNode] = [:]

    class func setup(colorScheme: ColorScheme) -> ScenarioScene {
        let scene = ScenarioScene(size: CGSize(width: 1000, height: 1000))
        scene.scaleMode = .aspectFill
        scene.backgroundColor = colorScheme == .dark ? .darkGray  : .white
        scene.isUserInteractionEnabled = true

        let camera = SKCameraNode()
        scene.camera = camera
        scene.addChild(camera)
        camera.setScale(1)
        camera.position = CGPoint(x: 100, y: 0)

        return scene
    }

    func addNode(node: Components.Schemas.Node) {
        let shapeNode = PhysicalNode.setup(node: node)
        self.addChild(shapeNode)
        nodes[node.id] = shapeNode
    }

    func addNodes(nodes: [Components.Schemas.Node]) {
        nodes.forEach {
            addNode(node: $0)
        }
    }
}
