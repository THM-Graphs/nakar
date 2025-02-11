//
//  RendererViewController.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit
import SwiftUI
import NakarKit
import Combine

class RendererViewController {
    private var container: Entity? = nil
    private var nodeEntities: [String: Entity] = [:]
    private var edgeEntites: [String: Entity] = [:]
    private var nakarRoom: NakarRoom

    init(nakarRoom: NakarRoom) {
        self.nakarRoom = nakarRoom
    }

    func initialize(content: RealityViewCameraContent) {
        let camera = PerspectiveCamera()
        camera.position = [0, 0, 4000]
        content.add(camera)

        let container = Entity()
        content.add(container)

        self.container = container
    }

    func receiveNewGraph(graph: PhysicalGraph) {
        guard let container else {
            return
        }

        nodeEntities.values.forEach {
            $0.removeFromParent()
        }
        nodeEntities.removeAll()
        for node in graph.nodes.values {
            let sphere = createNode(node: node)
            nodeEntities[node.id] = sphere
            container.addChild(sphere)
        }

        edgeEntites.values.forEach {
            $0.removeFromParent()
        }
        edgeEntites.removeAll()
        for edge in graph.edges.values {
            guard
                let startNodeEntity = nodeEntities[edge.startNodeId],
                let endNodeEntity = nodeEntities[edge.endNodeId]
            else {
                continue
            }
            let edgeEntity = createLine(startNodeEntity: startNodeEntity, endNodeEntity: endNodeEntity, width: edge.width)
            container.addChild(edgeEntity)
            edgeEntites[edge.id] = edgeEntity
        }


    }

    func receiveNodesMoved(nodes: [String: PhysicalNode]) {
        for node in nodes.values {
            guard let nodeEntity = nodeEntities[node.id] else {
                continue
            }
            applyNodePosition(node: node, entity: nodeEntity)
        }
        redoEdges()
    }

    func redoEdges() {
        guard
            let container,
            let graph = nakarRoom.graph else {
            return
        }

        for edge in graph.edges.values {
            guard
                let edgeEntity = edgeEntites[edge.id],
                let startNodeEntity = nodeEntities[edge.startNodeId],
                let endNodeEntity = nodeEntities[edge.endNodeId]
            else {
                continue
            }

            // try? edgeEntity.components[ModelComponent.self]?.mesh.replace(with: createLineMesh(startNodeEntity: startNodeEntity, endNodeEntity: endNodeEntity, width: edge.width).contents)
            applyEdgeNodePosition(edge: edgeEntity, startNodeEntity: startNodeEntity, endNodeEntity: endNodeEntity)
        }
    }

    func createNode(node: PhysicalNode) -> Entity {
        let material = UnlitMaterial(color: .blue)
        let sphere = ModelEntity(mesh: .generateSphere(radius: Float(node.radius)), materials: [material])
        sphere.position = [Float(node.position.x), -Float(node.position.y), 0]
        return sphere
    }

    func applyNodePosition(node: PhysicalNode, entity: Entity) {
        entity.position = [Float(node.position.x), -Float(node.position.y), 0]
    }

    func createLine(startNodeEntity: Entity, endNodeEntity: Entity, width: Double) -> ModelEntity {
        let start: SIMD3<Float> = [startNodeEntity.position.x, startNodeEntity.position.y, 0]
        let end: SIMD3<Float> = [endNodeEntity.position.x, endNodeEntity.position.y, 0]
        let direction = normalize(end - start) // Get direction vector

        // Create a very thin box that will act as the line
        let lineMesh = createLineMesh(startNodeEntity: startNodeEntity, endNodeEntity: endNodeEntity, width: width)

        let modelEntity = ModelEntity(mesh: lineMesh)

        applyEdgeNodePosition(edge: modelEntity, startNodeEntity: startNodeEntity, endNodeEntity: endNodeEntity)

        return modelEntity
    }

    func createLineMesh(startNodeEntity: Entity, endNodeEntity: Entity, width: Double) -> MeshResource {
        let start: SIMD3<Float> = [startNodeEntity.position.x, startNodeEntity.position.y, 0]
        let end: SIMD3<Float> = [endNodeEntity.position.x, endNodeEntity.position.y, 0]

        let length = distance(start, end)     // Get the length of the line

        // Create a very thin box that will act as the line
        let lineMesh = MeshResource.generateBox(size: [Float(width), Float(width), length])

        return lineMesh
    }

    func applyEdgeNodePosition(edge: Entity, startNodeEntity: Entity, endNodeEntity: Entity) {
        let start: SIMD3<Float> = [startNodeEntity.position.x, startNodeEntity.position.y, 0]
        let end: SIMD3<Float> = [endNodeEntity.position.x, endNodeEntity.position.y, 0]
        let direction = normalize(end - start) // Get direction vector

        edge.position = (start + end) / 2

        // Rotate the entity to align it with the direction from start to end
        let angle = acos(dot(SIMD3<Float>(0, 0, 1), direction))
        let axis = cross(SIMD3<Float>(0, 0, 1), direction)
        edge.orientation = simd_quatf(angle: angle, axis: axis)
    }

}
