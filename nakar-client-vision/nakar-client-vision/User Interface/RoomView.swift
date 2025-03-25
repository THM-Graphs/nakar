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
                ScenarioDetailView(scenario: scenario)
            } else {
                Text("Select a scenario.")
            }
        })
    }
}

#Preview(windowStyle: .automatic) {
    @Previewable @State var selectedScenario: ViewModel.Scenario? = nil
    RoomView(databases: ViewModel.Database.demoData(), room: ViewModel.Room.demoData()[0], selectedScenario: $selectedScenario)
}
