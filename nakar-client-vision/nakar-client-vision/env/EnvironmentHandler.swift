//
//  EnvironmentHandler.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

class EnvironmentHandler {
    func getEnvironmentMode() -> EnvironmentMode {
#if DEBUG
        return .development
#else
        return .production
#endif
    }
}
