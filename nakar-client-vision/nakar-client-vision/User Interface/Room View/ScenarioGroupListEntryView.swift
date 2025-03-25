//
//  ScenarioGroupListEntryView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 25.03.25.
//

import SwiftUI

struct ScenarioGroupListEntryView: View {
    let scenarioGroup: ViewModel.ScenarioGroup

    var body: some View {
        ExpandableListEntryView {
            Text(scenarioGroup.title)
        } children: {
            ForEach(scenarioGroup.scenarios) { (scenario: ViewModel.Scenario) in
                NavigationLink(value: scenario) {
                    ScenarioListEntryView(scenario: scenario)
                }
            }
        }
    }
}

#Preview(windowStyle: .automatic) {
    List {
        ScenarioGroupListEntryView(scenarioGroup: ViewModel.ScenarioGroup.demoData()[0])
    }
}
