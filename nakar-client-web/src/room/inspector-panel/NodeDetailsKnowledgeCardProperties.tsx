import { NodeDto } from "../../../src-gen";
import { match, P } from "ts-pattern";
import { Stack } from "react-bootstrap";
import { Fragment, useMemo } from "react";
import { NodeDetailsKnowledgeCardEntryDisplay } from "./NodeDetailsKnowledgeCardEntryDisplay.tsx";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { NodeDetailsKnowledgeCardEntry } from "./NodeDetailsKnowledgeCardEntry.ts";

function unknownToStringList(input: unknown): string[] {
  return match(input)
    .with(P.string, (s) => [s])
    .with(P.number, (s) => [s.toString()])
    .with(P.boolean, (s) => [s ? "Yes" : "No"])
    .with(P.array(), (s) => s.flatMap((e) => unknownToStringList(e)))
    .otherwise(() => [JSON.stringify(input)]);
}

export function NodeDetailsKnowledgeCardProperties(props: { node: NodeDto }) {
  const elements = useBearStore((s) => s.room.scenario.graph.elements);
  const setElement = useBearStore((s) => s.room.panels.inspector.setElement);

  const properties: NodeDetailsKnowledgeCardEntry[] = useMemo(() => {
    return Object.entries(
      props.node.properties satisfies Record<string, unknown>,
    ).map((property) => ({
      title: property[0],
      values: unknownToStringList(property[1]).map((t) => ({
        id: t,
        title: t,
      })),
    }));
  }, [props.node.properties]);

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

  const allProperties = useMemo(() => {
    return [...properties, ...incomingEdges, ...outgoingEdges].sort((a, b) =>
      a.title.localeCompare(b.title),
    );
  }, [incomingEdges, outgoingEdges]);

  return (
    <>
      {properties.length > 0 && (
        <Stack className={"border-bottom"}>
          <DynamicList
            data={allProperties}
            filter={(e, a) => a.title.toLowerCase().includes(e.toLowerCase())}
            collapsable={false}
            render={(data) => (
              <>
                <Stack gap={0} className={"ps-2 pe-2 pt-2"}>
                  {data.map((property) => (
                    <Fragment key={property.title}>
                      <NodeDetailsKnowledgeCardEntryDisplay
                        entry={property}
                      ></NodeDetailsKnowledgeCardEntryDisplay>
                    </Fragment>
                  ))}
                </Stack>
              </>
            )}
            entityNamePlural={"Properties"}
          ></DynamicList>
        </Stack>
      )}
    </>
  );
}
