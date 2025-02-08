//
//  RoomSelectWindow.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct ControlWindow: View {
    @State private var navigation = NavigationPath()
    @Environment(SharedEnvironment.self) var sharedEnvironment: SharedEnvironment
    @Environment(\.openImmersiveSpace) var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) var dismissImmersiveSpace

    var body: some View {
        NavigationStack(path: $navigation) {
            RoomSelectView(state: sharedEnvironment.backendData, onEnter: { room in
                navigation.append(room)
            }, onRetry: {
                Task {
                    await sharedEnvironment.initialize()
                }
            }).navigationDestination(for: ViewModel.Room.self) { room in
                if case let .data(data) = sharedEnvironment.backendData {
                    ScenarioSelectView(room: room, databases: data.databases)
                        .onAppear {
                            sharedEnvironment.enterRoom(roomId: room.id)
                            Task {
                                let result = await openImmersiveSpace(id: "renderer")
                                print(result)
                            }
                        }
                        .onDisappear {
                            sharedEnvironment.leaveRoom(roomId: room.id)
                            Task {
                                await dismissImmersiveSpace()
                            }
                        }
                } else {
                    EmptyView()
                }
            }
        }
        .toolbar {
            ToolbarItemGroup {
                Toolbar()
            }
        }
        .ornament(attachmentAnchor: .scene(.bottomFront)) {
            Toolbar()
        }
        .task {
            await sharedEnvironment.initialize()
        }
    }

}

#Preview() {
    ControlWindow()
        .environment(SharedEnvironment())
}
