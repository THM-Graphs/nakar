//
//  ScenarioDetail.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 10.02.25.
//

import SwiftUI
import NakarKit

struct ScenarioDetail: View {
    let room: ViewModel.Room
    let scenario: ViewModel.Scenario

    @Environment(NakarController.self) var nakarController

    var body: some View {
        ScrollView {
            HStack {
                VStack(alignment: .leading, spacing: 20) {
                    HStack {
                        ScenarioCoverView(scenario: scenario, size: 50)
                        VStack(alignment: .leading) {
                            Text(scenario.id)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                            Text(scenario.title)
                                .font(.headline)
                        }
                    }
                    Button {
                        nakarController.run(scenario, in: room)
                    } label: {
                        Label("Run", systemImage: "play")
                    }
                    if let description = scenario.description {
                        Text(description)
                    } else {
                        Text("No description available.")
                            .foregroundStyle(.secondary)
                            .italic()
                    }
                    if let query = scenario.query {
                        Text(query)
                            .monospaced()
                        Button {
                            nakarController.copyQueryClipboard(scenario: scenario)
                        } label: {
                            Label("Copy", systemImage: "clipboard")
                        }
                    } else {
                        Text("No query available.")
                            .foregroundStyle(.secondary)
                            .italic()
                    }
                }
                Spacer()
            }.padding(10)
        }
    }
}

#Preview {
    ScenarioDetail(room: ViewModel.Room.demoData()[0], scenario: ViewModel.Scenario.demoData()[0])
}
