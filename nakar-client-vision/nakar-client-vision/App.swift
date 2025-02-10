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
    @State var env = NakarController()

    var body: some Scene {
        WindowGroup {
            ControlWindow().environment(env)
        }

        #if os(visionOS)
        // Display a fully immersive space.
        ImmersiveSpace(id: "renderer") {
            Renderer().environment(env)
        }.immersionStyle(selection: $env.immersionStyle, in: .full)
        #endif
    }
}
