//
//  ScenarioListEntryView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 25.03.25.
//

import SwiftUI

struct ScenarioListEntryView: View {
    let scenario: ViewModel.Scenario

    var body: some View {
        HStack {
            ScenarioCoverView(scenario: scenario, size: 40)
                .glassBackgroundEffect()
            VStack(alignment: .leading) {
                Text(scenario.title)
                    .lineLimit(1)
                Text(scenario.description ?? "-")
                    .lineLimit(1)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

#Preview(windowStyle: .automatic) {
    let demoFactory = DemoFactoryService()
    ScenarioListEntryView(scenario: demoFactory.scenario())
}
