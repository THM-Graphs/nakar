//
//  RoomSelectWindow.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct ControlWindow: View {
    @State private var navigation = NavigationPath()
    @Environment(NakarController.self) var sharedEnvironment: NakarController

    #if os(visionOS)
    @Environment(\.openImmersiveSpace) var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) var dismissImmersiveSpace
    #endif

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

                            #if os(visionOS)
                            Task {
                                let result = await openImmersiveSpace(id: "renderer")
                                print(result)
                            }
                            #endif
                        }
                        .onDisappear {
                            sharedEnvironment.leaveRoom(roomId: room.id)

                            #if os(visionOS)
                            Task {
                                await dismissImmersiveSpace()
                            }
                            #endif
                        }
                } else {
                    EmptyView()
                }
            }
        }
        #if os(macOS)
        .toolbar {
            ToolbarItemGroup {
                Toolbar()
            }
        }
        #endif
        #if os(visionOS)
        .ornament(attachmentAnchor: .scene(.bottomFront)) {
            Toolbar()
        }
        #endif
        .task {
            await sharedEnvironment.initialize()
        }
    }

}

#Preview() {
    ControlWindow()
        .environment(NakarController())
}
