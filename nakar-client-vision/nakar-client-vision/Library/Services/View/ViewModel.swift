//
//  ViewModel.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import Foundation
import OpenAPIRuntime
import OpenAPIURLSession
import Fakery

@MainActor fileprivate let faker: Faker = Faker(locale: "de_DE")

public struct ViewModel {
    private init() {
    }

    public struct BackendData: Hashable, Sendable {
        public var rooms: [Room]
        public var databases: [Database]
    }

    public struct Room: Hashable, Identifiable, Codable, Sendable {
        public var id: String
        public var title: String

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
