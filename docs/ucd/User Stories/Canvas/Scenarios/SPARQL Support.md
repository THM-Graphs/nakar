---
Priority: ❗❗
Implemented: false
Description: As a 🔍 KG Analyst, I want to create scenarios that query SPARQL-based RDF databases so that I can directly access up-to-date knowledge graphs like Wikidata without relying on outdated Neo4j instances.
---

## Acceptance criteria

- SPARQL endpoint integration
    - Configuration of external SPARQL endpoint URLs (e.g., Wikidata, NFDI4Culture)
    - Support for optional authentication
- SPARQL query definition
    - Creation and storage of SPARQL queries in the scenario editor
    - Syntax highlighting and validation
- Data retrieval and transformation
    - SPARQL SELECT queries return correctly structured results
    - RDF data is automatically converted into an internal graph model
- Visualization in the existing graph viewer
    - Representation as a labeled property graph
    - Interactive exploration as with Neo4j data
- Configurable schema mapping
    - Configurable mapping of RDF predicates to labels and properties

## Approach

Use CONSTRUCT queries.
