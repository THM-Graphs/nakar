//
//  SocketIOManager.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import SocketIO
import Foundation
import Combine

class SocketIOManager {
    let manager: SocketManager
    let socket: SocketIOClient

    private let onClientConnect: PassthroughSubject<Void, Never>
    let onClientConnect$: any Publisher<Void, Never>

    private let onMessage: PassthroughSubject<Components.Schemas.WSServerToClientMessage, Never>
    let onMessage$: any Publisher<Components.Schemas.WSServerToClientMessage, Never>

    private let onClientDisconnect: PassthroughSubject<String, Never>
    let onClientDisconnect$: any Publisher<String, Never>

    init(environmentHandler: EnvironmentHandler) {
        self.manager = SocketManager(socketURL: environmentHandler.getWSUrl(), config: [.compress, .path("/frontend")])
        self.socket = manager.defaultSocket

        self.onClientConnect = PassthroughSubject()
        onClientConnect$ = onClientConnect
        self.onMessage = PassthroughSubject()
        onMessage$ = onMessage
        self.onClientDisconnect = PassthroughSubject()
        onClientDisconnect$ = onClientDisconnect

        socket.on(clientEvent: .connect) { data, ack in
            self.onClientConnect.send()
        }

        socket.on("message") { messages, ack in
            do {
                guard let message = messages.first else {
                    print("No messages")
                    return
                }
                let data = try JSONSerialization.data(withJSONObject: message)
                let typedMessage = try JSONDecoder().decode(Components.Schemas.WSServerToClientMessage.self, from: data)
                self.onMessage.send(typedMessage)
            } catch let error {
                print(error)
            }
        }

        socket.on(clientEvent: .disconnect) { data, ack in
            self.onClientDisconnect.send(String(describing: data))
        }

        socket.onAny {
            print($0)
        }
    }

    func connect() {
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

