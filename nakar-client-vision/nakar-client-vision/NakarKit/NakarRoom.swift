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
    let socketIOManager: WSBackend

    let roomId: String

    var physicalGraph: PhysicalGraph

    init(roomId: String) {
        self.socketIOManager = WSBackend()
        self.roomId = roomId
        self.physicalGraph = PhysicalGraph()

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
        self.physicalGraph.fill(with: event.graph)
    }

    func onWSEventNodesMoved(event: Components.Schemas.WSEventNodesMoved) {
        
    }

    func onWSEventNotification(event: Components.Schemas.WSEventNotification) {

    }

    func onWSEventScenarioProgress(event: Components.Schemas.WSEventScenarioProgress) {

    }

    func onClientDisconnect(reason: String) {

    }
}
