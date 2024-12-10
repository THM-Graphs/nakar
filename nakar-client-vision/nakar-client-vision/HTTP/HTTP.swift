//
//  HTTP.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 10.12.24.
//

import Foundation

let baseUrl = URL(string: "http://localhost:3000")!

func getScenarios() async throws -> [ScenarioDto] {
    let url = baseUrl.appendingPathComponent("/scenarios")
    let (data, _) = try await URLSession.shared.data(from: url)
    let scenarios = try JSONDecoder().decode([ScenarioDto].self, from: data)
    return scenarios
}
