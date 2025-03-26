//
//  RoomView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 23.03.25.
//

import SwiftUI

struct RoomView: View {
    let databases: [ViewModel.Database]
    let room: ViewModel.Room
    @Binding var selectedScenario: ViewModel.Scenario?
    let onRunScenario: (ViewModel.Scenario) -> Void
    let scenarioProgress: ScenarioProgress?

    var body: some View {
        NavigationSplitView(sidebar: {
            List(selection: $selectedScenario) {
                ForEach(databases) { (database: ViewModel.Database) in
                    DatabaseListEntryView(database: database)
                }
            }
            .navigationTitle(room.title)
        }, detail: {
            if let scenario = selectedScenario {
                ScenarioDetailView(
                    scenario: scenario,
                    onRunScenario: onRunScenario,
                    scenarioProgress: scenarioProgress
                )
            } else {
                Text("Select a scenario.")
            }
        })
    }
}

#Preview(windowStyle: .automatic) {
    @Previewable @State var selectedScenario: ViewModel.Scenario? = nil
    let demoFactory = DemoFactoryService()

    RoomView(
        databases: demoFactory.databases(),
        room: demoFactory.room(),
        selectedScenario: $selectedScenario,
        onRunScenario: {_ in},
        scenarioProgress: ScenarioProgress(progress: 0.5, description: "Loading...")
    )
}
