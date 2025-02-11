//
//  DatabaseListEntry.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI
import NakarKit

struct DatabaseListEntry: View {
    let database: ViewModel.Database
    @State var collapsed = true

    var body: some View {
        #if os(visionOS)
        NavigationLink(value: database) {
            HStack {
                VStack(alignment: .leading) {
                    Text(database.title)
                    Text(database.url)
                        .foregroundStyle(.secondary)
                        .font(.footnote)
                }
            }
        }
        #endif
        #if os(macOS)
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
                Text(database.title)
                Text(database.url ?? "")
                    .foregroundStyle(.secondary)
                    .font(.footnote)
            }
        }

        if !collapsed {
            ForEach(database.scenarioGroups) { scenarioGroup in
                ScenarioGroupListEntry(scenarioGroup: scenarioGroup)
            }
        }
        #endif
    }
}

#Preview {
    DatabaseListEntry(database: ViewModel.Database.demoData()[0])
}
