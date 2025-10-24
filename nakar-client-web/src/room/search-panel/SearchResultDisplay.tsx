import { match } from "ts-pattern";
import { ReactElement } from "react";
import { Loading } from "../../shared/elements/Loading.tsx";
import { Alert, Stack } from "react-bootstrap";
import { Loadable } from "../../data/Loadable.ts";
import { Database, Node } from "../../../src-gen";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import { RoomContext } from "../../pages/Room.tsx";
import { SearchResultEntry } from "./SearchResultEntry.tsx";

export function SearchResultDisplay(props: {
  result: Loadable<Node[] | null>;
  roomContext: RoomContext;
  databaseId: string;
}) {
  return (
    <>
      {match(props.result)
        .returnType<ReactElement | null>()
        .with({ type: "loading" }, () => (
          <Loading className={"align-self-center"} size={"sm"}></Loading>
        ))
        .with({ type: "data" }, (data) =>
          data.data != null ? (
            <DynamicList
              data={data.data}
              entityNamePlural={"Nodes"}
              collapsable={true}
              className={"border-top"}
              render={(list) => (
                <Stack>
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
