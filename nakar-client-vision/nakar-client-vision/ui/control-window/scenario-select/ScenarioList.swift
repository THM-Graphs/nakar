//
//  ScenarioList.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct ScenarioList: View {
    let scenarioGroups: [ViewModel.ScenarioGroup]

    var body: some View {
        ForEach(scenarioGroups) { scenarioGroup in
            Section(scenarioGroup.title) {
                ForEach(scenarioGroup.scenarios) { scenario in
                    ScenarioListEntry(scenario: scenario)
                }
            }
        }
    }
}
