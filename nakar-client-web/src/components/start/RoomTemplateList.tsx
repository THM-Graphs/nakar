import { RoomTemplate, RoomTemplates } from "../../../src-gen";
import { Stack } from "react-bootstrap";
import { AppContext } from "../../lib/state/AppContext.ts";
import { DynamicList } from "../shared/DynamicList.tsx";
import { RoomTemplateDisplay } from "./RoomTemplateDisplay.tsx";
import clsx from "clsx";
import { CSSProperties } from "react";

export function RoomTemplateList(props: {
  roomTemplates: RoomTemplates;
  context: AppContext;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Stack
      gap={0}
      className={clsx(
        "border-start border-end border-bottom border-top",
        props.className,
      )}
      style={props.style}
    >
      <DynamicList
        sticky={false}
        data={props.roomTemplates.roomTemplates}
        entityNamePlural={"Templates"}
        collapsable={true}
        filter={(exp, r) =>
          (r.title ?? r.id).toLowerCase().includes(exp.toLowerCase())
        }
        render={(list) => (
          <>
            {list.map((roomTemplate: RoomTemplate) => (
              <RoomTemplateDisplay
                key={roomTemplate.id}
                roomTemplate={roomTemplate}
              ></RoomTemplateDisplay>
            ))}
          </>
        )}
      ></DynamicList>
    </Stack>
  );
}
