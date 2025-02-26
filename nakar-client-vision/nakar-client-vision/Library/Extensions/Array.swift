//
//  Array.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

@MainActor
extension Array where Element: Sendable {
    func asyncMap<T: Sendable>(_ transform: (Element) async throws -> T) async rethrows -> [T] {
        var results = [T]()
        for element in self {
            results.append(try await transform(element))
        }
        return results
    }
}
