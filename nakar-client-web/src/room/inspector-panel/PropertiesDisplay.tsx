import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { PropertyDisplay } from "./PropertyDisplay.tsx";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";

export type PropertyEntry = { slug: string; value: unknown };

export function PropertiesDisplay(props: {
  title: string;
  elementId: string;
  properties: PropertyEntry[];
  roomContext: CanvasContext;
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
