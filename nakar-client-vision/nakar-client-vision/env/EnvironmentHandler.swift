//
//  EnvironmentHandler.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import Foundation

class EnvironmentHandler {
    func getEnvironmentMode() -> EnvironmentMode {
#if DEBUG
        return .development
#else
        return .production
#endif
    }

    func getWSUrl() -> URL {
        switch getEnvironmentMode() {
        case .development: return URL(string: "http://localhost:1337")!
        case .production: return URL(string: "http://nakar.mni.thm.de:1337")!
        }
    }
}
