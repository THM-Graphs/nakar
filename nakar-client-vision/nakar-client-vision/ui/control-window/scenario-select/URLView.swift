//
//  URLView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct URLView: View {
    let url: String

    var body: some View {
        Text(url)
            .padding([.leading, .trailing], 20)
            .padding([.top, .bottom], 10)
            .background(.regularMaterial)
            .clipShape(.capsule)
    }
}

#Preview {
    URLView(url: "http://wikipedia.org")
}
