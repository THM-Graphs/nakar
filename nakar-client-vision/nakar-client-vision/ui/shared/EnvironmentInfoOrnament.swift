//
//  EnvironmentInfoView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

#if os(visionOS)
struct EnvironmentInfoOrnament: View {
    @Environment(NakarController.self) var environment: NakarController

    var mode: String {
        switch NakarController.Mode.current {
        case .development: "Development"
        case .production: "Production"
        }
    }

    var body: some View {
        HStack {
            Group {
                Text(environment.environmentDebugString)
            }
            .padding([.leading, .trailing], 20)
            .frame(height: 44)
            .font(.footnote)
            .glassBackgroundEffect()
        }
    }
}

#Preview {
    EnvironmentInfoOrnament()
        .environment(NakarController())
}
#endif
