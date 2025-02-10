//
//  Toolbar.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//


import SwiftUI

struct Toolbar: View {
    @Environment(NakarController.self) var sharedEnvironment: NakarController

#if os (visionOS)
    var body: some View {
        HStack {
            ForEach(Array(sharedEnvironment.roomManagers.values), id: \.roomId) { roomManager in
                SocketStatusOrnament(roomManager: roomManager)
            }
            EnvironmentInfoOrnament()
        }
    }
#endif

#if os (macOS)
    var body: some View {
        ForEach(Array(sharedEnvironment.roomManagers.values), id: \.roomId) { roomManager in
            Label(title: {
                Text(roomManager.socketIOManager.socketStatus.description)
            }, icon: {
                SocketStatusIconView(socketStatus: roomManager.socketIOManager.socketStatus)
            })
        }
        Text(sharedEnvironment.environmentDebugString)
    }
#endif
}

#Preview {
    let controller = ({
        let controller = NakarController()
        controller.enterRoom(roomId: "room")
        return controller
    })()
    #if os(visionOS)
    NavigationStack {
        VStack {
            EmptyView()
        }
    }
    .ornament(attachmentAnchor: .scene(.bottomFront)) {
        Toolbar()
            .environment(controller)
    }
    #endif
    #if os(macOS)
    VStack {

    }.toolbar {
        Toolbar()
            .environment(controller)
    }.frame(width: 500, height: 100)
    #endif
}
