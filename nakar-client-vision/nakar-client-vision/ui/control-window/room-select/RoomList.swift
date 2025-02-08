//
//  RoomsView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct RoomList: View {
    let rooms: [ViewModel.Room]
    let onEnter: ((ViewModel.Room) -> Void)?

    var body: some View {
        VStack {
            ForEach(rooms) { room in
                RoomListEntry(room: room, onEnter: {
                    onEnter?(room)
                })
            }
        }
    }
}

#Preview {
    RoomList(rooms: ViewModel.Room.demoData(), onEnter: nil)
}
