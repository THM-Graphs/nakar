import { NodeDto } from "../../../src-gen";
import { Stack } from "react-bootstrap";
import { Fragment, useMemo } from "react";
import { NodeDetailsKnowledgeCardEntryDisplay } from "./NodeDetailsKnowledgeCardEntryDisplay.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { NodeDetailsKnowledgeCardEntry } from "./NodeDetailsKnowledgeCardEntry.ts";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";

export function NodeDetailsKnowledgeCardRelationships(props: {
  node: NodeDto;
}) {
  const elements = useBearStore((s) => s.room.scenario.graph.elements);
  const setElement = useBearStore((s) => s.room.panels.inspector.setElement);

  const outgoingEdges = useMemo((): NodeDetailsKnowledgeCardEntry[] => {
    return elements.edges
      .filter((e) => e.startNodeId === props.node.id)
      .reduce<NodeDetailsKnowledgeCardEntry[]>((acc, edge) => {
        const targetNode = elements.nodes.find((n) => n.id === edge.endNodeId);
        if (!targetNode) return acc;

        let entry = acc.find((e) => e.title === edge.type);
        if (!entry) {
          entry = { title: edge.type, values: [] };
          acc.push(entry);
        }

        entry.values.push({
          title: targetNode.title,
          onClick: () => {
            setElement(targetNode.id);
          },
          id: edge.id,
        });
        return acc;
      }, []);
  }, [elements, props.node]);

  const incomingEdges = useMemo((): NodeDetailsKnowledgeCardEntry[] => {
    return elements.edges
      .filter((e) => e.endNodeId === props.node.id)
      .reduce<NodeDetailsKnowledgeCardEntry[]>((acc, edge) => {
        const targetNode = elements.nodes.find(
          (n) => n.id === edge.startNodeId,
        );
        if (!targetNode) return acc;

        let entry = acc.find((e) => e.title === edge.type);
        if (!entry) {
          entry = { title: edge.type, values: [] };
          acc.push(entry);
        }

        entry.values.push({
          title: targetNode.title,
          onClick: () => {
            setElement(targetNode.id);
          },
          id: edge.id,
        });
        return acc;
      }, [])
      .map((entry) => ({
        ...entry,
        title: entry.title + " of",
      }));
  }, [elements, props.node]);

  const allEdges = useMemo(() => {
    return [...incomingEdges, ...outgoingEdges].sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }, [incomingEdges, outgoingEdges]);

  return (
    <Stack className={"border-bottom"}>
      <DynamicList
        data={allEdges}
        render={(data) => (
          <>
            <Stack gap={0} className={"ps-2 pe-2 pt-2"}>
              {data.map((outgoindEdge) => (
                <Fragment key={outgoindEdge.title}>
                  <NodeDetailsKnowledgeCardEntryDisplay
                    entry={outgoindEdge}
                  ></NodeDetailsKnowledgeCardEntryDisplay>
                </Fragment>
              ))}
            </Stack>
          </>
        )}
        entityNamePlural={"Relationships"}
        filter={(exp, v) => v.title.toLowerCase().includes(exp.toLowerCase())}
        collapsable={false}
      ></DynamicList>
    </Stack>
  );
}
