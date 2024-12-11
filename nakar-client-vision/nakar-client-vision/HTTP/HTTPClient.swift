//
//  Client.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.12.24.
//

import SwiftUI
import OpenAPIURLSession
import OpenAPIRuntime

class HTTPClient: ObservableObject {
    public let client: Client

    init() {
        client = Client(
            serverURL: try! Servers.Server1.url(),
            transport: URLSessionTransport()
        )
    }

    func getScenarios() async throws -> [Components.Schemas.ScenarioDto] {
        let result = try await client.ScenariosController_getAllScenarios()
        switch result {
        case .default(let statusCode, let data):
            if statusCode == 200 {
                let scenarios = try data.body.json
                return scenarios
            } else {
                throw HTTPClientStatusCodeError(statusCode: statusCode)
            }

        }
    }
}

struct HTTPClientStatusCodeError: Error {
    let statusCode: Int

    var localizedDescription: String {
        return "HTTP error: \(statusCode)"
    }
}
