//
//  HTTPBackend.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import Foundation
import OpenAPIRuntime
import OpenAPIURLSession

class HTTPBackend {
    private let environmentHandler: EnvironmentHandler
    private let client: Client

    init(environmentHandler: EnvironmentHandler) {
        self.environmentHandler = environmentHandler
        self.client = Client(
            serverURL: Self.getServerUrl(environmentHandler: environmentHandler),
            transport: URLSessionTransport()
        )
    }

    private class func getServerUrl(environmentHandler: EnvironmentHandler) -> URL {
        switch environmentHandler.getEnvironmentMode() {
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
}
