//
//  RoomsView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct RoomsView: View {
    let rooms: [ViewModel.Room]
    let onEnter: ((ViewModel.Room) -> Void)?

    var body: some View {
        VStack {
            ForEach(rooms) { room in
                SingleRoomView(room: room, onEnter: {
                    onEnter?(room)
                })
            }
        }
    }
}

#if os(visionOS)
#Preview(windowStyle: .automatic) {
    RoomsView(rooms: ViewModel.Room.demoData(), onEnter: {_ in})
}
#endif

#if os(macOS)
#Preview() {
    RoomsView(rooms: ViewModel.Room.demoData(), onEnter: {_ in})
}
#endif
