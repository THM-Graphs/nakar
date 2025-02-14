//
//  SocketIOManager.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import SocketIO
import Foundation
import Combine

@Observable class WSBackend {
    private let manager: SocketManager
    private let socket: SocketIOClient
    private weak var delegate: WSBackendDelegate?

    var socketStatus: SocketStatus

    init() {
        self.manager = SocketManager(socketURL: Self.url, config: [.compress, .path("/frontend")])
        self.socket = manager.defaultSocket

        self.delegate = nil
        self.socketStatus = SocketStatus.from(native: self.socket.status)

        socket.on(clientEvent: .statusChange) { data, ack in
            self.socketStatus = SocketStatus.from(native: self.socket.status)
        }

        socket.on(clientEvent: .connect) { [weak self] data, ack in
            self?.delegate?.onClientConnect()
        }

        socket.on("message") { [weak self] messages, ack in
            guard let self else { return }
            do {
                guard let message = messages.first else {
                    print("No messages")
                    return
                }
                let data = try JSONSerialization.data(withJSONObject: message)
                let typedMessage = try JSONDecoder().decode(Components.Schemas.WSServerToClientMessage.self, from: data)

                switch typedMessage {
                case .WSEventScenarioLoaded(let event): self.delegate?.onWSEventScenarioLoaded(event: event)
                case .WSEventNodesMoved(let event): self.delegate?.onWSEventNodesMoved(event: event)
                case .WSEventNotification(let event): self.delegate?.onWSEventNotification(event: event)
                case .WSEventScenarioProgress(let event): self.delegate?.onWSEventScenarioProgress(event: event)
                }
            } catch let error {
                print(error)
            }
        }

        socket.on(clientEvent: .disconnect) { [weak self] data, ack in
            guard let self else { return }
            self.delegate?.onClientDisconnect(reason: String(describing: data))
        }
    }

    static var url: URL {
        switch NakarController.Mode.current {
        case .development: return URL(string: "http://localhost:1337")!
        case .production: return URL(string: "http://nakar.mni.thm.de:1337")!
        }
    }

    func connect(delegate: WSBackendDelegate) {
        self.delegate = delegate
        socket.connect()
    }

    func send(message: Components.Schemas.WSClientToServerMessage) {
        let jsonData = try! JSONEncoder().encode(message)
        let string = String(data: jsonData, encoding: .utf8)!
        socket.emit("message", string)
    }

    func close() {
        manager.disconnect();
    }
}

