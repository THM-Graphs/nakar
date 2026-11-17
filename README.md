[![CI](https://github.com/THM-Graphs/nakar/actions/workflows/ci.yml/badge.svg)](https://github.com/THM-Graphs/nakar/actions/workflows/ci.yml)

<div align="center">
<img src="docs/media/appicon.png" width="200px">
<h1>NAKAR</h1>
</div>

NAKAR is a collaborative application for exploring graph data in real time.

See https://go.thm.de/nakar.

## Local setup

1. Start the POLE database ([nakar-db-pole](./nakar-db-pole/README.md))
1. Start the Examples database ([nakar-db-examples](./nakar-db-examples/README.md))
1. Start the server ([nakar-server](./nakar-server/README.md))
1. Start the web application ([nakar-client-web](./nakar-client-web/README.md))

## Architecture

```mermaid
flowchart TB
    pole[("nakar-db-pole")]
    examples[("nakar-db-examples")]
    other[("Any Neo4j databases")]
    sparql[("Any SPARQL database")]

    subgraph server["nakar-server"]
        direction LR
        db[("Database")]
        scenarios["Scenarios"]
    end

    subgraph web["nakar-client-web"]
        webApp["Web Application"]
    end

    subgraph ar["nakar-client-ar"]
        arApp["AR Application"]
    end

    pole <-->|Cypher| server
    examples <-->|Cypher| server
    other <-->|Cypher| server
    sparql <-->|SPARQL| server
    server <-->|"HTTP & WS"| web
    server <-->|"HTTP & WS"| ar

```
