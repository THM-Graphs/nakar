//
//  ScenarioCoverView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct ScenarioCoverView: View {
    let scenario: ViewModel.Scenario
    let size: CGFloat

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
        AsyncImage(url: url, content: { image in
            image
                .resizable()
        }, placeholder: {
            ZStack {
                Image(systemName: "gearshape")
                    .resizable()
                    .padding(15)
            }
        })
        .frame(width: size, height: size)
        .background(.regularMaterial)
        .clipShape(.circle)
    }
}

#Preview {
    ScenarioCoverView(scenario: ViewModel.Scenario.demoData()[0], size: 20)
}
