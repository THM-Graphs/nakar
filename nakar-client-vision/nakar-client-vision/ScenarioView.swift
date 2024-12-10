//
//  ScenarioView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 10.12.24.
//

import SwiftUI

struct ScenarioView: View {
    let scenario: ScenarioDto

    var body: some View {
        VStack {
            List {
                Section {
                    HStack {
                        Text("Slug")
                        Spacer()
                        Text(scenario.slug)
                    }
                    HStack {
                        Text("Title")
                        Spacer()
                        Text(scenario.title)
                    }
                }
            }
            Button("Start Exploring") {

            }

        }.padding()
        .navigationTitle(scenario.title)
    }
}

#Preview() {
    NavigationView {
        EmptyView()
        ScenarioView(scenario: ScenarioDto(slug: "test_scenario_1", title: "Test Scenario 1"))
    }
}
