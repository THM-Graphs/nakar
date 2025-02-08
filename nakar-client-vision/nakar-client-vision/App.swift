//
//  nakar_client_visionApp.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import SwiftUI
import Combine

@main
struct nakar_client_visionApp: App {
    @State var env = SharedEnvironment()

    var body: some Scene {
        WindowGroup {
            ControlWindow().environment(env)
        }

        // Display a fully immersive space.
        ImmersiveSpace(id: "renderer") {
            Renderer().environment(env)
        }.immersionStyle(selection: $env.immersionStyle, in: .full)
    }
}
