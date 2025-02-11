//
//  VisionProImmersiveSpace.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 11.02.25.
//

#if os(visionOS)

import SwiftUI
import NakarKit
import RealityKit

struct VisionProImmersiveSpace: View {
    @Environment(\.dismissImmersiveSpace) var dismissImmersiveSpace
    @Environment(NakarController.self) var nakarController: NakarController

    let roomId: Binding<String?>

    @State var controller: RendererViewController?

    var body: some View {
        if let roomId = roomId.wrappedValue, let roomManager = nakarController.roomManagers[roomId] {
            RealityView { content in
                self.controller = RendererViewController(content: content, nakarRoom: roomManager)
            }.onDisappear {
                controller?.close()
            }
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

    func createSphere() -> ModelEntity {
        let sphere = ModelEntity(mesh: .generateSphere(radius: 0.1), materials: [SimpleMaterial(color: .blue, isMetallic: false)])
        sphere.position = [0, 0, -0.5]
        return sphere
    }
}

#endif
