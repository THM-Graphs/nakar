//
//  ScenarioMetaDataSection.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct DatabaseMetaDataSection: View {
    let database: ViewModel.Database
    
    @Environment(\.openURL) var openURL

    var body: some View {
        Section {
            Button(action: {
                guard let url = URL(string: database.browserUrl) else {
                    return
                }
                openURL(url)
            }) {
                HStack {
                    Text("Open in web browser")
                    Image(systemName: "arrow.up.right.circle")
                    Spacer()
                    URLView(url: database.browserUrl)
                }
            }
        }
    }
}

#Preview {
    DatabaseMetaDataSection(database: ViewModel.Database.demoData()[0])
}
