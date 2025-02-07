//
//  Environment.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import SwiftUI
import Combine

class SharedEnvironment: ObservableObject {
    let environmentHandler: EnvironmentHandler
    let httpBackend: HTTPBackend
    let viewModelFactory: ViewModelFactory

    @Published var roomManager: RoomManager?

    init() {
        let environmentHandler = EnvironmentHandler()
        let httpBackend = HTTPBackend(environmentHandler: environmentHandler)
        let viewModelFactory = ViewModelFactory(httpBackend: httpBackend)

        self.environmentHandler = environmentHandler
        self.httpBackend = httpBackend
        self.viewModelFactory = viewModelFactory
    }
}
