//
//  VisionProImmersiveSpace.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

#if os(visionOS)

import SwiftUI
import RealityKit

struct VisionProImmersiveSpace: View {
    @Environment(\.dismissImmersiveSpace) var dismissImmersiveSpace

    let roomId: Binding<String?>

    var body: some View {
        if let roomId = roomId.wrappedValue {
            NakarRealityView(roomId: roomId, mode: .immersiveSpace)
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

#endif
