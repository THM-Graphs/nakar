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
1. Multiple Labels: Nodes can have multiple labels at the same time. For example, a node can be both Person and Author, or both Place and HistoricalLocation.
2. Many Labels: Query results contain nodes with many different labels. NAKAR collects the label names of all returned nodes and makes them available for visualization, filtering, configuration, and styling.
3. Loops: Relationships can use the same node as both source and target. This means that a relationship may start and end at the same node.

### Config
4. Common Properties: Queries from different data sources can be shown together on the same workspace. If nodes from different databases share configured property classes such as GND, QID, Wikidata ID, VIAF, or another external identifier, NAKAR creates virtual visual connections between nodes with matching values. These connections exist only on the workspace and do not modify the underlying databases.
5. Parameters in Scenarios: Scenarios define parameters that users fill in before or during execution. Supported parameter data types are String, Number, JSON, Start Date Time, and End Date Time.

### Canvas Actions
6. Shortest Path: NAKAR queries the shortest path between two or more selected nodes. The resulting path is added to the current workspace and visualized together with the already visible nodes.

### Post Scenario Actions
7. Connect Result Nodes: After a scenario has returned nodes, NAKAR queries relationships between all currently visible nodes and adds the missing relationships to the workspace.
8. Layout Nodes as Circle: NAKAR arranges all nodes of a selected label in a circle with a given radius. This makes groups of nodes visually clearer.
9. Layout Nodes as Hierarchy: NAKAR arranges nodes in a hierarchy based on one selected relationship type. There is no manually selected root node. Since only one relationship type is used, the visible graph may contain multiple independent subgraphs and therefore multiple root nodes.
10. Compress Nodes: NAKAR clusters nodes that are structurally equivalent. Nodes are compressed only if they have exactly the same labels and exactly the same neighbors.
11. Compress Relationships: NAKAR combines relationships with the same source node, target node, and relationship type into a relationship cluster.
12. Relationship Cluster Size: NAKAR defines how wide a relationship cluster line becomes based on the number of relationships in the cluster.
13. Grow Nodes Based on Degree: NAKAR increases the visual size of nodes with a high degree. Nodes with many visible relationships become larger than nodes with fewer relationships.
14. Set Node Color: NAKAR sets the color of all nodes with a given label.
15. Set Node Title Property: For a given label, NAKAR defines which property is used as the visible title of the node.
16. Set Relationship Color: NAKAR sets the color of a given relationship type.
17. Set Relationship Width: NAKAR changes the width of the line for a given relationship type.
