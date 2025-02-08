//
//  RoomSelectView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct SingleRoomView: View {
    let room: ViewModel.Room
    let onEnter: (() -> Void)?

    var body: some View {
        HStack(spacing: 20) {
            VStack(alignment: .leading) {
                Text(room.id).foregroundStyle(.secondary)
                Text(room.title)
            }
            Spacer()
            Button(action: {
                onEnter?()
            }) {
                Text ("Enter")
            }
        }
        .padding(30)
        .background(.regularMaterial)
        .clipShape(.rect(cornerRadii: .init(topLeading: 20, bottomLeading: 20, bottomTrailing: 20, topTrailing: 20)))
        .navigationTitle("NAKAR")
    }
}


#if os(visionOS)
#Preview(windowStyle: .automatic) {
    SingleRoomView(room: ViewModel.Room.demoData()[0], onEnter: {})
}
#endif

#if os(macOS)
#Preview() {
    SingleRoomView(room: ViewModel.Room.demoData()[0], onEnter: {})
}
#endif
