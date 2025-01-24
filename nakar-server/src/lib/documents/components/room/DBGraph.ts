import { DBNode } from './DBNode';
import { DBEdge } from './DBEdge';
import { DBLabel } from './DBLabel';
import { DBTableDataEntry } from './DBTableDataEntry';
import type { Result } from '@strapi/types/dist/modules/documents/result';
import { Input } from '@strapi/types/dist/modules/documents/params/data';

export class DBGraph {
  public readonly nodes: DBNode[];
  public readonly edges: DBEdge[];
  public readonly labels: DBLabel[];
  public readonly tableDataEntries: DBTableDataEntry[];

  public constructor(data: {
    nodes: DBNode[];
    edges: DBEdge[];
    labels: DBLabel[];
    tableDataEntries: DBTableDataEntry[];
  }) {
    this.nodes = data.nodes;
    this.edges = data.edges;
    this.labels = data.labels;
    this.tableDataEntries = data.tableDataEntries;
  }

  public static parse(
    db: Result<
      'room.graph',
      { populate: ['nodes', 'edges', 'labels', 'tableDataEntries'] }
    >,
  ): DBGraph {
    return new DBGraph({
      nodes: (db.nodes ?? []).map((n) => DBNode.parse(n)),
      edges: (db.edges ?? []).map((e) => DBEdge.parse(e)),
      labels: (db.labels ?? []).map((l) => DBLabel.parse(l)),
      tableDataEntries: (db.tableDataEntries ?? []).map((t) =>
        DBTableDataEntry.parse(t),
      ),
    });
  }

  public toDb(): Input<'room.graph'> {
    return {
      nodes: this.nodes.map((n) => n.toDb()),
      edges: this.edges.map((e) => e.toDb()),
      labels: this.labels.map((l) => l.toDb()),
      tableDataEntries: this.tableDataEntries.map((t) => t.toDb()),
    };
  }
}
