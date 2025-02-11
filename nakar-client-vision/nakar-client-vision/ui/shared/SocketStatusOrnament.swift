//
//  SocketStatusView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI
import NakarKit

#if os(visionOS)
struct SocketStatusOrnament: View {
    let roomManager: NakarRoom

    var socketStatus: SocketStatus {
        roomManager.socketStatus
    }

    var body: some View {
        HStack {
            SocketStatusIconView(socketStatus: socketStatus)

            Text(socketStatus.description).padding(.trailing, 10)
                .font(.footnote)
        }
        .padding([.leading, .trailing], 12)
        .frame(height: 44)
        .glassBackgroundEffect()
    }
}

#Preview {
    SocketStatusOrnament(roomManager: NakarRoom(roomId: "room test"))
}
#endif
