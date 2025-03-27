//
//  ScenarioDetailView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 25.03.25.
//

import SwiftUI

struct ScenarioDetailView: View {
    let scenario: ViewModel.Scenario
    let onRunScenario: (ViewModel.Scenario) -> Void
    let scenarioProgress: ScenarioProgress?

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                HStack(spacing: 20) {
                    ScenarioCoverView(scenario: scenario, size: 100)
                    VStack(alignment: .leading) {
                        Text(scenario.title)
                            .font(.largeTitle)
                            .lineLimit(1)
                        Text(scenario.id)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                    Spacer()
                }
                LazyVGrid(columns: [
                    GridItem(.flexible(minimum: 0, maximum: .infinity), alignment: .top),
                    GridItem(.flexible(minimum: 0, maximum: .infinity), alignment: .top)
                ], spacing: 20) {
                    ScenarioDescriptionCardView(scenario: scenario)
                    ScenarioQueryCardView(scenario: scenario)
                }
                .frame(maxWidth: .infinity)
                if let scenarioProgress {
                    ScenarioProgressView(scenarioProgress: scenarioProgress)
                } else {
                    Button {
                        onRunScenario(scenario)
                    } label: {
                        Label("Run", systemImage: "play")
                    }
                }
            }
        }
        .safeAreaPadding(.leading, 20)
        .safeAreaPadding(.trailing, 10)
        .safeAreaPadding(.bottom, 100)
        .toolbar {
            Button {

            } label: {
                Label {
                    Text("Share")
                } icon: {
                    Image(systemName: "square.and.arrow.up")
                }

            }
            Button {
                onRunScenario(scenario)
            } label: {
                Label {
                    Text("Run")
                } icon: {
                    Image(systemName: "play")
                }

            }.disabled(scenarioProgress != nil)
        }
        .navigationTitle(scenario.title)
    }
}

#Preview(windowStyle: .automatic) {
    let demoFactory = DemoFactoryService()
    ScenarioDetailView(
        scenario: demoFactory.scenario(),
        onRunScenario: {_ in},
        scenarioProgress: ScenarioProgress(
            progress: 0.5,
            description: "Loading..."
        )
    )
}
#Preview(windowStyle: .automatic) {
    ScenarioDetailView(
        scenario: ViewModel.Scenario(id: "id", title: "Title"),
        onRunScenario: {_ in},
        scenarioProgress: nil
    )
}
#Preview(windowStyle: .automatic) {
    let demoFactory = DemoFactoryService()

    ScenarioDetailView(
        scenario: ViewModel.Scenario(
            id: "id",
            title: "Title",
            description: demoFactory.longDescription(),
            query: demoFactory.longCypherQuery()
        ),
        onRunScenario: {_ in},
        scenarioProgress: nil
    )
}
