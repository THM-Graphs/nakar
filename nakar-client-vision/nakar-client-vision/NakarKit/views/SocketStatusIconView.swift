//
//  SocketStatusIconView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 10.02.25.
//

import SwiftUI

struct SocketStatusIconView: View {
    let socketStatus: SocketStatus

    var body: some View {
        switch socketStatus {
        case .connected: Image(systemName: "wifi").foregroundStyle(.green)
        case .connecting: Image(systemName: "wifi.exclamationmark").foregroundStyle(.red)
        }
    }
}

#Preview {
    HStack(spacing: 20) {
        SocketStatusIconView(socketStatus: .connected)
        SocketStatusIconView(socketStatus: .connecting)
    }
}
