//
//  Toolbar.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//


import SwiftUI
import NakarKit

struct Toolbar: View {
    @Environment(NakarController.self) var sharedEnvironment: NakarController

    private var rooms: [NakarRoom] {
        Array(sharedEnvironment.roomManagers.values)
    }

#if os (visionOS)
    var body: some View {
        HStack {
            ForEach(rooms, id: \.roomId) { room in
                SocketStatusOrnament(roomManager: room)
            }
            EnvironmentInfoOrnament()
        }
    }
#endif

#if os (macOS)
    var body: some View {
        ForEach(rooms, id: \.roomId) { room in
            Label(title: {
                Text(room.socketStatus.description)
            }, icon: {
                SocketStatusIconView(socketStatus: room.socketStatus)
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
