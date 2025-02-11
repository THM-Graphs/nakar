//
//  DatabaseSidebar.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI
import NakarKit

struct DatabaseSidebar: View {
    let databases: [ViewModel.Database]
    let selectedScenario: Binding<ViewModel.Scenario?>

    var body: some View {
        List (databases, selection: selectedScenario) { database in
            DatabaseListEntry(database: database)
        }.listStyle(.sidebar).navigationSplitViewColumnWidth(min: 200, ideal: 200)
    }
}


#Preview {
    NavigationSplitView {
        DatabaseSidebar(
            databases: ViewModel.Database.demoData(),
            selectedScenario: Binding<ViewModel.Scenario?>.constant(nil)
        )
    } detail: {
        EmptyView()
    }
}
