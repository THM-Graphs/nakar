//
//  ScenarioListButton.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import SwiftUI

struct ScenarioListEntry: View {
    let scenario: ViewModel.Scenario
    @Environment(\.openWindow) var openWindow

    var body: some View {
        Button(action: {
            openWindow(id: "renderer")
        }) {
            HStack(spacing: 20) {
                ScenarioCoverView(scenario: scenario)
                VStack(alignment: .leading) {
                    Text(scenario.title)
                }
                Spacer()
                HStack {
                    Image(systemName: "play.circle")
                    Text("Run")
                }
                .padding([.leading, .trailing], 20)
                .padding([.top, .bottom], 10)
                .background(.regularMaterial)
                .clipShape(.capsule)
            }
        }
    }
}

#Preview() {
    ForEach(ViewModel.Scenario.demoData()) {
        ScenarioListEntry(scenario: $0)
    }
}
