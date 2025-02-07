//
//  ScenarioListButton.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import SwiftUI

struct ScenarioListButton: View {
    let scenario: ViewModel.Scenario
    @Environment(\.openWindow) var openWindow

    var body: some View {
        Button(action: {
            openWindow(id: "renderer")
        }) {
            HStack {
                VStack(alignment: .leading) {
                    Text(scenario.title)
                }
                Spacer()
                Text("Run")
                Image(systemName: "play.circle")
            }
        }
    }
}

#Preview() {
    NavigationStack {
        List {
            ForEach(ViewModel.Scenario.demoData()) {
                ScenarioListButton(scenario: $0)
            }
        }
    }
}
