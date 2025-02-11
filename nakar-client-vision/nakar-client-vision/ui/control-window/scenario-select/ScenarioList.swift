//
//  ScenarioList.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI
import NakarKit

struct ScenarioList: View {
    let scenarioGroup: ViewModel.ScenarioGroup

    var body: some View {
        ForEach(scenarioGroup.scenarios) { scenario in
            ScenarioListEntry(scenario: scenario)
        }
    }
}

#Preview {
    ScenarioList(scenarioGroup: ViewModel.ScenarioGroup.demoData()[0])
}
