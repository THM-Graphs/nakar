//
//  Environment.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import SwiftUI
import Combine
import Foundation

@MainActor
@Observable
public class NakarController {
    private let httpBackend: HTTPBackend

    public var roomManagers: [String: NakarRoom]
    public var backendData: Loadable<ViewModel.BackendData> = .nothing

    #if os(visionOS)
    public var immersionStyle: ImmersionStyle = .mixed
    #endif

    public init() {
        self.httpBackend = HTTPBackend()

        self.roomManagers = [:]
    }

    public enum Mode: CustomStringConvertible {
        case production
        case development

        public static var current: Mode {
            #if DEBUG
            return .development
            #else
            return .production
            #endif
        }

        public var description: String {
            switch self {
            case .production: return "Production"
            case .development: return "Development"
            }
        }
    }

    public func enterRoom(roomId: String) {
        if self.roomManagers.keys.contains(roomId) {
            return
        }
        let roomManager = NakarRoom(roomId: roomId)
        self.roomManagers[roomId] = roomManager
    }

    public func leaveRoom(roomId: String) {
        guard let roomManager = self.roomManagers[roomId] else {
            return
        }
        roomManager.leave()
        roomManagers.removeValue(forKey: roomId)
    }

    public func leaveRooms() {
        roomManagers.keys.forEach {
            self.leaveRoom(roomId: $0)
        }
    }

    public var environmentDebugString: String {
        return "\(Mode.current.description) (\(releaseVersionNumber)-\(buildVersionNumber))"
    }

    public var releaseVersionNumber: String {
        return Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0.0"
    }
    public var buildVersionNumber: String {
        return Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "0"
    }

    public func initialize() -> Void {
        Task {
            do {
                self.backendData = .loading
                self.backendData = .data(data: try await self.httpBackend.loadBackendData())
            } catch let error {
                self.backendData = .error(error: error)
            }
        }
    }

    public func run(_ scenario: ViewModel.Scenario, in room: ViewModel.Room) {
        #warning("")
    }

    public func copyQueryClipboard(scenario: ViewModel.Scenario) {
#warning("")
    }
}
