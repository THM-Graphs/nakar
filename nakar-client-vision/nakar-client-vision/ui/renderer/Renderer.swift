//
//  Renderer.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct Renderer: View {
    @Environment(SharedEnvironment.self) var sharedEnvironment: SharedEnvironment

    @State var scale = 0.01

    var body: some View {
        if let roomManager = sharedEnvironment.roomManagers.values.first {
            VStack {
                ForEach(roomManager.physicalGraph.nodes, id: \.id) { node in
                    ZStack {
                        Circle()
                            .foregroundStyle(.blue)
                        Text(node.title)
                            .foregroundStyle(.white)
                    }
                }
            }.padding(.bottom, 400).background(.red)
        } else {
            EmptyView()
        }
    }
}
