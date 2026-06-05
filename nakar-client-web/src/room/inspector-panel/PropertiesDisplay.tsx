import { PropertyDisplay } from "./PropertyDisplay.tsx";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import clsx from "clsx";
import { Stack } from "react-bootstrap";

export type PropertyEntry = { slug: string; value: unknown };

export function PropertiesDisplay(props: {
  title: string;
  elementId: string;
  properties: PropertyEntry[];
  className?: string;
  collapsed?: boolean;
}) {
  return (
    <DynamicList
      data={props.properties}
      entityNamePlural={props.title}
      filter={(exp, e) => e.slug.toLowerCase().includes(exp.toLowerCase())}
      className={clsx(props.className)}
      previewLimit={20}
      collapsed={props.collapsed}
      render={(properties) => (
        <>
          <Stack className={"border rounded overflow-hidden m-1"}>
            {properties.map((property, index) => (
              <PropertyDisplay
                key={property.slug}
                index={index}
                property={property}
                className={clsx(
                  index < properties.length - 1 && "border-bottom",
                )}
              ></PropertyDisplay>
            ))}
          </Stack>
        </>
      )}
    ></DynamicList>
  );
}
