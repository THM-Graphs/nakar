//
//  NakarApplication.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 23.03.25.
//

import SwiftUI

@MainActor
@Observable
class NakarApplication: Service {
    let loggerService: LoggerService
    let environmentService: EnvironmentService
    let httpService: HTTPService
    let wsService: WSService
    var viewService: ViewService
    let rendererService: RendererService
    let messageService: NotificationService

    init() {
        self.loggerService = LoggerService()
        self.environmentService = EnvironmentService(loggerService: loggerService)
        self.httpService = HTTPService(loggerService: loggerService, environmentService: environmentService)
        self.wsService = WSService(loggerService: loggerService, environmentService: environmentService)
        self.viewService = ViewService(httpService: httpService, wsService: wsService, loggerService: loggerService)
        self.rendererService = RendererService(loggerService: loggerService)
        self.messageService = NotificationService(wsService: wsService, logger: loggerService)
    }

    func bootstrap() async {
        self.loggerService.log(sender: self, message: "Will bootstrap services...")

        for service in self.getAllServices() {
            self.loggerService.log(sender: self, message: "Will bootstrap \(String(describing: type(of: service)))")
            await service.bootstrap()
        }

        self.loggerService.log(sender: self, message: "Did bootstrap all services")
    }

    func destory() async {
        self.loggerService.log(sender: self, message: "Will destroy services...")

        for service in self.getAllServices().reversed() {
            self.loggerService.log(sender: self, message: "Will destroy \(String(describing: type(of: service)))")
            await service.destory()
        }

        self.loggerService.log(sender: self, message: "Did destroy all services")
    }

    private func getAllServices() -> [Service] {
        return [
            self.loggerService,
            self.environmentService,
            self.httpService,
            self.wsService,
            self.viewService,
            self.rendererService,
            self.messageService
        ]
    }
}
