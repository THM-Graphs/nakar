import z from 'zod';
import { SSet } from '../../../packages/set/Set';
import { LiveCanvasNoteAuthor } from './LiveCanvasNoteAuthor';
import type { DatabaseService } from '../../database/DatabaseService';
import { LiveCanvasNoteNodeReference } from './LiveCanvasNoteNodeReference';
import type { LiveCanvas } from '../LiveCanvas';
import type { GraphNode } from '../graph/GraphNode';
import type { Modules } from '@strapi/types';

export class LiveCanvasNote {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    content: z.string(),
    nodes: z.array(LiveCanvasNoteNodeReference.schema),
    author: LiveCanvasNoteAuthor.schema.nullable(),
    dateTime: z.coerce.date().nullable(),
  });

  public readonly id: string;
  public readonly content: string;
  public readonly nodes: SSet<LiveCanvasNoteNodeReference>;
  public readonly author: LiveCanvasNoteAuthor | null;
  public readonly dateTime: Date | null;

  public constructor(data: {
    id: string;
    content: string;
    nodes: SSet<LiveCanvasNoteNodeReference>;
    author: LiveCanvasNoteAuthor | null;
    dateTime: Date | null;
  }) {
    this.id = data.id;
    this.content = data.content;
    this.nodes = data.nodes;
    this.author = data.author;
    this.dateTime = data.dateTime;
  }

  public static fromPlain(
    data: z.infer<typeof LiveCanvasNote.schema>,
  ): LiveCanvasNote {
    return new LiveCanvasNote({
      id: data.id,
      content: data.content,
      nodes: new SSet(
        data.nodes.map(
          (
            n: z.infer<typeof LiveCanvasNoteNodeReference.schema>,
          ): LiveCanvasNoteNodeReference =>
            LiveCanvasNoteNodeReference.fromPlain(n),
        ),
      ),
      author:
        data.author != null
          ? LiveCanvasNoteAuthor.fromPlain(data.author)
          : null,
      dateTime: data.dateTime,
    });
  }

  public static async fromDb(
    note: Modules.Documents.Result<'api::note.note'>,
    database: DatabaseService,
    canvas: LiveCanvas,
  ): Promise<LiveCanvasNote> {
    const nodes: Modules.Documents.Result<'api::node-reference.node-reference'>[] =
      await database.getReferencedNodesOfNote(note);
    const author: Modules.Documents.Result<'plugin::users-permissions.user'> | null =
      await database.getAuthorOfNote(note);

    const nodeReferences: LiveCanvasNoteNodeReference[] = nodes.reduce<
      LiveCanvasNoteNodeReference[]
    >(
      (
        akku: LiveCanvasNoteNodeReference[],
        next: Modules.Documents.Result<'api::node-reference.node-reference'>,
      ): LiveCanvasNoteNodeReference[] => {
        if (next.nodeId == null) {
          return akku;
        }
        const node: GraphNode | null = canvas.getGraph().nodes.get(next.nodeId);
        if (node == null) {
          return akku;
        }
        const nodeReference: LiveCanvasNoteNodeReference =
          new LiveCanvasNoteNodeReference({
            id: node.id,
            nativeId: node.nativeId,
            sourceId: node.sourceId,
            labels: node.labels,
            title: node.getTitle(canvas.data.viewSettings),
          });
        return [...akku, nodeReference];
      },
      [],
    );

    return new LiveCanvasNote({
      id: note.documentId,
      content: note.content ?? '',
      nodes: new SSet(nodeReferences),
      author:
        author != null
          ? new LiveCanvasNoteAuthor({
              id: author.documentId,
              username: author.username ?? null,
            })
          : null,
      dateTime: note.updatedAt != null ? new Date(note.updatedAt) : null,
    });
  }

  public toPlain(): z.infer<typeof LiveCanvasNote.schema> {
    return {
      id: this.id,
      content: this.content,
      nodes: this.nodes
        .toArray()
        .map(
          (
            n: LiveCanvasNoteNodeReference,
          ): z.infer<typeof LiveCanvasNoteNodeReference.schema> => n.toPlain(),
        ),
      author: this.author?.toPlain() ?? null,
      dateTime: this.dateTime,
    };
  }

  public copy(): LiveCanvasNote {
    return new LiveCanvasNote({
      id: this.id,
      content: this.content,
      nodes: this.nodes.map(
        (n: LiveCanvasNoteNodeReference): LiveCanvasNoteNodeReference =>
          n.copy(),
      ),
      author: this.author?.copy() ?? null,
      dateTime: this.dateTime,
    });
  }
}
