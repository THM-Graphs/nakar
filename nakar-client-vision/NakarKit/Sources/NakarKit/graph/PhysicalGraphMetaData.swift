//
//  PhysicalGraphMetaData.swift
//  NakarKit
//
//  Created by Samuel Schepp on 11.02.25.
//

public struct PhysicalGraphMetaData: Equatable {
    public var labels: [PhysicalGraphLabel]
    public var scenarioInfo: PhysicalScenarioInfo

    public init(labels: [PhysicalGraphLabel], scenarioInfo: PhysicalScenarioInfo) {
        self.labels = labels
        self.scenarioInfo = scenarioInfo
    }

    init(of schemaGraphMetaData: Components.Schemas.GraphMetaData) {
        self.init(
            labels: schemaGraphMetaData.labels.map { .init(of: $0) },
            scenarioInfo: .init(of: schemaGraphMetaData.scenarioInfo)
        )
    }
}
