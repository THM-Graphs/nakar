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

    struct BackendData: Hashable {
        var rooms: [Room]
        var databases: [Database]

        static func demoData() -> BackendData {
            return BackendData(rooms: Room.demoData(), databases: Database.demoData())
        }
    }

    struct Room: Hashable, Identifiable, Codable {
        var id: String
        var title: String

        static func demoData() -> [Room] {
            return Array(1...10).map { Room(id: "\($0)", title: "Room \($0)") }
        }

        static func from(schema: Components.Schemas.Room) -> ViewModel.Room {
            return ViewModel.Room(id: schema.id, title: schema.title ?? "")
        }
    }

    struct Database: Hashable, Identifiable {
        var id: String
        var title: String
        var url: String
        var browserUrl: String
        var scenarioGroups: [ScenarioGroup]

        static func demoData() -> [Database] {
            return Array(1...10).map {
                Database(
                    id: "\($0)",
                    title: "Database \($0)",
                    url: "neo4j://wikidata.org",
                    browserUrl: "https://wikipedia.org",
                    scenarioGroups: ScenarioGroup.demoData()
                )
            }
        }

        static func from(schema: Components.Schemas.Database, scenarioGroups: [ViewModel.ScenarioGroup]) -> ViewModel.Database {
            return ViewModel.Database(
                id: schema.id,
                title: schema.title ?? "",
                url: schema.url ?? "",
                browserUrl: schema.browserUrl ?? "",
                scenarioGroups: scenarioGroups
            )
        }
    }

    struct ScenarioGroup: Hashable, Identifiable {
        var id: String
        var title: String
        var scenarios: [Scenario]

        static func demoData() -> [ScenarioGroup] {
            return Array(1...10).map { ScenarioGroup(id: "\($0)", title: "ScenarioGroup \($0)", scenarios: Scenario.demoData()) }
        }

        static func from(schema: Components.Schemas.ScenarioGroup, scenarios: [ViewModel.Scenario]) -> ViewModel.ScenarioGroup {
            return ViewModel.ScenarioGroup(id: schema.id, title: schema.title ?? "", scenarios: scenarios)
        }
    }

    struct Scenario: Hashable, Identifiable {
        var id: String
        var title: String
        var query: String
        var coverUrl: String?

        static func demoData() -> [Scenario] {
            return Array(1...10).map {
                Scenario(
                    id: "\($0)",
                    title: "Scenario \($0)",
                    query: "MATCH (n)-[r]-(m) RETURN n, r, m",
                    coverUrl: nil
                )
            }
        }

        static func from(schema: Components.Schemas.Scenario) -> ViewModel.Scenario {
            return ViewModel.Scenario(
                id: schema.id,
                title: schema.title ?? "",
                query: schema.query ?? "",
                coverUrl: schema.coverUrl
            )
        }
    }
}
