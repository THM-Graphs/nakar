//
//  ViewService.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 23.03.25.
//

import SwiftUI

@Observable class ViewService: Service {
    private let httpService: HTTPService
    private let wsService: WSService
    private let loggerService: LoggerService

    var httpData: Loadable<ViewModel.BackendData>
    var currentRoom: ViewModel.Room?

    init(httpService: HTTPService, wsService: WSService, loggerService: LoggerService) {
        self.httpService = httpService
        self.wsService = wsService
        self.loggerService = loggerService
        httpData = .nothing
        currentRoom = nil
    }

    private func reload() async {
        self.loggerService.log(sender: self, message: "Will load backend data")
        do {
            httpData = .loading
            httpData = .data(data: try await self.httpService.loadBackendData())
        } catch let error {
            httpData = .error(error: error)
        }
    }

    func bootstrap() async {
        await reload()
    }

    func destory() {
        /* */
    }

    func enterRoom(room: ViewModel.Room) {
        self.currentRoom = room
        self.loggerService.log(sender: self, message: "Will enter room \(room)")
        wsService.send(message: Components.Schemas.WSActionJoinRoom(_type: .wsActionJoinRoom, roomId: room.id))
    }
}
