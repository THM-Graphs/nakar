//
//  Environment.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import SwiftUI

class Environment: ObservableObject {
    let environmentHandler: EnvironmentHandler
    let httpBackend: HTTPBackend
    let viewModelFactory: ViewModelFactory

    init() {
        environmentHandler = EnvironmentHandler()
        httpBackend = HTTPBackend(environmentHandler: environmentHandler)
        viewModelFactory = ViewModelFactory(httpBackend: httpBackend)
    }
}
