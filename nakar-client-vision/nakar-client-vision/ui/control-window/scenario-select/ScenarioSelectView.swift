//
//  ControlWindowView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI
import RealityKit
import NakarKit

struct ScenarioSelectView: View {
    let room: ViewModel.Room
    let databases: [ViewModel.Database]

    @Environment(NakarController.self) var environment: NakarController
    @Environment(\.colorScheme) var colorScheme

    @State var selectedScenario: ViewModel.Scenario? = nil

    var body: some View {
        NavigationSplitView(sidebar: {
            DatabaseSidebar(databases: databases, selectedScenario: $selectedScenario)
        }, detail: {
            if let selectedScenario = selectedScenario {
                ScenarioDetail(room: room, scenario: selectedScenario)
            } else {
                EmptyView()
            }
        })
        .navigationSplitViewColumnWidth(min: 400, ideal: 400)
        .navigationTitle("\(room.title)")
    }
}

#Preview() {
    ScenarioSelectView(
        room: ViewModel.Room.demoData()[0],
        databases: ViewModel.Database.demoData()
    ).environment(NakarController())
}
