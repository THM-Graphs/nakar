//
//  ScenarioProgressView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 26.03.25.
//

import SwiftUI

struct ScenarioProgressView: View {
    let scenarioProgress: ScenarioProgress

    var body: some View {
        CardView {
            VStack(alignment: .leading, spacing: 20) {
                Text(scenarioProgress.description)
                ProgressView(value: scenarioProgress.progress)
            }
        }
    }
}

#Preview(windowStyle: .plain) {
    ScenarioProgressView(scenarioProgress: ScenarioProgress(progress: 0.5, description: "Loading scenario..."))
}
