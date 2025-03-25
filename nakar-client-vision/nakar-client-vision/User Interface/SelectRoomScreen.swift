//
//  VisionProMainWindow.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 23.03.25.
//

import SwiftUI

struct SelectRoomScreen: View {
    @Environment(NakarApplication.self) var nakarApplication: NakarApplication

    @State private var showRoomView: Bool = false

    var body: some View {
        NavigationStack {
            VStack {
                switch nakarApplication.viewService.httpData {
                case .data(let data): SelectRoomView(rooms: data.rooms, onRoomSelected: { room in
                    nakarApplication.viewService.enterRoom(room: room)
                    showRoomView = true
                })
                case .error(let error): Text("Error: \(error)")
                case .loading: ProgressView()
                case .nothing: EmptyView()
                }
            }.navigationDestination(isPresented: $showRoomView) {
                RoomScreen()
            }
        }.ornament(attachmentAnchor: .scene(.bottom)) {
            HStack {
                VersionOrnament(version: nakarApplication.environmentService.environmentDebugString)
                if let roomTitle = nakarApplication.viewService.currentRoom?.title {
                    HStack {
                        SocketStatusIconView(socketStatus: nakarApplication.wsService.socketStatus)
                        Text(roomTitle)
                    }
                    .frame(height: 40)
                    .padding(.leading, 20)
                    .padding(.trailing, 20)
                    .glassBackgroundEffect()
                } else {
                    SocketStatusIconView(socketStatus: nakarApplication.wsService.socketStatus)
                        .frame(width: 40, height: 40)
                        .glassBackgroundEffect()
                }
            }
        }
    }
}
