//
//  AppLogoView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import SwiftUI
import NakarKit

struct AppLogoView: View {
    var body: some View {
        VStack(alignment: .center) {
            AppIconView()
                .frame(width: 100, height: 100)
            Text("NAKAR").font(.headline)
        }
    }
}

#Preview() {
    AppLogoView()
}
