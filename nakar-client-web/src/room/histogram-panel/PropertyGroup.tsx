import { Stack } from "react-bootstrap";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";
import { ValueDisplay } from "./ValueDisplay.tsx";
import { RoomContext } from "../../pages/Room.tsx";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";

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
  return (
    <Stack key={props.propertyEntry.key} className={""}>
      <Collapsable
        sticky={false}
        title={
          <span className={"small user-select-text text-muted"}>
            {props.propertyEntry.key}
          </span>
        }
      >
        <DynamicList
          data={props.propertyEntry.values}
          entityNamePlural={`'${props.propertyEntry.key}' Values`}
          previewLimit={20}
          collapsable={false}
          filter={(exp, pv) =>
            pv.value.toLowerCase().includes(exp.toLowerCase())
          }
          render={(list) => (
            <>
              {list.map((valueEntry) => (
                <ValueDisplay
                  label={valueEntry.value}
                  value={valueEntry.count}
                  percentage={valueEntry.percentage}
                  key={valueEntry.value}
                  roomContext={props.roomContext}
                ></ValueDisplay>
              ))}
            </>
          )}
        ></DynamicList>
      </Collapsable>
    </Stack>
  );
}
