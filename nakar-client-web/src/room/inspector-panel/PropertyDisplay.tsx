import { Stack } from "react-bootstrap";
import clsx from "clsx";
import { ClipboardButton } from "../../shared/elements/ClipboardButton.tsx";
import { PropertyMenu } from "../properties/PropertyMenu.tsx";
import { PropertyEntry } from "./PropertiesDisplay.tsx";
import { ShortendText } from "../../shared/elements/ShortendText.tsx";

export function PropertyDisplay(props: {
  property: PropertyEntry;
  index: number;
  className?: string;
}) {
  const property = props.property;
  const stringValue =
    typeof property.value === "string"
      ? property.value
      : JSON.stringify(property.value);

  return (
    <Stack
      key={property.slug}
      direction={"horizontal"}
      className={clsx(
        props.className,
        props.index % 2 === 0 ? "bg-body" : "bg-body-tertiary",
      )}
    >
      <span
        className={
          "small user-select-text text-wrap text-break flex-shrink-0 ps-2 pe-2 align-self-baseline"
        }
        style={{ width: "30%" }}
      >
        {property.slug}
      </span>
      <ClipboardButton
        size={"sm"}
        className={clsx("p-1 align-self-baseline")}
        text={stringValue}
      ></ClipboardButton>
      <span
        className={
          "user-select-text pe-2 text-break text-wrap small align-self-baseline"
        }
      >
        <ShortendText text={stringValue}></ShortendText>
      </span>
      <div className={"me-auto"}></div>
      <PropertyMenu value={property.value}></PropertyMenu>
    </Stack>
  );
}
