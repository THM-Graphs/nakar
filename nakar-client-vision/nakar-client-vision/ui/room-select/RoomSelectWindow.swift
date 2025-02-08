//
//  RoomSelectWindow.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct RoomSelectWindow: View {
    @EnvironmentObject var sharedEnvironment: SharedEnvironment
    @State var rooms: Loadable<[ViewModel.Room]> = .loading

    var body: some View {
        NavigationStack {
            RoomSelectView(rooms: rooms)
        }.task {
            do {
                rooms = .loading
                rooms = .data(data: try await sharedEnvironment.viewModelFactory.loadRooms())
            } catch let error {
                rooms = .error(error: error)
            }
        }
    }
}

#Preview() {
    RoomSelectWindow()
        .environmentObject(SharedEnvironment())
}
