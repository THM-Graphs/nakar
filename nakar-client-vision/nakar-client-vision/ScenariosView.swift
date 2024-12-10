//
//  ScenariosView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 10.12.24.
//

import SwiftUI

struct ScenariosView: View {
    @State var state: ViewState = .loading

    var body: some View {
        Group {
            switch state {
            case .loading:
                Text("Loading...")
            case .data(let scenarios):
                List(scenarios, id: \.slug) { scenario in
                    NavigationLink(destination: ScenarioView(scenario: scenario)) {
                        Text(scenario.title)
                    }
                }
            case .error(let error):
                Text(error.localizedDescription)
            }
        }
        .navigationTitle("Scenarios")
        .task {
            do {
                state = .data(scenarios: try await getScenarios())
            } catch (let error) {
                state = .error(error: error)
            }
        }
    }
}

enum ViewState {
    case
    loading,
    data(scenarios: [ScenarioDto]),
    error(error: Error)
}

#Preview() {
    NavigationView {
        ScenariosView()
    }
}
