//
//  nakar_client_visionApp.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 10.12.24.
//

import SwiftUI
import OpenAPIURLSession
import OpenAPIRuntime

@main
struct NakarClientVisionApp: App {
    let client = HTTPClient()

    var body: some Scene {
        WindowGroup("Main Window") {
            ScenariosView()
        }
        .windowStyle(.plain)
        .environmentObject(client)

        ImmersiveSpace(id: "graphView") {
            ImmersiveView()
        }
        .environmentObject(client)
    }
}
