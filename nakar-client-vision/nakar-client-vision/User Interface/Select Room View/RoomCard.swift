//
//  RoomCard.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 25.03.25.
//

import SwiftUI

struct RoomCard: View {
    let room: ViewModel.Room

    var body: some View {
        Card(padding: 0, hover: true) {
            ZStack {
                Image("Wallpaper3")
                    .resizable(resizingMode: .stretch)
                VStack {
                    Spacer()
                    HStack {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(room.id)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                            Text(room.title)
                                .font(.title)
                                .lineLimit(1)
                        }
                        .padding()
                        Spacer()
                    }
                    .background(.regularMaterial)
                }
            }
        }
        .frame(width: 300, height: 200)
    }
}

#Preview {
    RoomCard(room: ViewModel.Room.demoData()[0])
}
