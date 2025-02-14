//
//  SocketStatus.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 10.02.25.
//

import SocketIO

public enum SocketStatus: CustomStringConvertible {
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

    public var description: String {
        switch self {
        case .connected: "Connected"
        case .connecting: "Connecting..."
        }
    }
}
