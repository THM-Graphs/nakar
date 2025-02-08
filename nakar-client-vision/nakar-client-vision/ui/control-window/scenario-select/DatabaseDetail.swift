//
//  DatabaseDetail.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct DatabaseDetail: View {
    let database: ViewModel.Database

    var body: some View {
        List {
            DatabaseMetaDataSection(database: database)
            ScenarioList(scenarioGroups: database.scenarioGroups)
        }.navigationTitle(database.title)
    }
}
