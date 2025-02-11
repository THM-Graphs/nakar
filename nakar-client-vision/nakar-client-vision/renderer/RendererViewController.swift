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

@MainActor
class RendererViewController {
    #if os(visionOS)
    private var content: RealityViewContent? = nil
    #endif
    #if os(macOS)
    private var content: RealityViewCameraContent? = nil
    #endif
    private var nodeEntities: [String: Entity] = [:]
    private var edgeEntites: [String: Entity] = [:]
    private var nakarRoom: NakarRoom
    private var cancellables: Set<AnyCancellable> = []

    var globalScale = GlobalScale()
    var fps: Float = 30
    var maxSpeed: Float = 500

#if os(macOS)
    init(content: RealityViewCameraContent, nakarRoom: NakarRoom) {
        self.nakarRoom = nakarRoom
        self.content = content

        let camera = PerspectiveCamera()
        camera.position = [0, 0, 2]
        content.add(camera)

        connectObservables()
    }
#endif

#if os(visionOS)
    init(content: RealityViewContent, nakarRoom: NakarRoom) {
        self.nakarRoom = nakarRoom
        self.content = content

        connectObservables()
    }
#endif


    private func connectObservables() {
        NodeSystem.registerSystem()
        EdgeSystem.registerSystem()

        self.nakarRoom.onNewGraph.sink(receiveValue: self.receiveNewGraph).store(in: &cancellables)
        self.nakarRoom.onNodesMoved.sink(receiveValue: self.receiveNodesMoved).store(in: &cancellables)
        if let graph = self.nakarRoom.graph {
            self.receiveNewGraph(graph: graph)
        }
    }

    func close() {
        cancellables.forEach {
            $0.cancel()
        }
    }

    func receiveNewGraph(graph: PhysicalGraph) {
        Task {
            do {
                guard let content else {
                    return
                }

                nodeEntities.values.forEach {
                    $0.removeFromParent()
                }
                nodeEntities.removeAll()
                for node in graph.nodes.values {
                    let nodeEntity = try Entity.createNodeEntity(physicalNode: node, renderer: self)
                    nodeEntities[node.id] = nodeEntity
                    content.add(nodeEntity)
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
                    let egde = Entity.createEdgeEntity(physicalEdge: edge, source: startNodeEntity, target: endNodeEntity, renderer: self)
                    content.add(egde)
                    edgeEntites[edge.id] = egde
                }
            } catch let error {
                print(error)
            }
        }
    }

    func receiveNodesMoved(nodes: [String: PhysicalNode]) {
        for node in nodes.values {
            guard let nodeEntity = nodeEntities[node.id] else {
                continue
            }
            nodeEntity.components[NodeComponent.self]?.source = node
        }
    }

    func backgroundColorOfNode(physicalNode: PhysicalNode) -> NativeColor {
        if let customBackgroundColor = physicalNode.customBackgroundColor, let color = NativeColor(hex: customBackgroundColor) {
            return color
        }
        guard let firstLabel = physicalNode.labels.first else {
            return backgroundColor(index: 0)
        }
        guard let foundLabel = self.nakarRoom.graph?.metaData.labels.first(where: { $0.label == firstLabel }) else {
            return backgroundColor(index: 0)
        }
        switch foundLabel.color {
        case .preset(let index): return backgroundColor(index: index)
        case .custom(let bgColor, _): return NativeColor(hex: bgColor) ?? backgroundColor(index: 0)
        }
    }

    func backgroundColor(index: Int) -> NativeColor {
        switch index {
        case 1: return NativeColor(hex: "#14A44D")!
        case 2: return NativeColor(hex: "#DC4C64")!
        case 3: return NativeColor(hex: "#E4A11B")!
        case 4: return NativeColor(hex: "#54B4D3")!
        case 5: return NativeColor(hex: "#332D2D")!
        default: return NativeColor(hex: "#3B71CA")! // 0
        }
    }

    struct GlobalScale {
        let defaultDepth: Float = -2
        let defaultScale: Float = 0.001

        var personHeight: Float {
#if os(visionOS)
            return 1.7
#endif
#if os(macOS)
            return 0
#endif
        }
    }
}

