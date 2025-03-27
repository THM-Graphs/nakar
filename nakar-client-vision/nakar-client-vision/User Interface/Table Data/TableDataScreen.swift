//
//  TableDataScreen.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 26.03.25.
//

import SwiftUI

struct TableDataScreen: View {
    @Environment(NakarApplication.self) var nakarApplication: NakarApplication

    var columns: [GridItem] {
        return nakarApplication.viewService.graph?.tableData.first?.additionalProperties.keys.map { _ -> GridItem in
            return GridItem(.flexible(), spacing: 0, alignment: .topLeading)
        } ?? []
    }

    func getColumnHeaders(firstRow: Components.Schemas.Graph.TableDataPayloadPayload) -> [String] {
        return firstRow.additionalProperties.keys.map{$0}
    }

    func valuesOfRow(row: Components.Schemas.Graph.TableDataPayloadPayload) -> [String] {
        return row.additionalProperties.values.map { container in
            return stringRepresentationOfValue(value: container.value)
        }
    }

    func stringRepresentationOfValue(value: any Sendable) -> String {
        do {
            let data = try JSONSerialization.data(withJSONObject: value)
            guard let string = String(data: data, encoding: .utf8) else {
                return "null"
            }
            return string
        } catch let err {
            return "null"
        }
    }

    var body: some View {
        NavigationStack {
            VStack {
                if let tableData = nakarApplication.viewService.graph?.tableData, let firstRow = tableData.first {
                    LazyVGrid(columns: columns, spacing: 0) {
                        ForEach(getColumnHeaders(firstRow: firstRow), id: \.self) { key in
                            Text(key)
                                .foregroundStyle(.primary)
                                .bold()
                        }
                    }
                    .padding()
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 0) {
                            ForEach(tableData, id: \.hashValue) { row in
                                ForEach(valuesOfRow(row: row), id: \.self) { value in
                                    VStack(alignment: .leading, spacing: 10) {
                                        Divider()
                                            .foregroundColor(.white)
                                        Text(value)
                                            .monospaced()
                                            .font(.footnote)

                                    }
                                    .padding(.bottom, 10)
                                }
                            }
                        }
                        .padding(.top, 20)
                        .padding(.bottom, 100)
                    }
                    .padding(.leading, 20)
                    .padding(.trailing, 20)
                    .background(.thickMaterial)
                } else {
                    Text("No data")
                        .foregroundStyle(.secondary)
                        .italic()
                }
            }
            .toolbar {
                Text("\(nakarApplication.viewService.graph?.tableData.count ?? 0) Rows")
            }
            .navigationTitle(nakarApplication.viewService.graph?.metaData.scenarioInfo.title ?? "Table Data")
        }
    }
}
