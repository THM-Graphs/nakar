//
//  ContentView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import SwiftUI
import RealityKit

struct ControlWindow: View {
    @EnvironmentObject var environment: Environment
    @State var state: Loadable<ViewModel.ControlWindowState> = .nothing
    @State var selectedDatabase: ViewModel.Database? = nil
    @State var selectedRoom: ViewModel.Room? = nil
    @State private var selectedRoomStack: [ViewModel.Room] = []

    var body: some View {
        NavigationSplitView(sidebar: {
            NavigationStack(path: $selectedRoomStack) {
                List(selection: $selectedRoom) {
                    HStack {
                        Spacer()
                        AppLogoView()
                        Spacer()
                    }.padding(.bottom, 10)
                    switch state {
                    case .nothing:
                        EmptyView()
                    case .loading:
                        ProgressView()
                    case .data(let data):
                        ForEach(data.rooms) {room in
                            NavigationLink(value: room) {
                                Text(room.title)
                            }

                        }
                    case .error(let error):
                        Text("Error: \(error)")
                    }
                }
                .navigationTitle("NAKAR")
                .onChange(of: selectedRoom) {
                    if let selectedRoom {
                        selectedRoomStack.append(selectedRoom)
                    } else {
                        selectedRoomStack = []
                    }
                }
                .navigationDestination(for: ViewModel.Room.self) { room in
                    switch state {
                    case .data(let data):
                        List (data.databases, selection: $selectedDatabase) { database in
                            NavigationLink(value: database) {
                                Text(database.title)
                            }
                        }.listStyle(.sidebar).navigationTitle(room.title)
                    default:
                        EmptyView().navigationTitle("NAKAR")
                    }
                }
            }.onChange(of: selectedRoomStack) {
                if selectedRoomStack.isEmpty {
                    selectedDatabase = nil
                }
            }
        }, detail: {
            if let selectedDatabase {
                List(selectedDatabase.scenarioGroups) { scenarioGroup in
                    Section(scenarioGroup.title) {
                        ForEach(scenarioGroup.scenarios) { scenario in
                            ScenarioListButton(scenario: scenario)
                        }
                    }
                }.navigationTitle(selectedDatabase.title)
            } else {
                Text("Select a room and a database.")
                    .foregroundStyle(.secondary)
                    .navigationTitle("NAKAR")
            }
        })
        .task {
            await load()
        }
    }

    func load() async {
        do {
            state = .loading
            state = .data(
                data: try await environment.viewModelFactory.loadControlWindowState()
            )
        } catch let error {
            state = .error(error: error)
        }
    }
}

#Preview() {
    ControlWindow().environmentObject(Environment())
}
