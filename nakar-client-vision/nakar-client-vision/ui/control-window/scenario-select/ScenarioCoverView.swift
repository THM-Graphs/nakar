//
//  ScenarioCoverView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct ScenarioCoverView: View {
    let scenario: ViewModel.Scenario

    var url: URL? {
        guard let urlString = scenario.coverUrl else {
            return nil
        }
        guard let url = URL(string: urlString) else {
            return nil
        }
        return url
    }

    var body: some View {
        CoverView(url: url)
    }
}

#Preview {
    ScenarioCoverView(scenario: ViewModel.Scenario.demoData()[0])
}
