import { match } from "ts-pattern";
import { ReactElement } from "react";
import { Loading } from "../../shared/elements/Loading.tsx";
import { Alert, Stack } from "react-bootstrap";
import { Loadable } from "../../shared/data/Loadable.ts";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import { CanvasContextData } from "../../pages/Canvas.tsx";
import { SearchResultEntry } from "./SearchResultEntry.tsx";
import { NodePreviewDto } from "api-client";

export function SearchResultDisplay(props: {
  result: Loadable<NodePreviewDto[] | null>;
  roomContext: CanvasContextData;
  databaseId: string;
}) {
  return (
    <>
      {match(props.result)
        .returnType<ReactElement | null>()
        .with({ type: "loading" }, () => (
          <Stack className={"p-3 border-bottom flex-grow-0"}>
            <Loading className={"align-self-center"} size={"sm"}></Loading>
          </Stack>
        ))
        .with({ type: "data" }, (data) =>
          data.data != null ? (
            <DynamicList
              data={data.data}
              entityNamePlural={"Search Results"}
              collapsable={true}
              className={"border-bottom"}
              render={(list) => (
                <Stack className={"ps-1 pe-1"} gap={1}>
                  {list.map((node) => (
                    <SearchResultEntry
                      key={node.id}
                      node={node}
                      roomContext={props.roomContext}
                      databaseId={props.databaseId}
                    ></SearchResultEntry>
                  ))}
                </Stack>
              )}
            ></DynamicList>
          ) : null,
        )
        .with({ type: "error" }, (error) => (
          <Alert
            variant={"danger"}
            className={"border-start-0 border-end-0 rounded-0 small"}
          >
            {error.message}
          </Alert>
        ))
        .exhaustive()}
    </>
  );
}
