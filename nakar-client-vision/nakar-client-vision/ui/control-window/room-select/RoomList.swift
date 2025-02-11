//
//  RoomsView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI
import NakarKit

struct RoomList: View {
    let rooms: [ViewModel.Room]
    let onEnter: ((ViewModel.Room) -> Void)?

    #if os(macOS)
    @State var selection: ViewModel.Room?
    #endif

    var body: some View {
        #if os(visionOS)
        VStack {
            ForEach(rooms) { room in
                RoomListEntry(room: room, onEnter: {
                    onEnter?(room)
                })
            }
        }
        #endif
        #if os(macOS)
        List(selection: $selection) {
            ForEach(rooms) { room in
                NavigationLink(value: room) {
                    RoomListEntry(room: room, onEnter: {
                        onEnter?(room)
                    })
                }
            }
        }
        #endif
    }
}

#Preview {
    RoomList(rooms: ViewModel.Room.demoData(), onEnter: nil)
}
