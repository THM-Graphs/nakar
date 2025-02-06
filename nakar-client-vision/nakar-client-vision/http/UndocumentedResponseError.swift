//
//  UndocumentedResponseError.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import OpenAPIRuntime
import Foundation

struct UndocumentedResponseError: Error, CustomStringConvertible {
    let status: Int
    let json: String

    init(status: Int, payload: UndocumentedPayload) async {
        self.status = status

        do {
            if let body = payload.body {
                self.json = try await String(collecting: body, upTo: 1024)
            } else {
                self.json = ""
            }
        } catch let error {
            print(error)
            self.json = ""
        }
    }

    var description: String {
        return "Status Code \(self.status). Body: \(json)"
    }
}
