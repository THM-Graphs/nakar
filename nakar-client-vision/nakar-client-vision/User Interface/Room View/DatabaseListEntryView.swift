//
//  DatabaseListEntryView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 25.03.25.
//

import SwiftUI

struct DatabaseListEntryView: View {
    let database: ViewModel.Database

    var body: some View {
        ExpandableListEntryView {
            VStack(alignment: .leading) {
                Text(database.title)
                    .lineLimit(1)
                Text(database.browserUrl ?? "-")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        } children: {
            ForEach(database.scenarioGroups) { (scenarioGroup: ViewModel.ScenarioGroup) in
                ScenarioGroupListEntryView(scenarioGroup: scenarioGroup)
            }
        }
    }
}
