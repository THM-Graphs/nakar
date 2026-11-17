---
Priority: ❗❗
Implemented: true
Description: I want to unlock a position-locked node so that it will float with other nodes in the force-directed layout because I am no longer interested in the node and I don't care about its position.
Roles:
  - "[[👔 Owner]]"
  - "[[🧑‍💻 Collaborator]]"
  - "[[🥷 Outsider]]"
  - "[[🌐 Anonymous]]"
Persona:
  - "[[👁️ KG Consumer]]"
---

## Acceptance criteria

- [x] The user can unlock a position-locked node.
- [x] The force-directed layout runs for one second after unlocking.

## Context

Design concern: Unlocking should produce a visible layout change. In Neo4j Browser it can appear to have no effect when the simulation does not resume.
