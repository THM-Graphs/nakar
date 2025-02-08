//
//  DatabaseSidebar.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct DatabaseSidebar: View {
    let databases: [ViewModel.Database]
    let selectedDatabase: Binding<ViewModel.Database?>

    var body: some View {
        List (databases, selection: selectedDatabase) { database in
            DatabaseListEntry(database: database)
        }.listStyle(.sidebar)
    }
}
