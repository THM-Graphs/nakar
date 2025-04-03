//
//  VisionProImmersiveSpace.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

import SwiftUI
import RealityKit

struct NakarImmersiveSpace: View {
    @Environment(\.dismissImmersiveSpace) var dismissImmersiveSpace

    let room: Binding<ViewModel.Room?>

    var body: some View {
        if let room = room.wrappedValue {
            NakarRealityView(room: room, mode: .immersiveSpace)
        } else {
            Button {
                Task {
                    await dismissImmersiveSpace()
                }
            } label: {
                Text("Close Immersive Space")
            }
        }

    }
}
