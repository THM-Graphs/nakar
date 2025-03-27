//
//  ViewService.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 23.03.25.
//

import SwiftUI
import Combine

@Observable
class ViewService: Service {
    private let httpService: HTTPService
    private let wsService: WSService
    private let loggerService: LoggerService

    var httpData: Loadable<ViewModel.BackendData>
    var currentRoom: ViewModel.Room?
    var immersionStyle: ImmersionStyle
    var scenarioProgress: ScenarioProgress?
    var graph: Components.Schemas.Graph? = nil

    private var cancellables: Set<AnyCancellable>

    init(httpService: HTTPService, wsService: WSService, loggerService: LoggerService) {
        self.httpService = httpService
        self.wsService = wsService
        self.loggerService = loggerService
        httpData = .nothing
        currentRoom = nil
        immersionStyle = .mixed
        scenarioProgress = nil
        cancellables = []
    }

    private func reload() async {
        self.loggerService.log(sender: self, message: "Will load backend data")
        do {
            httpData = .loading
            let dataFromHTTP = try await self.httpService.loadBackendData()
            httpData = .data(data: dataFromHTTP)
        } catch let error {
            httpData = .error(error: error)
        }
    }

    func bootstrap() async {
        await reload()
        wsService.onWSEventScenarioProgress.sink { [weak self] event in
            guard let self else { return }
            if let progress = event.progress, let message = event.message {
                scenarioProgress = ScenarioProgress(progress: progress, description: message)
            } else {
                scenarioProgress = nil
            }
        }.store(in: &cancellables)

        wsService.onWSEventScenarioLoaded.sink { [weak self] event in
            guard let self else { return }
            graph = event.graph
        }.store(in: &cancellables)
    }

    func destory() {
        cancellables.forEach {
            $0.cancel()
        }
    }

    func enterRoom(room: ViewModel.Room) {
        self.currentRoom = room
        self.loggerService.log(sender: self, message: "Will enter room \(room)")
        wsService.send(message: Components.Schemas.WSActionJoinRoom(_type: .wsActionJoinRoom, roomId: room.id))
    }

    func runScenario(scenario: ViewModel.Scenario) {
        wsService.send(message: Components.Schemas.WSActionLoadScenario(_type: .wsActionLoadScenario, scenarioId: scenario.id))
    }
}
