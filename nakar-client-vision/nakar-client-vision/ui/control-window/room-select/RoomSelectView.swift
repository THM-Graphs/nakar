//
//  RoomSelectView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct RoomSelectView: View {
    let state: Loadable<ViewModel.BackendData>
    let onEnter: ((ViewModel.Room) -> Void)?
    let onRetry: (() -> Void)?

    var body: some View {
        VStack {
            switch state {
            case .nothing: EmptyView()
            case .data(let data):
                ScrollView {
                    VStack(spacing: 20) {
                        AppLogoView()
                        Text("Select a room to join:")
                        RoomList(rooms: data.rooms, onEnter: onEnter)
                            .padding([.leading, .trailing], 50)
                    }
                    .padding([.top, .bottom], 20)
                }
            case .loading:
                ProgressView()
            case .error(let error):
                VStack(spacing: 20) {
                    Text(error.localizedDescription)
                        .foregroundStyle(.secondary)
                    Button(action: {
                        onRetry?()
                    }) {
                        Label("Retry", systemImage: "arrow.clockwise.circle")
                    }
                }.padding(20)
            }
        }
        .navigationTitle("NAKAR")
    }
}

#Preview() {
    RoomSelectView(
        state: .data(data: ViewModel.BackendData.demoData()),
        onEnter: nil,
        onRetry: nil
    )
}
#Preview() {
    RoomSelectView(state: .loading, onEnter: nil, onRetry: nil)
}
#Preview() {
    RoomSelectView(state: .error(error: CancellationError()), onEnter: nil, onRetry: nil)
}
