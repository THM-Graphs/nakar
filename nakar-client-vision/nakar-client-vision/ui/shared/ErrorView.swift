//
//  ErrorView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct ErrorView: View {
    let error: Error
    let onReload: (() -> Void)?

    var body: some View {
        VStack(spacing: 20) {
            ScrollView {
                Text(error.localizedDescription)
                    .foregroundStyle(.secondary)
                    .padding(20)
            }
            .frame(width: 400, height: 200)
                .background(.regularMaterial)
                .clipShape(.rect(cornerRadius: 20))
            Button(action: {
                onReload?()
            }) {
                Label("Retry", systemImage: "arrow.clockwise.circle")
            }
        }
        .padding(20)
    }
}

#Preview {
    ErrorView(error: CancellationError(), onReload: nil)
}
