//
//  SocketStatusIconView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI
import SocketIO

struct SocketStatusIconView: View {
    let socketStatus: SocketIOStatus

    var body: some View {
        HStack {
            switch socketStatus {
            case .connected: Image(systemName: "wifi").foregroundStyle(.green)
            case .connecting: Image(systemName: "wifi.exclamationmark").foregroundStyle(.red)
            case .disconnected: Image(systemName: "wifi.exclamationmark").foregroundStyle(.red)
            case .notConnected: Image(systemName: "wifi.exclamationmark").foregroundStyle(.gray)
            }

            Group {
                switch socketStatus {
                case .connected: EmptyView()
                case .connecting: Text("Connecting...").padding(.trailing, 10)
                case .disconnected: Text("Disconnected").padding(.trailing, 10)
                case .notConnected: EmptyView()
                }
            }
            .foregroundStyle(.secondary)
            .font(.footnote)
        }
        .padding([.leading, .trailing], 12)
        .frame(height: 44)
        #if os(visionOS)
        .glassBackgroundEffect()
        #endif
    }
}

#Preview {
    VStack {
        SocketStatusIconView(socketStatus: SocketIOStatus.connected)
        SocketStatusIconView(socketStatus: SocketIOStatus.connecting)
        SocketStatusIconView(socketStatus: SocketIOStatus.disconnected)
        SocketStatusIconView(socketStatus: SocketIOStatus.notConnected)
    }.padding(20)
}
