//
//  URLView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct URLView: View {
    let url: String?

    var body: some View {
        #if os(visionOS)
        Text(url)
            .padding([.leading, .trailing], 20)
            .padding([.top, .bottom], 10)
            .background(.regularMaterial)
            .clipShape(.capsule)
        #endif
        #if os(macOS)
        if let urlString = url, let acutalUrl = URL(string: urlString) {
            Link(destination: acutalUrl) {
                Text(urlString)
            }.pointerStyle(.link)
        } else {
            Text(url ?? "")
                .foregroundStyle(.secondary)
        }
        #endif
    }
}

#Preview {
    URLView(url: "http://wikipedia.org")
}
