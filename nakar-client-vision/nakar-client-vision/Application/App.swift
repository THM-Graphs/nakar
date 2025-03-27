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
    @State var nakarApplication: NakarApplication = NakarApplication()
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
                        Task {
                            await nakarApplication.destory()
                        }
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
        ImmersiveSpace(id: "renderer", for: ViewModel.Room.self) { room in
            NakarImmersiveSpace(room: room)
                .environment(nakarApplication)
        }.immersionStyle(selection: $nakarApplication.viewService.immersionStyle, in: MixedImmersionStyle.mixed)
        #endif

        WindowGroup(id: "tabledata") {
            TableDataScreen()
                .environment(nakarApplication)
        }
    }
}
