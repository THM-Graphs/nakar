import { GraphProperty } from "../../../src-gen";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { useState } from "react";
import { Stack } from "react-bootstrap";
import clsx from "clsx";
import { ClipboardButton } from "../../shared/elements/ClipboardButton.tsx";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { PropertyMenu } from "../properties/PropertyMenu.tsx";

export function PropertyDisplay(props: {
  property: GraphProperty;
  roomContext: CanvasContext;
  index: number;
}) {
  const property = props.property;
  const [showFullValue, setShowFullValue] = useState(false);
  const valueLengthLimit = 100;
  const stringValue =
    typeof property.value === "string"
      ? property.value
      : JSON.stringify(property.value);

  return (
    <Stack
      key={property.slug}
      direction={"horizontal"}
      className={clsx(
        "border-bottom",
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
      {stringValue.length > valueLengthLimit && !showFullValue && (
        <NavbarButton
          icon={"chevron-right"}
          className={"align-self-baseline"}
          onClick={() => {
            setShowFullValue(true);
          }}
        ></NavbarButton>
      )}
      {stringValue.length > valueLengthLimit && showFullValue && (
        <NavbarButton
          icon={"chevron-down"}
          className={"align-self-baseline"}
          onClick={() => {
            setShowFullValue(false);
          }}
        ></NavbarButton>
      )}
      <span
        className={
          "user-select-text pe-2 text-break text-wrap small align-self-baseline"
        }
      >
        {stringValue.length > valueLengthLimit && !showFullValue
          ? stringValue.substring(0, valueLengthLimit) + "…"
          : stringValue}
      </span>
      <div className={"me-auto"}></div>
      <PropertyMenu
        value={property.value}
        roomContext={props.roomContext}
      ></PropertyMenu>
    </Stack>
  );
}
