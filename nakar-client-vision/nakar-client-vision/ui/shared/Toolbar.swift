//
//  Toolbar.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//


import SwiftUI

struct Toolbar: View {
    @Environment(SharedEnvironment.self) var sharedEnvironment: SharedEnvironment

    var body: some View {
        HStack {
            ForEach(Array(sharedEnvironment.roomManagers.values), id: \.roomId) { roomManager in
                SocketStatusOrnament(roomManager: roomManager)
            }
            EnvironmentInfoOrnament()
        }
    }
}
