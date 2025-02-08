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
class SharedEnvironment {
    private let httpBackend: HTTPBackend

    var roomManagers: [String: RoomManager]
    var backendData: Loadable<ViewModel.BackendData> = .nothing
    var immersionStyle: ImmersionStyle = .mixed

    init() {
        self.httpBackend = HTTPBackend()

        self.roomManagers = [:]
    }

    enum Mode {
        case production
        case development

        static var current: Mode {
#if DEBUG
            return .development
#else
            return .production
#endif
        }
    }

    func enterRoom(roomId: String) {
        if self.roomManagers.keys.contains(roomId) {
            return
        }
        let roomManager = RoomManager(roomId: roomId)
        self.roomManagers[roomId] = roomManager
    }

    func leaveRoom(roomId: String) {
        guard let roomManager = self.roomManagers[roomId] else {
            return
        }
        roomManager.leave()
        roomManagers.removeValue(forKey: roomId)
    }

    var releaseVersionNumber: String {
        return Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0.0"
    }
    var buildVersionNumber: String {
        return Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "0"
    }

    func initialize() async -> Void {
        do {
            self.backendData = .loading
            self.backendData = .data(data: try await self.httpBackend.loadBackendData())
        } catch let error {
            self.backendData = .error(error: error)
        }
    }
}
