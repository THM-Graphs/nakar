//
//  ScenarioCoverView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

public struct ScenarioCoverView: View {
    private let scenario: ViewModel.Scenario
    private let size: CGFloat?

    public init(scenario: ViewModel.Scenario, size: CGFloat?) {
        self.scenario = scenario
        self.size = size
    }

    var padding: CGFloat {
        if let size {
            size * 0.25
        } else {
            0
        }
    }

    public var body: some View {
#if os(visionOS)
        AsyncImage(url: scenario.coverUrl, content: { image in
            image
                .resizable()
        }, placeholder: {
            ZStack {
                Image(systemName: "gearshape")
                    .resizable()
                    .padding(padding)
            }
        })
        .frame(width: size, height: size)
        .background(.regularMaterial)
        .clipShape(.circle)
#endif
#if os(macOS)
        AsyncImage(url: scenario.coverUrl, content: { image in
            image
                .resizable()
                .clipShape(.circle)
        }, placeholder: {
            ZStack {
                Image(systemName: "gearshape")
                    .resizable()
            }
        })
        .frame(width: size, height: size)
#endif
    }
}

#Preview {
    ScenarioCoverView(scenario: ViewModel.Scenario.demoData()[0], size: 50)
        .frame(width: 100, height: 100)
}
