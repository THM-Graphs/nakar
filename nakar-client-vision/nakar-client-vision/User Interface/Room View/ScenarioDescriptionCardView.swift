//
//  ScenarioDescriptionCard.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 25.03.25.
//

import SwiftUI

struct ScenarioDescriptionCardView: View {
    let scenario: ViewModel.Scenario
    @State var expanded: Bool = false

    var body: some View {
        Button {
            expanded.toggle()
        } label: {
            Card(hover: true) {
                HStack {
                    VStack(alignment: .leading, spacing: 20) {
                        if let description = scenario.description {
                            Text("Description")
                                .foregroundStyle(.secondary)
                            Text(description)
                            Spacer()
                            HStack {
                                Spacer()
                                Text(expanded ? "Read less..." : "Read more...")
                                    .foregroundStyle(.secondary)
                            }
                        } else {
                            Text("No Description")
                                .foregroundStyle(.secondary)
                                .italic()
                            Spacer()
                        }
                    }
                    Spacer()
                }
                .frame(height: expanded ? nil : 250)
                .frame(minHeight: expanded ? 250 : nil)
            }
        }
        .buttonStyle(.plain)
        .disabled(scenario.description == nil)
    }
}

#Preview(windowStyle: .automatic) {
    ScenarioDescriptionCardView(scenario: ViewModel.Scenario.demoData()[0])
}
