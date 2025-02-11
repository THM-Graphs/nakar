//
//  RoomSelectView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI
import NakarKit

struct RoomListEntry: View {
    let room: ViewModel.Room
    let onEnter: (() -> Void)?

    var body: some View {
        #if os(visionOS)
        HStack(spacing: 20) {
            VStack(alignment: .leading) {
                Text(room.id).foregroundStyle(.secondary)
                Text(room.title)
            }
            Spacer()
            Button(action: {
                onEnter?()
            }) {
                Label("Enter", systemImage: "eye")
            }
        }
        .padding(30)
        .background(.regularMaterial)
        .clipShape(.rect(cornerRadius: 20))
        .navigationTitle("NAKAR")
        #endif
        #if os(macOS)
            HStack(spacing: 20) {
                VStack(alignment: .leading) {
                    Text(room.id).foregroundStyle(.secondary)
                    Text(room.title)
                }
                Spacer()
                Label("Enter", systemImage: "eye")
            }
        
        #endif
    }
}

#Preview {
    RoomListEntry(room: ViewModel.Room.demoData()[0], onEnter: nil)
}
