//
//  SelectRoomView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 23.03.25.
//

import SwiftUI

struct SelectRoomView: View {
    let rooms: [ViewModel.Room]
    let onRoomSelected: (ViewModel.Room) -> Void

    var body: some View {
        ZStack {
            Image("Wallpaper1")
                .resizable()
                .edgesIgnoringSafeArea(.all)
            ScrollView {
                VStack(spacing: 20) {
                    Text("NAKAR")
                        .font(.extraLargeTitle)
                        .padding(80)
                    CardView {
                        HStack(alignment: .top, spacing: 20) {
                            Text("Serendipitäre Entdeckungen in hochvernetzten Knowledge-Grafen ermöglichen unerwartete Einsichten. Während klassische Suchalgorithmen gezielt nach Fakten suchen, offenbaren komplexe Netzwerke verborgene Zusammenhänge. Besonders in interdisziplinären Forschungsfeldern führen solche Entdeckungen zu neuen Hypothesen und Innovationen.")
                            Text("Schwache Signale im Graphen spielen dabei eine zentrale Rolle. Randbereiche enthalten oft wenig erkundete, aber vielversprechende Informationen. Machine-Learning-Algorithmen können solche Verbindungen aufdecken, etwa zwischen Proteinstrukturen und Materialwissenschaft.")
                            Text("Die Herausforderung liegt im Gleichgewicht zwischen Struktur und Offenheit. Zu strikte Algorithmen verhindern Entdeckungen, zu viele Zufallsverknüpfungen mindern die Relevanz. KI-gestützte Systeme verbessern kontinuierlich die Fähigkeit, wertvolle, unerwartete Erkenntnisse zu liefern.")
                        }
                    }
                    LazyVGrid(
                        columns: [
                            GridItem(.adaptive(minimum: 300, maximum: 400), spacing: 20)
                        ]
                    ) {
                        ForEach(rooms) { room in
                            Button {
                                onRoomSelected(room)
                            } label: {
                                RoomCard(room: room)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.bottom, 20)
                }
            }
            .safeAreaPadding(.top, 200)
            .safeAreaPadding(.bottom, 200)
            .safeAreaPadding(.leading, 50)
            .safeAreaPadding(.trailing, 50)
        }
    }
}

#Preview(windowStyle: .automatic) {
    let demoFactory = DemoFactoryService()
    NavigationStack {
        SelectRoomView(rooms: demoFactory.rooms(), onRoomSelected: { _ in })
    }
}
