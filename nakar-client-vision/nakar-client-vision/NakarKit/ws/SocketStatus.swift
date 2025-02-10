//
//  SocketStatus.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 10.02.25.
//

import SocketIO

enum SocketStatus: CustomStringConvertible {
    case connecting
    case connected

    static func from(native socketStatus: SocketIOStatus) -> SocketStatus {
        switch socketStatus {
        case .connected: .connected
        case .connecting: .connecting
        case .disconnected: .connecting
        case .notConnected: .connecting
        }
    }

    var description: String {
        switch self {
        case .connected: "Connected"
        case .connecting: "Connecting..."
        }
    }
}
