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
    @Environment(NakarApplication.self) var nakarApplication: NakarApplication

    @State private var cancellables: Set<AnyCancellable> = []
    @State private var content: RealityViewContent? = nil

    let edgeEnties = NSMapTable<NSString, Entity>(keyOptions: .strongMemory, valueOptions: .weakMemory)
    let nodeEnties = NSMapTable<NSString, Entity>(keyOptions: .strongMemory, valueOptions: .weakMemory)

    let room: ViewModel.Room

    let mode: RendererService.GlobalScale.Mode
    var globalScale: RendererService.GlobalScale {
        RendererService.GlobalScale(mode: mode)
    }

    var body: some View {
        RealityView { content in
            self.content = content
            NodeSystem.registerSystem()
            EdgeSystem.registerSystem()

            nakarApplication.wsService.onWSEventScenarioLoaded.sink(receiveValue: self.onWSEventScenarioLoaded).store(in: &self.cancellables)
            nakarApplication.wsService.onWSEventNodesMoved.sink(receiveValue: self.onWSEventNodesMoved).store(in: &self.cancellables)

            nakarApplication.viewService.enterRoom(room: room)
        }.onDisappear {
            self.cancellables.forEach {
                $0.cancel()
            }
            self.content?.entities.removeAll()
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

                    nakarApplication.wsService.send(message: Components.Schemas.WSActionUngrabNode(_type: .wsActionUngrabNode, nodeId: component.source.id))
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
                        nakarApplication.wsService.send(message: Components.Schemas.WSActionGrabNode(_type: .wsActionGrabNode, nodeId: component.source.id))
                    }

//                    let targetLocation = value.convert(value.gestureValue.translation3D, from: .local, to: .scene)
//                    let planePoint: SIMD3<Float> = [0, 0, globalScale.defaultDepth]
//                    let planeNormal: SIMD3<Float> = [0, 0, -1]
//                    let origin = value.inputDevicePose3D?.position
//                    let direction = value.inputDevicePose3D
//
//                    let point = RendererTools.raycastToCustomPlane(from: SIMD3<Float>(Float(origin.x), Float(origin.y), Float(origin.z)), direction: direction, planePoint: planePoint, planeNormal: planeNormal)
//
//                    print(targetLocation)
//                    entity.position.x = component.dragStartPosition!.x + Float(targetLocation.x)
//                    entity.position.y = component.dragStartPosition!.y + Float(targetLocation.y)
//                    entity.position.z = component.dragStartPosition!.z + Float(targetLocation.z)

                    component.source.position.x = Double(entity.position.x / globalScale.defaultScale)
                    component.source.position.y = -Double((entity.position.y - globalScale.personHeight) / globalScale.defaultScale)

                    nakarApplication.wsService.send(
                        message: Components.Schemas.WSActionMoveNodes(
                            _type: .wsActionMoveNodes,
                            nodes: [Components.Schemas.PhysicalNode(
                                id: component.source.id,
                                position: Components.Schemas.Position(
                                    x: component.source.position.x,
                                    y: component.source.position.y
                                )
                            )]
                        )
                    )
                }
        )
    }

    func onWSEventScenarioLoaded(event: Components.Schemas.WSEventScenarioLoaded) {
        nakarApplication.loggerService.debug(sender: self, message: "Did receive \(event.graph.nodes.count) nodes and \(event.graph.edges.count) edges.")
        Task {
            do {
                let startDate = Date()

                guard let content = self.content else {
                    return
                }

                let rootEntity = Entity()

                content.entities.first?.removeFromParent()

                await Task.yield()

                for node in event.graph.nodes {
                    let nodeEntity = try nakarApplication.rendererService.createNodeEntity(
                        physicalNode: node,
                        globalScale: globalScale,
                        metaData: event.graph.metaData
                    )
                    nodeEnties.setObject(nodeEntity, forKey: node.id as NSString)
                    rootEntity.addChild(nodeEntity)
                }

                for edge in event.graph.edges {
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
                    let egdeEntity = await nakarApplication.rendererService.createEdgeEntity(
                        physicalEdge: edge,
                        source: startNodeEntity,
                        target: endNodeEntity,
                        globalScale: globalScale
                    )
                    edgeEnties.setObject(egdeEntity, forKey: edge.id as NSString)
                    rootEntity.addChild(egdeEntity)
                }

                content.add(rootEntity)

                let endDate = Date()
                let ms = endDate.timeIntervalSince(startDate) * 1000
                nakarApplication.loggerService.debug(sender: self, message: "Creating graph took \(ms) ms. Thats \(1000 / ms) fps.")
            } catch let error {
                nakarApplication.loggerService.error(sender: self, message: error.localizedDescription)
            }
        }
    }

    func onWSEventNodesMoved(event: Components.Schemas.WSEventNodesMoved) {
        let nodes = event.nodes
        for node in nodes {
            guard let nodeEntity = nodeEnties.object(forKey: node.id as NSString) else {
                continue
            }
            nodeEntity.components[NodeComponent.self]?.source.position = node.position
        }
    }
}
