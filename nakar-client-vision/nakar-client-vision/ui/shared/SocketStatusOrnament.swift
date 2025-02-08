//
//  SocketStatusView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI
import SocketIO

struct SocketStatusOrnament: View {
    let roomManager: RoomManager

    var socketStatus: SocketIOStatus {
        roomManager.socketIOManager.socketStatus
    }

    var body: some View {
        SocketStatusIconView(socketStatus: roomManager.socketIOManager.socketStatus)
    }
}

