//
//  ControlWindowView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI
import RealityKit
import SocketIO

struct ScenarioSelectView: View {
    let room: ViewModel.Room
    let databases: [ViewModel.Database]

    @Environment(NakarController.self) var environment: NakarController
    @Environment(\.colorScheme) var colorScheme

    @State var selectedDatabase: ViewModel.Database? = nil

    var body: some View {
        NavigationSplitView(sidebar: {
            DatabaseSidebar(databases: databases, selectedDatabase: $selectedDatabase)
                .onAppear {
                    selectedDatabase = databases.first
                }
        }, detail: {
            if let database = selectedDatabase {
                DatabaseDetail(database: database)
            } else {
                EmptyView()
            }
        })
        .navigationTitle("\(room.title)")
    }
}

#Preview() {
    ScenarioSelectView(
        room: ViewModel.Room.demoData()[0],
        databases: ViewModel.Database.demoData()
    ).environment(NakarController())
}
