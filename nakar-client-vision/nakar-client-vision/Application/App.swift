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
    let nakarApplication: NakarApplication = NakarApplication()
    @State var env = NakarController()
    @State var initialized: Bool = false

    var body: some Scene {
        WindowGroup {
            #if os(macOS)
            MacControlWindow()
                .environment(env)
                .onAppear {
                    env.initialize()
                }
            #endif
            #if os(visionOS)
            if initialized {
                SelectRoomScreen()
                    .environment(nakarApplication)
                    .onDisappear {
                        nakarApplication.destory()
                    }
            } else {
                ProgressView()
                    .task {
                        await nakarApplication.bootstrap()
                        initialized = true
                    }
            }
            #endif
        }

        #if os(visionOS)
        ImmersiveSpace(id: "renderer", for: String.self) { roomId in
            VisionProImmersiveSpace(roomId: roomId)
                .environment(env)
        }.immersionStyle(selection: $env.immersionStyle, in: .mixed)
        #endif
    }
}
