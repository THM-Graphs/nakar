# Examples Database

## Contribution Guide

### Run the database locally

```shell
npm run build:docker
```

```shell
npm run start:docker
```

## Content

This data set demonstrates the following aspects of NAKAR:

### Automatic
- Multiple Labels: Nodes can have multiple labels.
- Many Labels: A query result can return various labels by collecting the label name of all returned nodes.
- Loops: Relationships can have the same node as source and target.

### Config
- Common Properties: If different databases uses common property classes like GND or QID (Wikidata), NAKAR should create a virtual connection between nodes with equal values on those properties.
- Parameters in Scenrarios: Scenarios can have parameters with various data types.

### Canvas Actions
- Shortest Path: Query the shortest path between two or more nodes.

### Post Scenario Actions
- Connect Result Nodes: Query relationships between all visible nodes.
- Layout Nodes as circle: Layout all nodes of a label in a circle with a given radius
- Layout Nodes as hierarchy: Layout all nodes as a hierarchy given a relation type
- Compress Nodes: Cluster all nodes that have the same neighbors and labels in a cluster 
- Compress Relationships: Compress all relationships with same source and target and type into a relationship cluster
- Relationship cluster size: Define how wide the line of a relationship cluster can get, based on cluster size
- Grow Nodes based on Degree: Let the node grow, if it has a high degree 
- Set Node Color: Set the color of a label.
- Set Node Title Property: For a given label, define which property should be used as the node's title.
- Set Relationship Color: Color a given relationship type.
- Set Relationship width: Change the width of the line for a given relationship type
