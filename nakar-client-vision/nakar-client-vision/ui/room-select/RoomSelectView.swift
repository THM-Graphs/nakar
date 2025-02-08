//
//  RoomSelectView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 08.02.25.
//

import SwiftUI

struct RoomSelectView: View {
    let rooms: Loadable<[ViewModel.Room]>
    let onEnter: ((ViewModel.Room) -> Void)? = nil
    let onRetry: (() -> Void)? = nil

    var body: some View {
        NavigationStack {
            VStack {
                switch rooms {
                case .nothing: EmptyView()
                case .data(let data):
                    ScrollView {
                        VStack(spacing: 20) {
                            AppLogoView()
                            Text("Select a room to join:")
                            RoomsView(rooms: data, onEnter: onEnter)
                                .padding([.leading, .trailing], 50)
                        }
                        .padding([.top, .bottom], 20)
                    }
                case .loading:
                    ProgressView()
                case .error(let error):
                    VStack(spacing: 20) {
                        Text(error.localizedDescription)
                        Button("Retry") {
                            onRetry?()
                        }
                    }
                }
            }
            .navigationTitle("NAKAR")
        }
    }
}

#Preview() {
    RoomSelectView(rooms: .data(data: ViewModel.Room.demoData()))
}
#Preview() {
    RoomSelectView(rooms: .loading)
}
#Preview() {
    RoomSelectView(rooms: .error(error: CancellationError()))
}
