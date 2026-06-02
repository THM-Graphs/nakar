# Example Database

## Contribution Guide

### Run the database locally

```shell
npm run build:docker
```

```shell
npm run start:docker
```

## Contents

This dataset demonstrates the following NAKAR features:

### Automatic
- Multiple Labels: Nodes can have multiple labels.
- Many Labels: Query results can return multiple labels by collecting the label names of all returned nodes.
- Loops: Relationships can use the same node as both source and target.

### Config
- Common Properties: If different databases use shared property classes such as GND or QID (Wikidata), NAKAR should create a virtual connection between nodes with matching values for those properties.
- Parameters in Scenarios: Scenarios can define parameters with different data types.

### Canvas Actions
- Shortest Path: Query the shortest path between two or more nodes.

### Post Scenario Actions
- Connect Result Nodes: Query relationships between all visible nodes.
- Layout Nodes as Circle: Arrange all nodes of a label in a circle with a given radius.
- Layout Nodes as Hierarchy: Arrange all nodes in a hierarchy based on a given relationship type.
- Compress Nodes: Cluster all nodes that share the same neighbors and labels.
- Compress Relationships: Combine all relationships with the same source, target, and type into a relationship cluster.
- Relationship Cluster Size: Define how wide a relationship cluster line can become based on cluster size.
- Grow Nodes Based on Degree: Increase a node's size when it has a high degree.
- Set Node Color: Set the color of a label.
- Set Node Title Property: For a given label, define which property should be used as the node's title.
- Set Relationship Color: Color a given relationship type.
- Set Relationship Width: Change the width of the line for a given relationship type.
