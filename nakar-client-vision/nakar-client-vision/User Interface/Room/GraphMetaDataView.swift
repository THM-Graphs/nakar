//
//  GraphMetaDataView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 26.03.25.
//

import SwiftUI
import Flow

struct GraphMetaDataView: View {
    @Environment(NakarApplication.self) var nakarApplication: NakarApplication
    @Environment(\.openWindow) var openWindow

    let graph: Components.Schemas.Graph

    var tableDataEntryCount: Int {
        graph.tableData.count
    }

    var tableDataColumns: [String]? {
        graph.tableData.first?.additionalProperties.keys.map { $0 }
    }

    var body: some View {
        ScrollView {
            CardView {
                HStack(spacing: 20) {
                    Text("Scenario")
                        .foregroundStyle(.secondary)
                    Spacer()
                    if let scenarioTitle = graph.metaData.scenarioInfo.title {
                        Text(scenarioTitle)
                    } else {
                        Text("None")
                            .foregroundStyle(.secondary)
                            .italic()
                    }
                }
            }
            CardView {
                HStack(alignment: .top, spacing: 20) {
                    Text("Labels")
                        .foregroundStyle(.secondary)
                    Spacer()
                    HFlow {
                        ForEach(graph.metaData.labels, id: \.label) { label in
                            VStack {
                                Text("\(label.label) (\(label.count))")
                            }
                            .padding(.leading, 20)
                            .padding(.trailing, 20)
                            .padding(.top, 10)
                            .padding(.bottom, 10)
                            .background {
                                Color(nakarApplication.colorService.colorOfLabel(label: label))
                            }
                            .clipShape(.capsule)
                            .glassBackgroundEffect()
                        }
                    }
                }
            }
            Button {
                openWindow(id: "tabledata")
            } label: {
                CardView(hover: true) {
                    VStack(alignment: .leading, spacing: 20) {
                        Text("Table Data")
                            .foregroundStyle(.secondary)
                        Text("\(graph.tableData.count) Rows")
                        if let keys = tableDataColumns {
                            HFlow {
                                ForEach(keys, id: \.self) { key in
                                    VStack {
                                        Text(key)
                                            .monospaced()
                                    }
                                    .padding(.leading, 10)
                                    .padding(.trailing, 10)
                                    .padding(.top, 5)
                                    .padding(.bottom, 5)
                                    .background(.thickMaterial)
                                    .clipShape(.capsule)
                                }
                            }
                        }
                        HStack {
                            Spacer()
                            Text("Show data")
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .buttonStyle(.plain)
        }
        .safeAreaPadding(.leading, 10)
        .safeAreaPadding(.trailing, 20)
        .safeAreaPadding(.bottom, 100)
    }
}

#Preview(windowStyle: .automatic) {
    GraphMetaDataView(
        graph: Components.Schemas.Graph(
            nodes: [],
            edges: [],
            metaData: Components.Schemas.GraphMetaData(
                labels: [
                    Components.Schemas.GraphLabel(
                        label: "Entity",
                        color: Components.Schemas.Color.presetColor(
                            Components.Schemas.PresetColor(index: ._0)
                        ),
                        count: 4
                    ),
                    Components.Schemas.GraphLabel(
                        label: "Person",
                        color: Components.Schemas.Color.presetColor(
                            Components.Schemas.PresetColor(index: ._1)
                        ),
                        count: 6
                    )
                ],
                scenarioInfo: Components.Schemas.ScenarioInfo(
                    id: "ID",
                    title: "Kaise Friedrich"
                )
            ),
            tableData: Components.Schemas.Graph.TableDataPayload.init()
        )
    ).environment(NakarApplication())
}
