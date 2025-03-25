//
//  VersionOrnament.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 23.03.25.
//

import SwiftUI

struct VersionOrnament: View {
    let version: String

    var body: some View {
        VStack {
            Text(version)
        }
        .frame(height: 40)
        .padding(.leading, 20)
        .padding(.trailing, 20)
        .glassBackgroundEffect()
        .clipShape(.capsule)
    }
}

#Preview {
    VersionOrnament(version: "1.0.0-100")
}
