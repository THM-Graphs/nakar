//
//  DemoFactoryService.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 26.03.25.
//

import Fakery
import Foundation
import UIKit

class DemoFactoryService {
    private let faker: Faker

    init() {
        faker = Faker(locale: "de_DE")
    }

    private func id() -> String {
        return faker.business.creditCardNumber() + faker.number.increasingUniqueId().formatted()
    }

    public func rooms() -> [ViewModel.Room] {
        return Array(1...10).map { _ in room() }
    }

    public func room() -> ViewModel.Room {
        return ViewModel.Room(id: id(), title: faker.company.catchPhrase())
    }

    public func backendData() -> ViewModel.BackendData {
        return ViewModel.BackendData(rooms: rooms(), databases: databases())
    }

    public func databases() -> [ViewModel.Database] {
        return Array(1...10).map { _ in database() }
    }

    public func database() -> ViewModel.Database {
        return ViewModel.Database(
            id: id(),
            title: faker.company.catchPhrase(),
            url: faker.internet.ipV4Address(),
            browserUrl: faker.internet.url(),
            scenarioGroups: scenarioGroups()
        )
    }

    public func scenarioGroups() -> [ViewModel.ScenarioGroup] {
        return Array(1...10).map { _ in scenarioGroup() }
    }

    public func scenarioGroup() -> ViewModel.ScenarioGroup {
        return ViewModel.ScenarioGroup(
            id: id(),
            title: faker.commerce.department(),
            scenarios: scenarios()
        )
    }

    public func scenarios() -> [ViewModel.Scenario] {
        return Array(1...10).map { _ in scenario() }
    }

    public func scenario() -> ViewModel.Scenario {
        return ViewModel.Scenario(
            id: id(),
            title: faker.company.bs(),
            description: faker.lorem.paragraphs(amount: faker.number.randomInt(min: 3, max: 8)),
            query: "MATCH (n)-[r]-(m) RETURN n, r, m",
            coverUrl: URL(string: faker.internet.templateImage())
        )
    }

    public func longCypherQuery() -> String {
        return loadFromDemoAssets(assetName: "Cypher Query")
    }

    func longDescription() -> String {
        return loadFromDemoAssets(assetName: "Scenario Description")
    }

    private func loadFromDemoAssets(assetName: String) -> String {
        guard
            let asset = NSDataAsset(name: assetName),
            let content = String(data: asset.data, encoding: .utf8)
        else {
            return "demo asset not found"
        }
        return content
    }
}
