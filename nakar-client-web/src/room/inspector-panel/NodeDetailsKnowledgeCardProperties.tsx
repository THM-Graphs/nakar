import { NodeDto } from "../../../src-gen";
import { match, P } from "ts-pattern";
import { Stack } from "react-bootstrap";
import { Fragment, useMemo } from "react";
import { NodeDetailsKnowledgeCardEntryDisplay } from "./NodeDetailsKnowledgeCardEntryDisplay.tsx";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";

function unknownToStringList(input: unknown): string[] {
  return match(input)
    .with(P.string, (s) => [s])
    .with(P.number, (s) => [s.toString()])
    .with(P.boolean, (s) => [s ? "Yes" : "No"])
    .with(P.array(), (s) => s.flatMap((e) => unknownToStringList(e)))
    .otherwise(() => [JSON.stringify(input)]);
}

export function NodeDetailsKnowledgeCardProperties(props: { node: NodeDto }) {
  const properties: [string, unknown][] = useMemo(() => {
    return Object.entries(
      props.node.properties satisfies Record<string, unknown>,
    ).sort((a, b) => a[0].localeCompare(b[0]));
  }, [props.node.properties]);

  return (
    <>
      {properties.length > 0 && (
        <Stack className={"border-bottom"}>
          <DynamicList
            data={properties}
            filter={(e, a) => a[0].toLowerCase().includes(e.toLowerCase())}
            collapsable={false}
            render={(data) => (
              <>
                <Stack gap={0} className={"ps-2 pe-2 pt-2"}>
                  {data.map((property) => (
                    <Fragment key={property[0]}>
                      <NodeDetailsKnowledgeCardEntryDisplay
                        entry={{
                          title: property[0],
                          values: unknownToStringList(property[1]).map((t) => ({
                            id: t,
                            title: t,
                          })),
                        }}
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
