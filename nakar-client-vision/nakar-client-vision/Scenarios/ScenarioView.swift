//
//  ScenarioView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 10.12.24.
//

import SwiftUI

struct ScenarioView: View {
    let scenario: Components.Schemas.ScenarioDto
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace

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
                Section {
                    Button("Start Exploring") {
                        Task {
                            let result = await openImmersiveSpace(id: "graphView")
                            switch result {
                            case .error:
                                print("Some error opening the immersive space")
                            default:
                                ()
                            }
                        }
                    }
                }
            }

        }
        .navigationTitle(scenario.title)
    }
}

#Preview() {
    ScenarioView(scenario: Components.Schemas.ScenarioDto(slug: "test_scenario_1", title: "Test Scenario 1"))
        .padding()
        .glassBackgroundEffect()
}
