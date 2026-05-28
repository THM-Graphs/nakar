import { NodeDto } from "api-client";
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
  const onCenter = useBearStore((s) => s.room.ui.rendererEvents.onCenter);

  const properties: NodeDetailsKnowledgeCardEntry[] = useMemo(() => {
    return Object.entries(
      props.node.properties satisfies Record<string, unknown>,
    )
      .map(
        (property): NodeDetailsKnowledgeCardEntry => ({
          title: property[0],
          type: "property",
          values: unknownToStringList(property[1]).map((t) => ({
            id: t,
            title: t,
          })),
        }),
      )
      .sort(
        (
          a: NodeDetailsKnowledgeCardEntry,
          b: NodeDetailsKnowledgeCardEntry,
        ): number => a.title.localeCompare(b.title),
      );
  }, [props.node.properties]);

  const outgoingEdges = useMemo((): NodeDetailsKnowledgeCardEntry[] => {
    return elements.edges
      .filter((e) => e.startNodeId === props.node.id)
      .reduce<NodeDetailsKnowledgeCardEntry[]>((acc, edge) => {
        const targetNode = elements.nodes.find((n) => n.id === edge.endNodeId);
        if (!targetNode) return acc;

        let entry = acc.find((e) => e.title === edge.type);
        if (!entry) {
          entry = {
            title: edge.type,
            values: [],
            type: "property",
          };
          acc.push(entry);
        }

        entry.values.push({
          title: targetNode.title,
          onClick: () => {
            setElement(targetNode.id);
            onCenter.next();
          },
          id: edge.id,
        });

        return acc.sort(
          (
            a: NodeDetailsKnowledgeCardEntry,
            b: NodeDetailsKnowledgeCardEntry,
          ): number => a.title.localeCompare(b.title),
        );
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
          entry = {
            title: edge.type,
            values: [],
            type: "incomingRelationship",
          };
          acc.push(entry);
        }

        entry.values.push({
          title: targetNode.title,
          onClick: () => {
            setElement(targetNode.id);
            onCenter.next();
          },
          id: edge.id,
        });

        return acc.sort(
          (
            a: NodeDetailsKnowledgeCardEntry,
            b: NodeDetailsKnowledgeCardEntry,
          ): number => a.title.localeCompare(b.title),
        );
      }, []);
  }, [elements, props.node]);

  const allProperties = useMemo(() => {
    return [...properties, ...outgoingEdges, ...incomingEdges];
  }, [incomingEdges, outgoingEdges, properties]);

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
                <Stack gap={0} className={"ps-2 pe-2"}>
                  {data.map((property) => (
                    <Fragment key={property.title + property.type}>
                      <NodeDetailsKnowledgeCardEntryDisplay
                        node={props.node}
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
