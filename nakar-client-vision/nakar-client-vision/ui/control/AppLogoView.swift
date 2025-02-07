//
//  AppLogoView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 06.02.25.
//

import SwiftUI

struct AppLogoView: View {
    var body: some View {
        VStack(alignment: .center) {
            Image("Generic App Icon") // Use the asset name
                .resizable()       // Makes the image resizable
                .scaledToFit()     // Scales the image while maintaining aspect ratio
                .frame(width: 100, height: 100) // Set desired frame
            Text("NAKAR").font(.headline)
        }
    }
}

#Preview() {
    AppLogoView()
}
