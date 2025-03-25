//
//  Card.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 25.03.25.
//

import SwiftUI

struct Card<Content: View>: View {
    let padding: CGFloat
    let hover: Bool
    @ViewBuilder let content: () -> Content

    init(padding: CGFloat = 20, hover: Bool = false, @ViewBuilder content: @escaping () -> Content) {
        self.padding = padding
        self.hover = hover
        self.content = content
    }

    var body: some View {
        content()
            .padding(padding)
            .background(.regularMaterial)
            .hoverEffect(.highlight, isEnabled: hover)
            .clipShape(.rect(cornerRadius: 20))
    }
}

#Preview(windowStyle: .automatic) {
    Card {
        VStack {
            Text("Content 1")
            Text("Content 2")
        }
    }
    Card(padding: 0) {
        VStack {
            Text("Content 1")
            Text("Content 2")
        }
    }
}
