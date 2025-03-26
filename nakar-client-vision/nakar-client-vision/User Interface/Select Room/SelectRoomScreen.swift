//
//  VisionProMainWindow.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 23.03.25.
//

import SwiftUI

struct SelectRoomScreen: View {
    @Environment(NakarApplication.self) var nakarApplication: NakarApplication
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace

    @State private var roomStack: [ViewModel.Room] = []

    var body: some View {
        NavigationStack(path: $roomStack) {
            VStack {
                switch nakarApplication.viewService.httpData {
                case .data(let data): SelectRoomView(rooms: data.rooms, onRoomSelected: { room in
                    roomStack = [room]
                })
                case .error(let error): Text("Error: \(error)")
                case .loading: ProgressView()
                case .nothing: EmptyView()
                }
            }.navigationDestination(for: ViewModel.Room.self) { room in
                RoomScreen()
                    .task {
                        let result = await openImmersiveSpace(id: "renderer", value: room)
                        nakarApplication.loggerService.debug(sender: self, message: "Did open immersive space: \(result)")
                    }
                    .onDisappear {
                        Task {
                            await dismissImmersiveSpace()
                        }
                    }
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
