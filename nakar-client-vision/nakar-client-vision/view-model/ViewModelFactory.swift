//
//  ViewModelFactory.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

class ViewModelFactory {
    let httpBackend: HTTPBackend

    init(httpBackend: HTTPBackend) {
        self.httpBackend = httpBackend
    }

    func loadScenarios(scenarioGroupId: String) async throws -> [ViewModel.Scenario] {
        let scenarioSchemas = try await httpBackend.getScenarios(scenarioGroupId: scenarioGroupId)
        let scenarios = scenarioSchemas.map { scenarioFrom(schema: $0) }
        return scenarios
    }

    func loadScenarioGroups(databaseId: String) async throws -> [ViewModel.ScenarioGroup] {
        let scenarioGroupSchemas = try await httpBackend.getScenarioGroups(databaseId: databaseId)

        let scenarioGroups = try await scenarioGroupSchemas.asyncMap { scenarioGroupSchema in
            return scenarioGroupFrom(schema: scenarioGroupSchema, scenarios: try await loadScenarios(scenarioGroupId: scenarioGroupSchema.id))
        }
        return scenarioGroups
    }

    func loadDatabases() async throws -> [ViewModel.Database] {
        let databaseSchemas = try await httpBackend.getDatabases()

        let databases = try await databaseSchemas.asyncMap { databaseSchema in
            return databaseFrom(schema: databaseSchema, scenarioGroups: try await loadScenarioGroups(databaseId: databaseSchema.id))
        }
        return databases
    }

    func loadRooms() async throws -> [ViewModel.Room] {
        let roomSchemas = try await httpBackend.getRooms()

        let rooms = roomSchemas.map { roomSchema in
            return roomFrom(schema: roomSchema)
        }
        return rooms
    }

    func loadControlWindowState() async throws -> ViewModel.ControlWindowState {
        let rooms = try await loadRooms()
        let databases = try await loadDatabases()

        return ViewModel.ControlWindowState(
            rooms: rooms,
            databases: databases
        )
    }

    func scenarioFrom(schema: Components.Schemas.Scenario) -> ViewModel.Scenario {
        return ViewModel.Scenario(id: schema.id, title: schema.title ?? "", query: schema.query ?? "")
    }

    func scenarioGroupFrom(schema: Components.Schemas.ScenarioGroup, scenarios: [ViewModel.Scenario]) -> ViewModel.ScenarioGroup {
        return ViewModel.ScenarioGroup(id: schema.id, title: schema.title ?? "", scenarios: scenarios)
    }

    func databaseFrom(schema: Components.Schemas.Database, scenarioGroups: [ViewModel.ScenarioGroup]) -> ViewModel.Database {
        return ViewModel.Database(id: schema.id, title: schema.title ?? "", scenarioGroups: scenarioGroups)
    }

    func roomFrom(schema: Components.Schemas.Room) -> ViewModel.Room {
        return ViewModel.Room(id: schema.id, title: schema.title ?? "")
    }
}
