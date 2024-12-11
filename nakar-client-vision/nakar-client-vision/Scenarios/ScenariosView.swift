//
//  ScenariosView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 10.12.24.
//

import SwiftUI

struct ScenariosView: View {
    @State var state: ViewState = .loading
    @EnvironmentObject var client: HTTPClient

    var body: some View {
        NavigationView {
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
            Text("Select a scenario")
        }
        .task { () -> Void in
            do {
                state = .data(scenarios: try await client.getScenarios())
            } catch (let error) {
                state = .error(error: error)
            }
        }
    }
}

enum ViewState {
    case
    loading,
    data(scenarios: [Components.Schemas.ScenarioDto]),
    error(error: Error)
}

#Preview() {
    ScenariosView()
        .environmentObject(HTTPClient())
}
