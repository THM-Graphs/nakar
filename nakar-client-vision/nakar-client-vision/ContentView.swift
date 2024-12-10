//
//  ContentView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 10.12.24.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationView {
            ScenariosView()
            Text("Select a scenario.")
        }
    }
}

#Preview() {
    ContentView()
}
