//
//  RoomManager.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 07.02.25.
//

import SwiftUI
import Combine
import SpriteKit

public class NakarRoom: WSBackendDelegate, ObservableObject {
    private let socketIOManager: WSBackend

    public var graph: PhysicalGraph?
    public let onNewGraph: PassthroughSubject<PhysicalGraph, Never>
    public let onNodesMoved: PassthroughSubject<[String: PhysicalNode], Never>

    public let roomId: String


    public init(roomId: String) {
        self.socketIOManager = WSBackend()
        graph = nil
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
        let newGraph = PhysicalGraph(of: event.graph)
        self.graph = newGraph
        onNewGraph.send(newGraph)
    }

    func onWSEventNodesMoved(event: Components.Schemas.WSEventNodesMoved) {
        guard let graph else {
            print("cannot acces graph. its null")
            return
        }
        var updatedNodes: [String: PhysicalNode] = [:]
        for node in event.nodes {
            guard var existingNode = graph.nodes[node.id] else {
                continue
            }
            existingNode.position = .init(of: node.position)
            updatedNodes[existingNode.id] = existingNode
        }
        onNodesMoved.send(updatedNodes)
    }

    func onWSEventNotification(event: Components.Schemas.WSEventNotification) {
#warning("")
    }

    func onWSEventScenarioProgress(event: Components.Schemas.WSEventScenarioProgress) {
#warning("")
    }

    func onClientDisconnect(reason: String) {
#warning("")
    }

    public var socketStatus: SocketStatus {
        self.socketIOManager.socketStatus
    }
}
