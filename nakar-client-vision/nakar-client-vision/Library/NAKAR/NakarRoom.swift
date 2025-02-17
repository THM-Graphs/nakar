//
//  RoomManager.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 07.02.25.
//

import SwiftUI
import Combine
import SpriteKit

@Observable
class NakarRoom: WSBackendDelegate {
    private let socketIOManager: WSBackend

    let onNewGraph: PassthroughSubject<Components.Schemas.Graph, Never>
    let onNodesMoved: PassthroughSubject<[Components.Schemas.PhysicalNode], Never>

    let roomId: String

    init(roomId: String) {
        self.socketIOManager = WSBackend()
        onNewGraph = PassthroughSubject()
        onNodesMoved = PassthroughSubject()
        self.roomId = roomId

        socketIOManager.connect(delegate: self)
    }

    func leave() {
        self.socketIOManager.close()
    }

    func onClientConnect() {
        let msg = Components.Schemas.WSClientToServerMessage.WSActionJoinRoom(
            Components.Schemas.WSActionJoinRoom(
                _type: Components.Schemas.WSActionJoinRoom._TypePayload.wsActionJoinRoom,
                roomId: roomId
            )
        )
        socketIOManager.send(message: msg)
    }

    func onWSEventScenarioLoaded(event: Components.Schemas.WSEventScenarioLoaded) {
        print("Did receive \(event.graph.nodes.count) nods.")
        onNewGraph.send(event.graph)
    }

    func onWSEventNodesMoved(event: Components.Schemas.WSEventNodesMoved) {
        onNodesMoved.send(event.nodes)
    }

    func onWSEventNotification(event: Components.Schemas.WSEventNotification) {
        print(event.message)
#warning("")
    }

    func onWSEventScenarioProgress(event: Components.Schemas.WSEventScenarioProgress) {
        print(event.message ?? "-")
#warning("")
    }

    func onClientDisconnect(reason: String) {
#warning("")
    }

    var socketStatus: SocketStatus {
        self.socketIOManager.socketStatus
    }

    func run(_ scenario: ViewModel.Scenario) {
        let message = Components.Schemas.WSClientToServerMessage.WSActionLoadScenario(Components.Schemas.WSActionLoadScenario(_type: .wsActionLoadScenario, scenarioId: scenario.id))
        socketIOManager.send(message: message)
    }

    func sendGrabNode(nodeId: String) -> Void {
        let message = Components.Schemas.WSClientToServerMessage.WSActionGrabNode(
            Components.Schemas.WSActionGrabNode(_type: .wsActionGrabNode, nodeId: nodeId)
        )
        socketIOManager.send(message: message)
    }

    func sendUngrabNode(nodeId: String) -> Void {
        let message = Components.Schemas.WSClientToServerMessage.WSActionUngrabNode(
            Components.Schemas.WSActionUngrabNode(_type: .wsActionUngrabNode, nodeId: nodeId)
        )
        socketIOManager.send(message: message)
    }

    func sendNodeMoved(nodeId: String, positionX: Double, positionY: Double) -> Void {
        let message = Components.Schemas.WSClientToServerMessage.WSActionMoveNodes(
            Components.Schemas.WSActionMoveNodes(_type: .wsActionMoveNodes, nodes: [
                .init(id: nodeId, position: .init(x: positionX, y: positionY))
            ])
        )
        socketIOManager.send(message: message)
    }
}
