//
//  ScenarioListButton.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import SwiftUI
import NakarKit

struct ScenarioListEntry: View {
    let scenario: ViewModel.Scenario
    @Environment(\.openWindow) var openWindow

    var body: some View {
#if os(visionOS)
        HStack(spacing: 20) {
            ScenarioCoverView(scenario: scenario, size: 50)
            VStack(alignment: .leading) {
                Text(scenario.title)
            }
            Spacer()
            HStack {
                Image(systemName: "play.circle")
                Text("Run")
            }
            .padding([.leading, .trailing], 20)
            .padding([.top, .bottom], 10)
            .background(.regularMaterial)
            .clipShape(.capsule)
        }
#endif

#if os(macOS)
        NavigationLink(value: scenario) {
            HStack {
                Label {
                    Text(scenario.title)
                } icon: {
                    ScenarioCoverView(scenario: scenario, size: 16)
                }
                Spacer()
                Button {
                    ()
                } label: {
                    Label {
                        Text("Run")
                    } icon: {
                        Image(systemName: "play")
                    }

                }
            }.padding(.leading, 20)
        }
#endif
    }
}

#Preview() {
    List {
        ForEach(ViewModel.Scenario.demoData()) {
            ScenarioListEntry(scenario: $0)
        }
    }
}
