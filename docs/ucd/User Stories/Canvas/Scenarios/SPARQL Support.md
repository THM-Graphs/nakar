---
Priority: ❗❗
Implemented: false
Description: As a 🔍 KG Analyst, I want to create scenarios that query SPARQL-based RDF databases so that I can directly access up-to-date knowledge graphs like Wikidata without relying on outdated Neo4j instances.
Roles:
  - "[[👔 Owner]]"
  - "[[🧑‍💻 Collaborator]]"
---

## Acceptance criteria

- [x] The user can configure an external SPARQL endpoint such as Wikidata or NFDI4Culture.
- [ ] The connection supports optional endpoint authentication through configured credentials.
- [x] The scenario editor accepts and saves queries for SPARQL connections.
- [ ] The editor provides SPARQL-specific syntax highlighting and validation.
- [x] SPARQL SELECT queries configured as table queries return structured rows.
- [x] CONSTRUCT results are converted to a labeled property graph.
- [x] The user can interactively explore RDF-derived graphs in the canvas viewer.
- [ ] The user can configure mappings from RDF predicates to labels and properties.
