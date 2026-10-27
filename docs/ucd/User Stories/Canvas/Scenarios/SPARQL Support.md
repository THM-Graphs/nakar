---
Priority: ❗❗
Implemented: false
Description: As a 🔍 KG Analyst,I want to create scenarios that query SPARQL-based RDF databases, so that I can directly access up-to-date knowledge graphs like Wikidata without relying on outdated Neo4j instances.
---

## Akzeptanzkriterien

- SPARQL-Endpunkte integrierbar
    - Konfiguration externer SPARQL-Endpoint-URLs (z. B. Wikidata, NFDI4Culture)
    - Unterstützung optionaler Authentifizierung
- SPARQL-Abfragen definierbar
    - Erstellung und Speicherung von SPARQL-Queries im Scenario-Editor
    - Syntax-Highlighting und Validierung
- Datenabruf und Transformation
    - SPARQL-SELECT-Queries liefern korrekt strukturierte Ergebnisse
    - RDF-Daten werden automatisch in ein internes Graphmodell überführt
- Visualisierung im bestehenden Graph-Viewer
    - Darstellung als Labeled Property Graph
    - Interaktive Exploration wie bei Neo4j-Daten
- Schema-Mapping konfigurierbar
    - Mapping von RDF-Prädikaten auf Labels und Properties konfigurierbar

## Vorgehensweise

CONSTRUCT-Queries nutzen.