---
Priority: ❗
Description: I want to find nodes in the entire database by using simple text search so that I can find an entry point into the graph.
Implemented: false
Roles:
  - "[[👔 Owner]]"
  - "[[🧑‍💻 Collaborator]]"
  - "[[🥷 Outsider]]"
  - "[[🌐 Anonymous]]"
Persona:
  - "[[👁️ KG Consumer]]"
---

## Acceptance criteria

- [x] The user can search a canvas database and see matching nodes.
- [x] In Neo4j, property search uses indexed properties.
- [x] Neo4j uses online RANGE indexes for property equality and TEXT indexes for CONTAINS matches.
- [ ] Neo4j also supports the required equality search using LOOKUP indexes.
