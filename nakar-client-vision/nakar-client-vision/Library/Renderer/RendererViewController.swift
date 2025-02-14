//
//  RendererViewController.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import RealityKit
import SwiftUI
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
    private var meshCache = MeshCache()

    var globalScale: GlobalScale
    var fps: Float = 30
    var maxSpeed: Float = 500

#if os(macOS)
    init(content: RealityViewCameraContent, nakarRoom: NakarRoom, scaleMode: GlobalScale.Mode) {
        self.nakarRoom = nakarRoom
        self.content = content
        globalScale = GlobalScale(mode: scaleMode)

        let camera = PerspectiveCamera()
        camera.position = [0, 0, 0]
        content.add(camera)

        connectObservables()
    }
#endif

#if os(visionOS)
    init(content: RealityViewContent, nakarRoom: NakarRoom, scaleMode: GlobalScale.Mode) {
        self.nakarRoom = nakarRoom
        self.content = content
        globalScale = GlobalScale(mode: scaleMode)

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
            let startDate = Date()
            do {
                guard let content else {
                    return
                }

                for nodeEntity in nodeEntities.values {
                    nodeEntity.removeFromParent()
                }
                for edgeEntity in edgeEntites.values {
                    edgeEntity.removeFromParent()
                }

                nodeEntities.removeAll()
                edgeEntites.removeAll()


                for node in graph.nodes.values {
                    let nodeEntity = try Entity.createNodeEntity(physicalNode: node, renderer: self, meshCache: meshCache)
                    nodeEntities[node.id] = nodeEntity
                    content.add(nodeEntity)
                    await Task.yield()
                }

                for edge in graph.edges.values {
                    if edge.isLoop {
#warning("Need impl")
                        continue
                    }
                    guard
                        let startNodeEntity = nodeEntities[edge.startNodeId],
                        let endNodeEntity = nodeEntities[edge.endNodeId]
                    else {
                        continue
                    }
                    let egde = await Entity.createEdgeEntity(physicalEdge: edge, source: startNodeEntity, target: endNodeEntity, renderer: self, meshCache: meshCache)
                    edgeEntites[edge.id] = egde
                    content.add(egde)
                }
                let endDate = Date()
                let ms = endDate.timeIntervalSince(startDate) * 1000
                print("Creating graph took \(ms) ms. Thats \(1000 / ms) fps.")
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

    func backgroundColorOfNode(physicalNode: PhysicalNode) -> CGColor {
        if let customBackgroundColor = physicalNode.customBackgroundColor, let color = CGColor.from(hex: customBackgroundColor) {
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
        case .custom(let bgColor, _): return CGColor.from(hex: bgColor) ?? backgroundColor(index: 0)
        }
    }

    func backgroundColor(index: Int) -> CGColor {
        switch index {
        case 1: return CGColor.from(hex: "#14A44D")!
        case 2: return CGColor.from(hex: "#DC4C64")!
        case 3: return CGColor.from(hex: "#E4A11B")!
        case 4: return CGColor.from(hex: "#54B4D3")!
        case 5: return CGColor.from(hex: "#332D2D")!
        default: return CGColor.from(hex: "#3B71CA")! // 0
        }
    }

    func jiggleZPosition(_ zPosition: inout Float) {
        zPosition =  zPosition + Float.random(in: -(self.globalScale.elementThickness*0.01)...(self.globalScale.elementThickness*0.01))
    }

    struct GlobalScale {
        let defaultDepth: Float
        let personHeight: Float
        let defaultScale: Float
        let elementThickness: Float
        let curvature: Float = 15

        init(mode: Mode) {
            switch mode {
            case .immersiveSpace:
                defaultDepth = -3
                defaultScale = 0.001
                personHeight = 1.7
                elementThickness = 0.01
            case .window:
                defaultDepth = -5
                defaultScale = 0.001
                personHeight = 0
                elementThickness = 0.0001
            case .volumentricWindow:
                defaultDepth = 0
                defaultScale = 0.001
                personHeight = 0
                elementThickness = 0.01
            }
        }

        enum Mode {
            case window
            case volumentricWindow
            case immersiveSpace
        }
    }
}

