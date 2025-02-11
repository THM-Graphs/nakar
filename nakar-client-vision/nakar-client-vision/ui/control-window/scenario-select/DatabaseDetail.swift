//
//  DatabaseDetail.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI
import NakarKit

struct DatabaseDetail: View {
    let room: ViewModel.Room
    let database: ViewModel.Database
    @State var selectedScenario: ViewModel.Scenario?

    var body: some View {
#if os(macOS)
        NavigationSplitView {
            List(selection: $selectedScenario) {
                DatabaseMetaDataSection(database: database)
                ForEach(database.scenarioGroups) { scenarioGroup in
                    ScenarioGroupListEntry(scenarioGroup: scenarioGroup)
                }
            }
            .navigationTitle(database.title)
            .listStyle(.inset)
            .onChange(of: database) {
                selectedScenario = database.scenarioGroups.first?.scenarios.first
            }
            .navigationSplitViewColumnWidth(min: 200, ideal: 300)
        } detail: {
            if let scenario = selectedScenario {
                ScrollView {
                    HStack {
                        ScenarioDetail(room: room, scenario: scenario)
                        Spacer()
                    }
                    .padding(10)
                }
            } else {
                Text("Select Scenario")
            }
        }
#endif
#if os(visionOS)
        List {
            DatabaseMetaDataSection(database: database)
            ScenarioList(scenarioGroups: database.scenarioGroups)
        }.navigationTitle(database.title)
#endif
    }
}

#Preview {
    NavigationSplitView {
        EmptyView()
    } detail: {
        DatabaseDetail(room: ViewModel.Room.demoData()[0], database: ViewModel.Database.demoData()[0])
    }
}
