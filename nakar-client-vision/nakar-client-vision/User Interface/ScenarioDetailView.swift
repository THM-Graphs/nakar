//
//  ScenarioDetailView.swift
//  nakar-client-vision
//
//  Created by Samuel Schepp on 25.03.25.
//

import SwiftUI

struct ScenarioDetailView: View {
    let scenario: ViewModel.Scenario

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                HStack(spacing: 20) {
                    ScenarioCoverView(scenario: scenario, size: 100)
                    VStack(alignment: .leading) {
                        Text(scenario.title)
                            .font(.largeTitle)
                            .lineLimit(1)
                        Text(scenario.id)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }
                LazyVGrid(columns: [
                    GridItem(.flexible(minimum: 0, maximum: .infinity), alignment: .top),
                    GridItem(.flexible(minimum: 0, maximum: .infinity), alignment: .top)
                ], spacing: 20) {
                    ScenarioDescriptionCardView(scenario: scenario)
                    ScenarioQueryCardView(scenario: scenario)
                }
                .frame(maxWidth: .infinity)
                Button {

                } label: {
                    Label("Run", systemImage: "play")
                }
            }
        }
        .safeAreaPadding(.leading, 20)
        .safeAreaPadding(.trailing, 20)
        .safeAreaPadding(.bottom, 100)
        .toolbar {
            Button {

            } label: {
                Label {
                    Text("Share")
                } icon: {
                    Image(systemName: "square.and.arrow.up")
                }

            }
            Button {
                
            } label: {
                Label {
                    Text("Run")
                } icon: {
                    Image(systemName: "play")
                }

            }
        }
        .navigationTitle(scenario.title)
    }
}

#Preview(windowStyle: .automatic) {
    ScenarioDetailView(scenario: ViewModel.Scenario.demoData()[0])
}
#Preview(windowStyle: .automatic) {
    ScenarioDetailView(scenario: ViewModel.Scenario(id: "id", title: "Title"))
}
#Preview(windowStyle: .automatic) {
    let cypherQuery = """
// 1️⃣ Personen (Nodes) erstellen
CREATE 
  (alice:Person {name: "Alice", age: 29, city: "Berlin"}),
  (bob:Person {name: "Bob", age: 34, city: "Hamburg"}),
  (carol:Person {name: "Carol", age: 27, city: "München"}),
  (dave:Person {name: "Dave", age: 31, city: "Berlin"}),
  (eve:Person {name: "Eve", age: 26, city: "Stuttgart"})

// 2️⃣ Freundschaften (Relationships) definieren
CREATE 
  (alice)-[:FRIEND_OF]->(bob),
  (bob)-[:FRIEND_OF]->(carol),
  (carol)-[:FRIEND_OF]->(dave),
  (dave)-[:FRIEND_OF]->(eve),
  (alice)-[:FRIEND_OF]->(eve)

// 3️⃣ Interessen hinzufügen
CREATE 
  (tech:Interest {name: "Technology"}),
  (music:Interest {name: "Music"}),
  (sports:Interest {name: "Sports"})

CREATE 
  (alice)-[:INTERESTED_IN]->(tech),
  (bob)-[:INTERESTED_IN]->(music),
  (carol)-[:INTERESTED_IN]->(sports),
  (dave)-[:INTERESTED_IN]->(tech),
  (eve)-[:INTERESTED_IN]->(music)

// 4️⃣ Beiträge (Posts) von Nutzern erstellen
CREATE 
  (post1:Post {content: "Neo4j is amazing!", date: date('2024-03-23')}),
  (post2:Post {content: "I love music festivals!", date: date('2024-03-20')}),
  (post3:Post {content: "Football is life!", date: date('2024-03-18')})

CREATE 
  (alice)-[:POSTED]->(post1),
  (bob)-[:POSTED]->(post2),
  (carol)-[:POSTED]->(post3)

// 5️⃣ Likes (Beziehungen) hinzufügen
CREATE 
  (bob)-[:LIKED]->(post1),
  (carol)-[:LIKED]->(post2),
  (dave)-[:LIKED]->(post3),
  (eve)-[:LIKED]->(post1)

// 6️⃣ 🔍 Abfrage: Personen mit gemeinsamen Interessen und Freunden finden
MATCH (p:Person)-[:FRIEND_OF]-(friend)-[:INTERESTED_IN]->(interest)
RETURN p.name AS Person, COLLECT(DISTINCT friend.name) AS Friends, COLLECT(DISTINCT interest.name) AS Interests
ORDER BY p.name
"""

    ScenarioDetailView(scenario: ViewModel.Scenario(id: "id", title: "Title", description: "Kaiser Friedrich III. war eine der tragischsten Figuren der deutschen Geschichte. Geboren am 18. Oktober 1831 als Sohn von Wilhelm I., wurde er als aufgeklärter, liberal gesinnter Thronfolger betrachtet. Schon früh zeigte er Interesse an Reformen und einer konstitutionellen Monarchie nach britischem Vorbild. Seine Heirat mit der britischen Prinzessin Victoria verstärkte diese Tendenzen, da sie ihn in seinem Streben nach einer moderneren Staatsführung unterstützte. Doch während seiner Zeit als Kronprinz stand er im Schatten seines Vaters und des konservativen Kanzlers Otto von Bismarck, die seine Reformideen skeptisch betrachteten.\n\nSein eigentliche Regierungszeit als Deutscher Kaiser begann am 9. März 1888, doch sie währte nur 99 Tage. Bereits vor seiner Thronbesteigung war er schwer an Kehlkopfkrebs erkrankt, was seine politischen Handlungsmöglichkeiten stark einschränkte. Die Krankheit wurde von seinen Ärzten lange falsch diagnostiziert und unzureichend behandelt, sodass er am Ende kaum mehr sprechen konnte. Trotz seiner fortschrittlichen Ideen hatte er in dieser kurzen Zeit keine Möglichkeit, tiefgreifende Veränderungen im Deutschen Reich durchzusetzen. Seine Herrschaft blieb eine ungenutzte Chance für eine liberalere Entwicklung des Landes. \n\n Nach seinem Tod am 15. Juni 1888 folgte ihm sein Sohn Wilhelm II. auf den Thron, der einen ganz anderen Kurs verfolgte. Während Friedrich III. für Reformen und eine konstitutionelle Monarchie stand, neigte Wilhelm II. zu Autoritarismus und einem aggressiven außenpolitischen Kurs. Viele Historiker spekulieren, dass Deutschland eine andere Entwicklung genommen hätte, wenn Friedrich länger regiert hätte. So bleibt sein kurzes Kaisertum ein faszinierendes „Was-wäre-wenn“ der deutschen Geschichte, das bis heute in historischen Debatten nachhallt.", query: cypherQuery))
}
