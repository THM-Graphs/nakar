//
//  EnvironmentService.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 23.03.25.
//

import Foundation

class EnvironmentService: Service {
    private let loggerService: LoggerService

    init(loggerService: LoggerService) {
        self.loggerService = loggerService
    }

    func bootstrap() {
        self.loggerService.log(sender: self, message: "Environment: \(environmentDebugString)")
    }

    func destory() {
        /* */
    }

    var mode: EnvironmentMode {
#if DEBUG
            return .development
#else
            return .production
#endif
    }

    var environmentDebugString: String {
        return "\(mode.description) (\(releaseVersionNumber)-\(buildVersionNumber))"
    }

    var releaseVersionNumber: String {
        return Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0.0"
    }
    var buildVersionNumber: String {
        return Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "0"
    }
}
