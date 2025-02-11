//
//  ScenarioGroupListEntry.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 10.02.25.
//

import SwiftUI
import NakarKit

struct ScenarioGroupListEntry: View {
    let scenarioGroup: ViewModel.ScenarioGroup

    @State var collapsed = true

    var body: some View {
        HStack {
            Button {
                collapsed.toggle()
            } label: {
                if collapsed {
                    Image(systemName: "chevron.right")
                } else {
                    Image(systemName: "chevron.down")
                }
            }.buttonStyle(.accessoryBar)
            VStack(alignment: .leading) {
                Text(scenarioGroup.title)
            }
        }.padding(.leading, 10)

        if !collapsed {
            ScenarioList(scenarioGroup: scenarioGroup)
        }
    }
}
