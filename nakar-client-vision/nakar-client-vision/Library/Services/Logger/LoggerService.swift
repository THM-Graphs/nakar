//
//  LoggerService.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 23.03.25.
//

import Foundation

class LoggerService: Service {
    func bootstrap() {
        /* */
    }

    func destory() {
        /* */
    }

    func log(sender: Any, message: String) {
        print(createLogLine(sender: sender, message: message, severity: "LOG"))
    }

    func debug(sender: Any, message: String) {
        print(createLogLine(sender: sender, message: message, severity: "DEBUG"))
    }

    func error(sender: Any, message: String) {
        print(createLogLine(sender: sender, message: message, severity: "ERROR"))
    }

    private func createLogLine(sender: Any, message: String, severity: String) -> String {
        return "(\(getISODateTimeString())) [\(severity)] [\(getClassName(of: sender))] \(message)"
    }

    private func getClassName(of instance: Any) -> String {
        return String(describing: type(of: instance))
    }

    private func getISODateTimeString() -> String {
        let formatter = ISO8601DateFormatter()
        formatter.timeZone = TimeZone.current
        return formatter.string(from: Date())
    }
}
