//
//  EnvironmentInfoView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct EnvironmentInfoOrnament: View {
    @Environment(SharedEnvironment.self) var environment: SharedEnvironment

    var mode: String {
        switch SharedEnvironment.Mode.current {
        case .development: "Development"
        case .production: "Production"
        }
    }

    var body: some View {
        HStack {
            Group {
                Text("\(mode) (\(environment.releaseVersionNumber)-\(environment.buildVersionNumber))")
            }
            .padding([.leading, .trailing], 20)
            .frame(height: 44)
            .font(.footnote)
            #if os(visionOS)
            .glassBackgroundEffect()
            #endif
        }
    }
}

#Preview {
    EnvironmentInfoOrnament()
        .environment(SharedEnvironment())
}
