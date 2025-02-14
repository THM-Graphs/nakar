//
//  HTTPBackend.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import Foundation
import OpenAPIRuntime
import OpenAPIURLSession

@MainActor
class HTTPBackend {
    private let client: Client

    init() {
        self.client = Client(
            serverURL: Self.url,
            transport: URLSessionTransport()
        )
    }

    static var url: URL {
        switch NakarController.Mode.current {
        case .development: return try! Servers.Server1.url()
        case .production: return try! Servers.Server2.url()
        }
    }

    func getRooms() async throws -> [Components.Schemas.Room] {
        let result = try await client.getRooms()
        return try result.ok.body.json.rooms
    }

    func getDatabases() async throws -> [Components.Schemas.Database] {
        let result = try await client.getDatabases()
        return try result.ok.body.json.databases
    }

    func getScenarioGroups(databaseId: String) async throws -> [Components.Schemas.ScenarioGroup] {
        let result = try await client.getScenarioGroups(Operations.GetScenarioGroups.Input(query: Operations.GetScenarioGroups.Input.Query(databaseId: databaseId)))
        return try result.ok.body.json.scenarioGroups
    }

    func getScenarios(scenarioGroupId: String) async throws -> [Components.Schemas.Scenario] {
        let result = try await client.getScenarios(Operations.GetScenarios.Input(query: Operations.GetScenarios.Input.Query(scenarioGroupId: scenarioGroupId)))
        return try result.ok.body.json.scenarios
    }

    func loadScenarios(scenarioGroupId: String) async throws -> [ViewModel.Scenario] {
        let scenarioSchemas = try await getScenarios(scenarioGroupId: scenarioGroupId)
        let scenarios = scenarioSchemas.map {
            ViewModel.Scenario.from(schema: $0)
        }
        return scenarios
    }

    func loadScenarioGroups(databaseId: String) async throws -> [ViewModel.ScenarioGroup] {
        let scenarioGroupSchemas = try await getScenarioGroups(databaseId: databaseId)

        let scenarioGroups = try await scenarioGroupSchemas.asyncMap { scenarioGroupSchema in
            return ViewModel.ScenarioGroup.from(
                schema: scenarioGroupSchema,
                scenarios: try await loadScenarios(scenarioGroupId: scenarioGroupSchema.id)
            )
        }
        return scenarioGroups
    }

    func loadDatabases() async throws -> [ViewModel.Database] {
        let databaseSchemas = try await getDatabases()

        let databases = try await databaseSchemas.asyncMap { databaseSchema in
            return ViewModel.Database.from(
                schema: databaseSchema,
                scenarioGroups: try await loadScenarioGroups(databaseId: databaseSchema.id)
            )
        }
        return databases
    }

    func loadRooms() async throws -> [ViewModel.Room] {
        let roomSchemas = try await getRooms()

        let rooms = roomSchemas.map { roomSchema in
            return ViewModel.Room.from(schema: roomSchema)
        }
        return rooms
    }

    func loadBackendData() async throws -> ViewModel.BackendData {
        let rooms = try await loadRooms()
        let databases = try await loadDatabases()

        return ViewModel.BackendData(
            rooms: rooms,
            databases: databases
        )
    }
}
