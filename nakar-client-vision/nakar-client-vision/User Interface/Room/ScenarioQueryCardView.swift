//
//  ScenarioQueryCardView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 25.03.25.
//

import SwiftUI

struct ScenarioQueryCardView: View {
    let scenario: ViewModel.Scenario

    var body: some View {
        Button {

        } label: {
            CardView(hover: true) {
                VStack(alignment: .leading, spacing: 20) {
                    if let query = scenario.query {
                        Text("Query")
                            .foregroundStyle(.secondary)
                        Text(query)
                            .monospaced()
                            .font(.footnote)
                        Spacer()
                        HStack {
                            Spacer()
                            Text("Copy to clipboard")
                                .foregroundStyle(.secondary)
                        }
                    } else {
                        HStack {
                            Text("No Query")
                                .foregroundStyle(.secondary)
                                .italic()
                            Spacer()
                        }
                        Spacer()
                    }
                }
                .frame(height: 250)
            }
        }
        .buttonStyle(.plain)
        .disabled(scenario.query == nil)
    }
}

#Preview(windowStyle: .automatic) {
    ScenarioQueryCardView(scenario: ViewModel.Scenario(id: "dasfest", title: "Title", query: "MATCH ()->[]->() RETURN *"))
}

#Preview(windowStyle: .automatic) {
    ScenarioQueryCardView(scenario: ViewModel.Scenario(id: "dasfest", title: "Title", query: nil))
}
