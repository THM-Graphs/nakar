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