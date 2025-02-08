//
//  DatabaseListEntry.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct DatabaseListEntry: View {
    let database: ViewModel.Database

    var body: some View {
        NavigationLink(value: database) {
            VStack(alignment: .leading) {
                Text(database.title)
                Text(database.url)
                    .foregroundStyle(.secondary)
                    .font(.footnote)
            }
        }
    }
}
