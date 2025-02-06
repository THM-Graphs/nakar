//
//  nakar_client_visionApp.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import SwiftUI

@main
struct nakar_client_visionApp: App {
    var body: some Scene {
        WindowGroup {
            ControlWindow().environmentObject(Environment())
        }
    }
}
