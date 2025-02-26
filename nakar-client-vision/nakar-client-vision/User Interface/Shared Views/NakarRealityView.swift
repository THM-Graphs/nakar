//
//  NakarRealityView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 17.02.25.
//

import SwiftUI
import RealityKit
import Combine

struct NakarRealityView: View {
    @Environment(NakarController.self) var nakarController: NakarController

    @State private var cancellables: Set<AnyCancellable> = []
    @State private var metaData: Components.Schemas.GraphMetaData? = nil
    @State private var room: NakarRoom? = nil
    #if os(visionOS)
    @State private var content: RealityViewContent? = nil
    #endif
    #if os(macOS)
    @State private var content: RealityViewCameraContent? = nil
    #endif
    let nodeEnties = NSMapTable<NSString, Entity>(keyOptions: .strongMemory, valueOptions: .weakMemory)

    let roomId: String
    let mode: RendererTools.GlobalScale.Mode
    var globalScale: RendererTools.GlobalScale {
        RendererTools.GlobalScale(mode: mode)
    }

    var body: some View {
        RealityView { content in
            self.content = content
            NodeSystem.registerSystem()
            EdgeSystem.registerSystem()

            let room = self.nakarController.enterRoom(roomId: self.roomId)
            self.room = room

            room.onNewGraph.sink(receiveValue: self.receiveNewGraph).store(in: &self.cancellables)
            room.onNodesMoved.sink(receiveValue: self.receiveNodesMoved).store(in: &self.cancellables)
        }.onDisappear {
            self.nakarController.leaveRoom(roomId: self.roomId)
            self.cancellables.forEach {
                $0.cancel()
            }
        }
        .simultaneousGesture(
            DragGesture()
                .targetedToAnyEntity()
                .onEnded { value in
                    guard let entity = value.entity.parent else {
                        return
                    }
                    guard let component = entity.components[NodeComponent.self] else {
                        return
                    }
                    component.dragStartPosition = nil

                    if let room = self.room {
                        room.sendUngrabNode(nodeId: component.source.id)
                    }
                }
                .onChanged { value in
                    guard let entity = value.entity.parent else {
                        return
                    }
                    guard let component = entity.components[NodeComponent.self] else {
                        return
                    }
                    if component.dragging == false {
                        component.dragStartPosition = entity.position
                        if let room = self.room {
                            room.sendGrabNode(nodeId: component.source.id)
                        }
                    }

                    #if os(visionOS)
                    let targetLocation = value.convert(value.gestureValue.translation3D, from: .local, to: .scene)
                    let planePoint: SIMD3<Float> = [0, 0, globalScale.defaultDepth]
                    let planeNormal: SIMD3<Float> = [0, 0, -1]
                    let origin: SIMD3<Float> = value.inputDevicePose3D?.position
                    let direction: SIMD3<Float> = value.inputDevicePose3D

                    let point = RendererTools.raycastToCustomPlane(from: origin, direction: direction, planePoint: planePoint, planeNormal: planeNormal)

                    print(targetLocation)
                    entity.position.x = component.dragStartPosition!.x + Float(targetLocation.x)
                    entity.position.y = component.dragStartPosition!.y + Float(targetLocation.y)
                    entity.position.z = component.dragStartPosition!.z + Float(targetLocation.z)
                    #endif
                    #if os(macOS)
                    let targetLocation = value.translation
                    entity.position.x = component.dragStartPosition!.x + Float(Float(targetLocation.width) * globalScale.defaultScale)
                    entity.position.y = component.dragStartPosition!.y - Float(Float(targetLocation.height) * globalScale.defaultScale)
                    #endif


                    component.source.position.x = Double(entity.position.x / globalScale.defaultScale)
                    component.source.position.y = -Double((entity.position.y - globalScale.personHeight) / globalScale.defaultScale)

                    if let room = self.room {
                        room.sendNodeMoved(
                            nodeId: component.source.id,
                            positionX: component.source.position.x,
                            positionY: component.source.position.y
                        )
                    }
                }
        )
    }

    func handleDrag(value: EntityTargetValue<DragGesture.Value>) {

    }

    func receiveNewGraph(graph: Components.Schemas.Graph) {
        guard let content = self.content else {
            return
        }
        let meshCache = MeshCache()
        Task {
            let startDate = Date()
            do {
                content.entities.removeAll()

                self.metaData = graph.metaData

                for node in graph.nodes {
                    let nodeEntity = try Entity.createNodeEntity(
                        physicalNode: node,
                        meshCache: meshCache,
                        globalScale: globalScale,
                        metaData: graph.metaData
                    )
                    nodeEnties.setObject(nodeEntity, forKey: node.id as NSString)
                    content.add(nodeEntity)
                }

                for edge in graph.edges {
                    if edge.isLoop {
#warning("Need impl")
                        continue
                    }
                    guard
                        let startNodeEntity = nodeEnties.object(forKey: edge.startNodeId as NSString),
                        let endNodeEntity = nodeEnties.object(forKey: edge.endNodeId as NSString)
                    else {
                        continue
                    }
                    let egde = await Entity.createEdgeEntity(
                        physicalEdge: edge,
                        source: startNodeEntity,
                        target: endNodeEntity,
                        meshCache: meshCache,
                        globalScale: globalScale
                    )
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

    func receiveNodesMoved(nodes: [Components.Schemas.PhysicalNode]) {
        for node in nodes {
            guard let nodeEntity = nodeEnties.object(forKey: node.id as NSString) else {
                continue
            }
            nodeEntity.components[NodeComponent.self]?.source.position = node.position
        }
    }
}
