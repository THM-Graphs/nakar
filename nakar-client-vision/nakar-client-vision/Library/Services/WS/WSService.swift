//
//  WSService.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 23.03.25.
//

import SocketIO
import Foundation
import Combine

class WSService: Service, ObservableObject {
    private let manager: SocketManager
    private let loggerService: LoggerService

    private let socket: SocketIOClient
    private let url: URL

    @Published var socketStatus: SocketStatus
    var onWSEventScenarioLoaded: PassthroughSubject<Components.Schemas.WSEventScenarioLoaded, Never>
    var onWSEventNodesMoved: PassthroughSubject<Components.Schemas.WSEventNodesMoved, Never>
    var onWSEventNotification: PassthroughSubject<Components.Schemas.WSEventNotification, Never>
    var onWSEventScenarioProgress: PassthroughSubject<Components.Schemas.WSEventScenarioProgress, Never>

    init(loggerService: LoggerService, environmentService: EnvironmentService) {
        self.loggerService = loggerService

        switch environmentService.mode {
        case .development: url = URL(string: "http://localhost:1338")!
        case .production: url = URL(string: "http://nakar.mni.thm.de:1338")!
        }

        self.manager = SocketManager(socketURL: url, config: [.compress, .path("/socket.io")])
        self.socket = manager.defaultSocket

        self.socketStatus = SocketStatus.from(native: self.socket.status)
        self.onWSEventScenarioLoaded = PassthroughSubject()
        self.onWSEventNodesMoved = PassthroughSubject()
        self.onWSEventNotification = PassthroughSubject()
        self.onWSEventScenarioProgress = PassthroughSubject()

        socket.on(clientEvent: .statusChange) { [weak self] data, ack in
            guard let self else { return }
            self.socketStatus = SocketStatus.from(native: self.socket.status)
            self.loggerService.log(sender: self, message: "Socket status changed to \(self.socket.status.description)")
        }

        socket.on(clientEvent: .connect) { [weak self] data, ack in
            guard let self else { return }
            self.loggerService.log(sender: self, message: "Socket did connect")
        }

        socket.on("message") { [weak self] messages, ack in
            guard let self else { return }
            do {
                guard let message = messages.first else {
                    self.loggerService.error(sender: self, message: "No messages in messages array")
                    return
                }
                let data = try JSONSerialization.data(withJSONObject: message)
                let typedMessage = try JSONDecoder().decode(Components.Schemas.WSServerToClientMessage.self, from: data)

                switch typedMessage {
                case .WSEventScenarioLoaded(let event):
                    self.loggerService.debug(sender: self, message: "Did receive WSEventScenarioLoaded: \(event.graph.metaData.scenarioInfo.title ?? "No scenario title")")
                    onWSEventScenarioLoaded.send(event)
                case .WSEventNodesMoved(let event):
                    onWSEventNodesMoved.send(event)
                case .WSEventNotification(let event):
                    self.loggerService.debug(sender: self, message: "Did receive WSEventNotification: \(event)")
                    onWSEventNotification.send(event)
                case .WSEventScenarioProgress(let event):
                    self.loggerService.debug(sender: self, message: "Did receive WSEventScenarioProgress: \(event.message ?? "No message") \(event.progress?.formatted() ?? "null")")
                    onWSEventScenarioProgress.send(event)
                }
            } catch let error {
                self.loggerService.error(sender: self, message: error.localizedDescription)
            }
        }

        socket.on(clientEvent: .disconnect) { [weak self] data, ack in
            guard let self else { return }
            self.loggerService.log(sender: self, message: "Socket did disconnect. Reason: \(String(describing: data))")
        }
    }


    func bootstrap() {
        self.loggerService.log(sender: self, message: "Will connect ws to \(url.absoluteString)")
        socket.connect()
    }

    func destory() {
        manager.disconnect();
    }

    private func send(message: Components.Schemas.WSClientToServerMessage) {
        let jsonData = try! JSONEncoder().encode(message)
        let string = String(data: jsonData, encoding: .utf8)!
        socket.emit("message", string)
    }

    func send(message: Components.Schemas.WSActionJoinRoom) {
        self.send(message: Components.Schemas.WSClientToServerMessage.WSActionJoinRoom(message))
    }

    func send(message: Components.Schemas.WSActionLoadScenario) {
        self.send(message: Components.Schemas.WSClientToServerMessage.WSActionLoadScenario(message))
    }

    func send(message: Components.Schemas.WSActionGrabNode) {
        self.send(message: Components.Schemas.WSClientToServerMessage.WSActionGrabNode(message))
    }

    func send(message: Components.Schemas.WSActionMoveNodes) {
        self.send(message: Components.Schemas.WSClientToServerMessage.WSActionMoveNodes(message))
    }

    func send(message: Components.Schemas.WSActionUngrabNode) {
        self.send(message: Components.Schemas.WSClientToServerMessage.WSActionUngrabNode(message))
    }
}
