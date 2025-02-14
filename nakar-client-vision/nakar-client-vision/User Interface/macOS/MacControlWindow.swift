//
//  MacControlWindow.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 10.02.25.
//

#if os(macOS)

import SwiftUI
import RealityKit
import CoreGraphics

struct MacControlWindow: View {
    @Environment(NakarController.self) var nakarController: NakarController

    @State var selectedRoom: ViewModel.Room? = nil
    @State var showInspector: Bool = false

    @State var databaseForInspector: ViewModel.Database? = nil
    @State var scenarioGroupForInspector: ViewModel.ScenarioGroup? = nil
    @State var scenarioForInspector: ViewModel.Scenario? = nil

    var body: some View {
        switch nakarController.backendData {
        case .loading:
            ProgressView()
        case .data(let backendData):
            NavigationSplitView {
                List {
                    Picker("", selection: $selectedRoom) {
                        Text(selectedRoom == nil ? "Select room" : "No Room")
                            .foregroundStyle(.secondary)
                            .italic()
                            .tag(ViewModel.Room?.none)
                        ForEach(backendData.rooms) { room in
                            Text(room.title)
                                .tag(room)
                        }
                    }.onChange(of: selectedRoom) {
                        nakarController.leaveRooms()
                        if let selectedRoom {
                            nakarController.enterRoom(roomId: selectedRoom.id)
                        }
                    }
                    if let room = selectedRoom {
                        ForEach(backendData.databases) { database in
                            DatabaseListEntry(room: room, database: database, showScenarioInfo: { scenarioGroup, scenario in
                                databaseForInspector = database
                                scenarioGroupForInspector = scenarioGroup
                                scenarioForInspector = scenario
                                showInspector = true
                            })
                        }
                    }
                }
            } detail: {
                if let room = selectedRoom {
                    VStack {
                        if let roomManager = nakarController.roomManagers[room.id] {
                            RendererView(roomManager: roomManager)
                        } else {
                            Text("Connecting to room...")
                        }
                    }
                    .navigationTitle(room.title)
                } else {
                    Text("Join a room")
                        .navigationTitle("NAKAR")
                }
            }
            .inspector(isPresented: $showInspector) {
                if let scenario = scenarioForInspector,
                   let scenarioGroup = scenarioGroupForInspector,
                   let database = databaseForInspector {
                    List {
                        Text(scenario.title)
                            .font(.headline)
                        Section("ID") {
                            HStack {
                                Text(scenario.id)
                                    .foregroundStyle(.secondary)
                                    .monospaced()
                                Spacer()
                                Button {
                                    #warning("")
                                } label: {
                                    Image(systemName: "document.on.document")
                                }.buttonStyle(.borderless)
                            }
                        }
                        Section("Description") {
                            if let description = scenario.description {
                                Text(description)
                            } else {
                                Text("No description")
                                    .foregroundStyle(.secondary)
                                    .italic()
                            }
                        }
                        Section("Query") {
                            if let query = scenario.query {
                                HStack(alignment: .top) {
                                    Text(query)
                                        .monospaced()
                                    Spacer()
                                    Button {
                                        nakarController.copyQueryClipboard(scenario: scenario)
                                    } label: {
                                        Image(systemName: "document.on.document")
                                    }.buttonStyle(.borderless)
                                }
                            } else {
                                Text("No query")
                                    .foregroundStyle(.secondary)
                                    .italic()
                            }
                        }
                        Section("Scenario Group") {
                            Text(scenarioGroup.title)
                        }
                        Section("Database") {
                            VStack(alignment: .leading) {
                                Text(database.title)
                                if let browserUrl = database.browserUrl {
                                    HStack(alignment: .top) {
                                        if let url = URL(string: browserUrl) {
                                            Link(destination: url) {
                                                Text(browserUrl)
                                                    .multilineTextAlignment(.leading)
                                                    .underline()
                                            }.pointerStyle(.link)
                                        } else {
                                            Text(browserUrl)
                                        }
                                        Spacer()
                                        Button {
#warning("")
                                        } label: {
                                            Image(systemName: "document.on.document")
                                        }.buttonStyle(.borderless)
                                    }
                                } else {
                                    Text("No Browser URL")
                                        .foregroundStyle(.secondary)
                                        .italic()
                                }
                                if let url = database.url {
                                    HStack(alignment: .top) {
                                        Text(url)
                                        Spacer()
                                        Button {
#warning("")
                                        } label: {
                                            Image(systemName: "document.on.document")
                                        }.buttonStyle(.borderless)
                                    }
                                } else {
                                    Text("No Connection URL")
                                        .foregroundStyle(.secondary)
                                        .italic()
                                }
                            }
                        }
                        .padding(.bottom, 10)
                    }
                    .navigationTitle(scenario.title)
                    .toolbar {
                        if showInspector == true {
                            Text("Scenario").font(.headline)
                            Spacer()
                            Button() {
                                showInspector = false
                            } label: {
                                Image(systemName: "xmark")
                            }
                        }
                    }
                }
            }
            .toolbar {
                ToolbarItem {
                    Text(nakarController.environmentDebugString)
                }
                ToolbarItem {
                    ForEach(Array(nakarController.roomManagers.values), id: \.roomId) { roomManager in
                        Label {
                            Text(roomManager.roomId)
                        } icon: {
                            SocketStatusIconView(socketStatus: roomManager.socketStatus)
                        }
                    }
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

    struct DatabaseListEntry: View {
        let room: ViewModel.Room
        let database: ViewModel.Database
        let showScenarioInfo: (ViewModel.ScenarioGroup, ViewModel.Scenario) -> Void

        @State var collapsed = true

        var body: some View {
            HStack {
                CollapseButton(collapsed: $collapsed) {
                    Text(database.title)
                }
            }
            if !collapsed {
                ForEach(database.scenarioGroups) { scenarioGroup in
                    ScenarioGroupListEntry(room: room, scenarioGroup: scenarioGroup, showScenarioInfo: { scenario in
                        showScenarioInfo(scenarioGroup, scenario)
                    })
                }
            }
        }
    }

    struct ScenarioGroupListEntry: View {
        let room: ViewModel.Room
        let scenarioGroup: ViewModel.ScenarioGroup
        let showScenarioInfo: (ViewModel.Scenario) -> Void

        @State var collapsed = true

        var body: some View {
            HStack {
                CollapseButton(collapsed: $collapsed) {
                    Text(scenarioGroup.title)
                }
            }
            .padding(.leading, 20)
            if !collapsed {
                ForEach(scenarioGroup.scenarios) { scenario in
                    ScenarioListEntry(room: room, scenario: scenario, showScenarioInfo: showScenarioInfo)
                }
            }
        }
    }

    struct ScenarioListEntry: View {
        let room: ViewModel.Room
        let scenario: ViewModel.Scenario
        let showScenarioInfo: (ViewModel.Scenario) -> Void

        @Environment(NakarController.self) var nakarController: NakarController
        @Environment(\.openWindow) var openWindow

        var body: some View {
            HStack {
                Text(scenario.title)
                Spacer()
                Button {
                    if let roomManager = nakarController.roomManagers[room.id] {
                        roomManager.run(scenario)
                    }
                } label: {
                    Label {
                        Text("Run")
                    } icon: {
                        Image(systemName: "play")
                    }
                }
                Button {
                    showScenarioInfo(scenario)
                } label: {
                    Image(systemName: "info")
                }
            }
            .padding(.leading, 40)
        }
    }

    struct CollapseButton<Content: View>: View {
        @Binding var collapsed: Bool
        @ViewBuilder let children: Content

        var body: some View {
            Button {
                collapsed.toggle()
            } label: {
                HStack {
                    Image(systemName: collapsed ? "chevron.right" : "chevron.down")
                        .frame(width: 10, height: 20)
                    children
                    Spacer()
                }
            }
            .buttonStyle(.accessoryBar)
        }
    }

    struct RendererView: View {
        let roomManager: NakarRoom

        @State var rendererViewConroller: RendererViewController?

        var body: some View {
            RealityView { content in
                self.rendererViewConroller = RendererViewController(content: content, nakarRoom: roomManager, scaleMode: .window)
            }
            .background {
                Color(cgColor: CGColor(gray: 0.2, alpha: 1 ))
            }
            .onDisappear {
                rendererViewConroller?.close()
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
    MacControlWindow()
        .environment(env)
        .frame(width: 800, height: 600)
}

#endif
