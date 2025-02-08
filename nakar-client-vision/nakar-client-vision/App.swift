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
    let env = SharedEnvironment()
    var body: some Scene {
        WindowGroup {
            RoomSelectWindow().environmentObject(env)
        }
        WindowGroup("Room", id: "renderer") {
            RendererWindow().environmentObject(env)
        }
    }
}
