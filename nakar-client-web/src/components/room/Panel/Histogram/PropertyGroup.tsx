import { useState } from "react";
import { Button, Stack } from "react-bootstrap";
import { Collapsable } from "../../Collapsable.tsx";
import { ValueDisplay } from "./ValueDisplay.tsx";
import { RoomContext } from "../../../../pages/Room.tsx";

export function PropertyGroup(props: {
  propertyEntry: {
    key: string;
    values: Array<{
      value: string;
      count: number;
      percentage: number;
    }>;
  };
  roomContext: RoomContext;
}) {
  const [hidden, setHidden] = useState<boolean>(true);
  return (
    <Stack key={props.propertyEntry.key} className={""}>
      <Collapsable
        title={
          <span className={"small user-select-text text-muted"}>
            {props.propertyEntry.key}
          </span>
        }
      >
        <Stack>
          {props.propertyEntry.values
            .slice(0, hidden ? 10 : props.propertyEntry.values.length)
            .map((valueEntry) => (
              <ValueDisplay
                label={valueEntry.value}
                value={valueEntry.count}
                percentage={valueEntry.percentage}
                key={valueEntry.value}
                roomContext={props.roomContext}
              ></ValueDisplay>
            ))}
          {hidden && props.propertyEntry.values.length > 10 && (
            <Button
              variant={""}
              size={"sm"}
              className={"text-muted fst-italic small rounded-0"}
              onClick={() => {
                setHidden(false);
              }}
            >
              ...show all {props.propertyEntry.values.length} elements
            </Button>
          )}
        </Stack>
      </Collapsable>
    </Stack>
  );
}
