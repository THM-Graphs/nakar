//
//  PhysicalScenarioInfo.swift
//  NakarKit
//
//  Created by Samuel Schepp on 11.02.25.
//

public struct PhysicalScenarioInfo: Equatable {
    public var id: String
    public var title: String?

    init(id: String, title: String?) {
        self.id = id
        self.title = title
    }

    init(of schemaScnearioInfo: Components.Schemas.ScenarioInfo) {
        self.init(id: schemaScnearioInfo.id, title: schemaScnearioInfo.title)
    }
}
