//
//  ViewModel.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import Foundation
import OpenAPIRuntime
import OpenAPIURLSession

public struct ViewModel {
    private init() {}

    public struct BackendData: Hashable, Sendable {
        public var rooms: [Room]
        public var databases: [Database]

        public static func demoData() -> BackendData {
            return BackendData(rooms: Room.demoData(), databases: Database.demoData())
        }
    }

    public struct Room: Hashable, Identifiable, Codable, Sendable {
        public var id: String
        public var title: String

        public static func demoData() -> [Room] {
            return Array(1...10).map { Room(id: "\($0)", title: "Room \($0)") }
        }

        static func from(schema: Components.Schemas.Room) -> ViewModel.Room {
            return ViewModel.Room(id: schema.id, title: schema.title ?? "")
        }
    }

    public struct Database: Hashable, Identifiable, Sendable {
        public var id: String
        public var title: String
        public var url: String?
        public var browserUrl: String?
        public var scenarioGroups: [ScenarioGroup]

        public static func demoData() -> [Database] {
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
                url: schema.url,
                browserUrl: schema.browserUrl,
                scenarioGroups: scenarioGroups
            )
        }
    }

    public struct ScenarioGroup: Hashable, Identifiable, Sendable {
        public var id: String
        public var title: String
        public var scenarios: [Scenario]

        public static func demoData() -> [ScenarioGroup] {
            return Array(1...10).map { ScenarioGroup(id: "\($0)", title: "ScenarioGroup \($0)", scenarios: Scenario.demoData()) }
        }

        static func from(schema: Components.Schemas.ScenarioGroup, scenarios: [ViewModel.Scenario]) -> ViewModel.ScenarioGroup {
            return ViewModel.ScenarioGroup(id: schema.id, title: schema.title ?? "", scenarios: scenarios)
        }
    }

    public struct Scenario: Hashable, Identifiable, Sendable, Codable {
        public var id: String
        public var title: String
        public var description: String?
        public var query: String?
        public var coverUrl: URL?

        public static func demoData() -> [Scenario] {
            return Array(1...10).map {
                Scenario(
                    id: "\($0)",
                    title: "Scenario \($0)",
                    description: "Descption...",
                    query: "MATCH (n)-[r]-(m) RETURN n, r, m",
                    coverUrl: nil
                )
            }
        }

        static func from(schema: Components.Schemas.Scenario) -> ViewModel.Scenario {
            return ViewModel.Scenario(
                id: schema.id,
                title: schema.title ?? "Untitled",
                description: schema.description,
                query: schema.query,
                coverUrl: schema.coverUrl.flatMap { URL(string: $0) }
            )
        }
    }
}
