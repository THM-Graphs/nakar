import { GraphProperty } from "../../../../../src-gen";
import { Stack } from "react-bootstrap";
import { RoomContext } from "../../../../pages/Room.tsx";
import { PropertyDisplay } from "./PropertyDisplay.tsx";

export function PropertiesDisplay(props: {
  title: string;
  elementId: string;
  properties: GraphProperty[];
  roomContext: RoomContext;
}) {
  if (props.properties.length === 0) {
    return null;
  }

  return (
    <>
      <Stack className={"flex-grow-0 flex-shrink-0"}>
        {props.properties.map((property, index: number) => (
          <PropertyDisplay
            key={property.slug}
            index={index}
            property={property}
            roomContext={props.roomContext}
          ></PropertyDisplay>
        ))}
      </Stack>
    </>
  );
}
