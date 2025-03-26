//
//  RoomScreen.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 24.03.25.
//

import SwiftUI

struct RoomScreen: View {
    @Environment(NakarApplication.self) var nakarApplication: NakarApplication
    @State var selectedScenario: ViewModel.Scenario? = nil

    var body: some View {
        if let room = nakarApplication.viewService.currentRoom {
            RoomView(
                databases: databases,
                room: room,
                selectedScenario: $selectedScenario,
                onRunScenario: { scenario in
                    nakarApplication.viewService.runScenario(scenario: scenario)
                },
                scenarioProgress: nakarApplication.viewService.scenarioProgress
            )
        } else {
            Text("Empty room")
        }
    }

    var databases: [ViewModel.Database] {
        switch nakarApplication.viewService.httpData {
        case .data(let data): return data.databases
        default: return []
        }
    }
}
