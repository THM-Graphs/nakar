//
//  MacControlWindow.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 10.02.25.
//

#if os(visionOS)

import SwiftUI
import RealityKit

struct VisionProControlWindow: View {
    @Environment(\.openImmersiveSpace) var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) var dismissImmersiveSpace
    @Environment(NakarController.self) var nakarController: NakarController

    @State var selectedRoom: ViewModel.Room? = nil
    @State var selectedDatabase: ViewModel.Database? = nil

    var body: some View {
        switch nakarController.backendData {
        case .loading:
            ProgressView()
        case .data(let backendData):
            NavigationSplitView {
                List(backendData.rooms, selection: $selectedRoom) { room in
                    NavigationLink(value: room) {
                        HStack {
                            Text(room.title)
                            Spacer()
                            if let roomManager = nakarController.roomManagers[room.id] {
                                SocketStatusIconView(socketStatus: roomManager.socketStatus)
                            }
                        }
                    }
                }.disabled(selectedRoom != nil)
                .navigationTitle("Rooms")
                .onChange(of: selectedRoom) {
                    if let selectedRoom {
                        Task {
                            let result = await openImmersiveSpace(id: "renderer", value: selectedRoom.id)
                            print(result)
                        }
                    } else {
                        Task {
                            await dismissImmersiveSpace()
                        }
                    }
                }
                if let selectedRoom {
                    Button {
                        self.selectedRoom = nil
                    } label: {
                        Text("Leave Room")
                    }.padding(.bottom, 20)
                }
            } content: {
                if selectedRoom != nil {
                    List(backendData.databases, selection: $selectedDatabase) { database in
                        NavigationLink(value: database) {
                            Text(database.title)
                        }
                    }
                    .navigationTitle("Databases")
                } else {
                    Text("Select a Room")
                }
            } detail: {
                if let selectedRoom = selectedRoom, let roomManager = nakarController.roomManagers[selectedRoom.id]  {
                    if let selectedDatabase {
                        List {
                            ForEach(selectedDatabase.scenarioGroups) { scenarioGroup in
                                Section(scenarioGroup.title) {
                                    ForEach(scenarioGroup.scenarios) { scenario in
                                        Button {
                                            roomManager.run(scenario)
                                        } label: {
                                            HStack {
                                                AsyncImage(url: scenario.coverUrl) { (image: Image) in
                                                    image.resizable()
                                                } placeholder: {
                                                    Color.clear
                                                }
                                                .clipShape(.circle)
                                                .frame(width: 40, height: 40)
                                                .glassBackgroundEffect()
                                                Text(scenario.title)
                                                Spacer()
                                                Image(systemName: "play")
                                            }
                                        }
                                    }
                                }
                            }
                        }.navigationTitle(selectedDatabase.title)
                    } else {
                        Text("Select a Database")
                    }
                } else {
                    EmptyView()
                }
            }
            .onAppear {
                selectedRoom = backendData.rooms.first

            }
        case .nothing:
            VStack {
                EmptyView()
            }
        case .error(let error):
            ErrorView(error: error)
        }
    }

    struct ErrorView: View {
        let error: Error

        @Environment(NakarController.self) var nakarController: NakarController

        var body: some View {
            VStack {
                Text(error.localizedDescription)
                Button {
                    nakarController.initialize()
                } label: {
                    Text("Retry")
                }

            }
        }
    }


}

#Preview() {
    let env: NakarController = ({
        let controller = NakarController()
        Task {
            await controller.initialize()
        }
        return controller
    })()
    VisionProControlWindow()
        .environment(env)
}

#endif
