import { GraphProperty } from "../../../../../src-gen";
import { RoomContext } from "../../../../pages/Room.tsx";
import { PropertyDisplay } from "./PropertyDisplay.tsx";
import { DynamicList } from "../../../shared/DynamicList.tsx";

export function PropertiesDisplay(props: {
  title: string;
  elementId: string;
  properties: GraphProperty[];
  roomContext: RoomContext;
  className?: string;
}) {
  return (
    <DynamicList
      data={props.properties}
      entityNamePlural={props.title}
      filter={(exp, e) => e.slug.toLowerCase().includes(exp.toLowerCase())}
      className={props.className}
      previewLimit={20}
      render={(properties) => (
        <>
          {properties.map((property, index) => (
            <PropertyDisplay
              key={property.slug}
              index={index}
              property={property}
              roomContext={props.roomContext}
            ></PropertyDisplay>
          ))}
        </>
      )}
    ></DynamicList>
  );
}
