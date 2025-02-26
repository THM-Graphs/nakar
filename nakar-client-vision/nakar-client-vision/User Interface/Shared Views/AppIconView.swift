//
//  AppIconView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 10.02.25.
//

import SwiftUI

public struct AppIconView: View {
    public init() {
        
    }

    public var body: some View {
        Image("Generic App Icon")
            .resizable()
            .scaledToFit()
    }
}

#Preview {
    AppIconView()
}
