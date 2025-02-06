//
//  ViewModel.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import Foundation
import OpenAPIRuntime
import OpenAPIURLSession

struct ViewModel {
    private init() {}

    struct ControlWindowState: Hashable {
        var rooms: [Room]
        var databases: [Database]
    }

    struct Room: Hashable, Identifiable {
        var id: String
        var title: String

        static func demoData() -> [Room] {
            return Array(1...10).map { Room(id: "\($0)", title: "Room \($0)") }
        }
    }

    struct Database: Hashable, Identifiable {
        var id: String
        var title: String
        var scenarioGroups: [ScenarioGroup]

        static func demoData() -> [Database] {
            return Array(1...10).map { Database(id: "\($0)", title: "Database \($0)", scenarioGroups: ScenarioGroup.demoData()) }
        }
    }

    struct ScenarioGroup: Hashable, Identifiable {
        var id: String
        var title: String
        var scenarios: [Scenario]

        static func demoData() -> [ScenarioGroup] {
            return Array(1...10).map { ScenarioGroup(id: "\($0)", title: "ScenarioGroup \($0)", scenarios: Scenario.demoData()) }
        }
    }

    struct Scenario: Hashable, Identifiable {
        var id: String
        var title: String
        var query: String

        static func demoData() -> [Scenario] {
            return Array(1...10).map { Scenario(id: "\($0)", title: "Scenario \($0)", query: "MATCH (n)-[r]-(m) RETURN n, r, m") }
        }
    }
}
