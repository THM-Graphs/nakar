//
//  RendererWindow.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 07.02.25.
//

import SwiftUI
import SpriteKit

struct RendererWindow: View {
    @EnvironmentObject var environment: SharedEnvironment

    var drag: some Gesture {
        DragGesture()
            .onChanged { value in
                print(value)
            }
    }

    var body: some View {
        NavigationStack {
            if let roomManager = environment.roomManager {
                ZStack (alignment: .topLeading) {
                    ZStack {
                        ForEach(roomManager.graph?.nodes ?? [], id: \.id) { node in
                            Circle()
                                .fill(.blue)
                                .overlay {
                                    Text(node.title)
                                        .font(.system(size: node.radius / 5 + 3))
                                        .foregroundStyle(.white)
                                        .bold()
                                        .multilineTextAlignment(.center)
                                }
                                .position(
                                    CGPoint(
                                        x: node.position.x,
                                        y: node.position.y
                                    )
                                )
                                .frame(
                                    width: node.radius * 2,
                                    height: node.radius * 2
                                )



                        }
                        //                SpriteView(scene: roomManager.scene)
                        //                    .edgesIgnoringSafeArea(.all)
                        //                    .gesture(drag)

                    }
                    .position(
                        CGPoint(
                            x: 0,
                            y: 0
                        )
                    )
                    .scaleEffect(0.2)
                }.navigationTitle(roomManager.socketIOManager.socketStatus)
            } else {
                Text("No room selected.")
            }
        }
    }
}

#Preview() {
    @Previewable @Environment(\.colorScheme) var colorScheme

    func environem() -> SharedEnvironment {
        let env = SharedEnvironment()
        env.roomManager = RoomManager(environmentHandler: env.environmentHandler, roomId: "clwlvyp1rjpwvkw2wig89drs", colorScheme: colorScheme)
        return env
    }

    return RendererWindow().environmentObject(environem())
}
