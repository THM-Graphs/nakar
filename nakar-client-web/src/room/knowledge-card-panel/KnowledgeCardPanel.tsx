import { Panel } from "../../shared/elements/Panel.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { NodeDto } from "api-client";
import { NodeDetailsKnowledgeCard } from "./NodeDetailsKnowledgeCard.tsx";
import { useMemo } from "react";
import { match, P } from "ts-pattern";

export function KnowledgeCardPanel() {
  const knowledgeCard = useBearStore((s) => s.room.panels.knowledgeCard);
  const selectedElements = useBearStore((s) => s.room.panels.inspector.element);
  const graphElements = useBearStore((s) => s.room.scenario.graph.elements);

  const selectedNode: NodeDto | null = useMemo((): NodeDto | null => {
    if (selectedElements.length !== 1) {
      return null;
    }
    const node = graphElements.nodes.find((n) => n.id === selectedElements[0]);
    return node ?? null;
  }, [selectedElements, graphElements]);

  return (
    <Panel
      direction={"right"}
      onClose={() => {
        knowledgeCard.hide();
      }}
      title={"Knowledge Card"}
    >
      {match(selectedNode)
        .with(P.nullish, () => <EmptyKnowledgeCard></EmptyKnowledgeCard>)
        .otherwise((node) => (
          <NodeDetailsKnowledgeCard node={node}></NodeDetailsKnowledgeCard>
        ))}
    </Panel>
  );
}

function EmptyKnowledgeCard() {
  return (
    <span className={"text-muted small fst-italic align-self-center p-5"}>
      Knowledge Card
    </span>
  );
}
