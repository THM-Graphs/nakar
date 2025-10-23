import { match } from "ts-pattern";
import { ReactElement } from "react";
import { Loading } from "../../shared/elements/Loading.tsx";
import { Alert, Stack, Table } from "react-bootstrap";
import { Loadable } from "../../data/Loadable.ts";
import { Node } from "../../../src-gen";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import { Label } from "../labels/Label.tsx";
import { RoomContext } from "../../pages/Room.tsx";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { ClipboardButton } from "../../shared/elements/ClipboardButton.tsx";

export function SearchResultDisplay(props: {
  result: Loadable<Node[] | null>;
  roomContext: RoomContext;
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
              render={(list) => (
                <Stack>
                  {list.map((node) => (
                    <Stack
                      direction={"horizontal"}
                      key={node.id}
                      className={"border-bottom"}
                    >
                      <Stack gap={1} className={"p-2"}>
                        <Stack
                          direction={"horizontal"}
                          className={"flex-wrap"}
                          gap={1}
                        >
                          {node.labels.map((label) => (
                            <Label
                              label={label}
                              showAmount={false}
                              showSources={false}
                              roomContext={props.roomContext}
                              key={label}
                              className={"z-2"}
                            ></Label>
                          ))}
                        </Stack>
                        <span className={"small user-select-text"}>
                          {node.title}
                        </span>
                      </Stack>
                      <ClipboardButton
                        text={node.id}
                        className={"align-self-stretch"}
                      ></ClipboardButton>
                      <NavbarButton
                        icon={"download"}
                        className={"align-self-stretch"}
                        tooltip={"Spawn Node"}
                        tooltipPlacement={"right"}
                      ></NavbarButton>
                    </Stack>
                  ))}
                </Stack>
              )}
              entityNamePlural={"Nodes"}
              collapsable={true}
              className={"border-top border-bottom"}
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
