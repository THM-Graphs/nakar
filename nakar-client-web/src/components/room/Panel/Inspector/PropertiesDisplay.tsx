import { GraphProperty, ScenarioGroup } from "../../../../../src-gen";
import { Stack } from "react-bootstrap";
import { ClipboardButton } from "../../ClipboardButton.tsx";
import { PropertyMenu } from "./PropertyMenu.tsx";
import { RoomContext } from "../../../../pages/Room.tsx";
import { Loadable } from "../../../../lib/data/Loadable.ts";
import { useState } from "react";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import clsx from "clsx";

export function PropertiesDisplay(props: {
  title: string;
  elementId: string;
  properties: GraphProperty[];
  roomContext: RoomContext;
  scenarioGroupsWithParameterizedScenarios: Loadable<ScenarioGroup[]>;
  onReload: () => void | Promise<void>;
}) {
  if (props.properties.length === 0) {
    return null;
  }

  return (
    <>
      <Stack className={"flex-grow-0 flex-shrink-0"}>
        <Stack direction={"horizontal"} className={"align-items-end"}>
          <span className={"w-25 ps-2 pb-1 fw-bold small"}>{props.title}</span>
          <span className={"fw-bold small"} style={{ paddingLeft: "40px" }}>
            Value
          </span>
        </Stack>
        {props.properties.map((property, index: number) => (
          <PropertyDisplay
            key={property.slug}
            index={index}
            property={property}
            scenarioGroupsWithParameterizedScenarios={
              props.scenarioGroupsWithParameterizedScenarios
            }
            roomContext={props.roomContext}
            onReload={props.onReload}
          ></PropertyDisplay>
        ))}
      </Stack>
    </>
  );
}

function PropertyDisplay(props: {
  property: GraphProperty;
  scenarioGroupsWithParameterizedScenarios: Loadable<ScenarioGroup[]>;
  roomContext: RoomContext;
  onReload: () => void | Promise<void>;
  index: number;
}) {
  const property = props.property;
  const [showFullValue, setShowFullValue] = useState(false);
  const valueLengthLimit = 100;
  const stringValue = JSON.stringify(property.value);

  return (
    <Stack
      key={property.slug}
      direction={"horizontal"}
      className={clsx(
        "border-top",
        props.index % 2 === 0 ? "bg-body" : "bg-body-tertiary",
      )}
    >
      <span
        className={
          "small user-select-text text-wrap text-break w-25 flex-shrink-0 ps-2 pe-2 align-self-baseline"
        }
      >
        {property.slug}
      </span>
      <ClipboardButton
        size={"sm"}
        className={"p-1 align-self-baseline"}
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
          "font-monospace user-select-text pe-2 text-break text-wrap small align-self-baseline"
        }
      >
        {stringValue.length > valueLengthLimit && !showFullValue
          ? stringValue.substring(0, valueLengthLimit) + "…"
          : stringValue}
      </span>
      <div className={"me-auto"}></div>
      <PropertyMenu
        scenarioGroupsWithParameterizedScenarios={
          props.scenarioGroupsWithParameterizedScenarios
        }
        value={property.value}
        roomContext={props.roomContext}
        onReload={props.onReload}
        className={"align-self-baseline"}
      ></PropertyMenu>
    </Stack>
  );
}
