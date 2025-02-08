//
//  RoomManager.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 07.02.25.
//

import SwiftUI
import Combine
import SpriteKit

@Observable class RoomManager {
    private var cancellables: Set<AnyCancellable>
    let socketIOManager: SocketIOManager

    var scene: ScenarioScene
    var graph: Components.Schemas.Graph?
    let roomId: String

    init(environmentHandler: EnvironmentHandler, roomId: String, colorScheme: ColorScheme) {
        self.socketIOManager = SocketIOManager(environmentHandler: environmentHandler)
        self.cancellables = Set()
        self.roomId = roomId
        self.scene = ScenarioScene.setup(colorScheme: colorScheme)
        self.graph = nil

        socketIOManager.onClientConnect$.sink {
            self.onClientConnect()
        }.store(in: &self.cancellables)

        socketIOManager.onMessage$.sink { message in
            switch message {
            case .WSEventScenarioLoaded(let event): self.onWSEventScenarioLoaded(event: event)
            case .WSEventNodesMoved(let event): self.onWSEventNodesMoved(event: event)
            case .WSEventNotification(let event): self.onWSEventNotification(event: event)
            case .WSEventScenarioProgress(let event): self.onWSEventScenarioProgress(event: event)
            }
        }.store(in: &self.cancellables)

        socketIOManager.onClientDisconnect$.sink { reason in
        }.store(in: &self.cancellables)

        socketIOManager.connect()
    }

    func leave() {
        cancellables.forEach {
            $0.cancel()
        }
        self.socketIOManager.close()
    }

    private func onClientConnect() {
        let msg = Components.Schemas.WSClientToServerMessage.WSActionJoinRoom(
            Components.Schemas.WSActionJoinRoom(
                _type: Components.Schemas.WSActionJoinRoom._TypePayload.wsActionJoinRoom,
                roomId: roomId
            )
        )
        socketIOManager.send(message: msg)
    }

    private func onWSEventScenarioLoaded(event: Components.Schemas.WSEventScenarioLoaded) {
        self.scene.addNodes(nodes: event.graph.nodes)
        self.graph = event.graph
    }

    private func onWSEventNodesMoved(event: Components.Schemas.WSEventNodesMoved) {
        
    }

    private func onWSEventNotification(event: Components.Schemas.WSEventNotification) {

    }

    private func onWSEventScenarioProgress(event: Components.Schemas.WSEventScenarioProgress) {

    }
}
