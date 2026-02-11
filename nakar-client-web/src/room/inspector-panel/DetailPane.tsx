import { Stack } from "react-bootstrap";
import { DetailPaneAction } from "./DetailPaneAction.ts";
import { PropertiesDisplay, PropertyEntry } from "./PropertiesDisplay.tsx";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { ReactNode } from "react";
import { PropertyMenu } from "../properties/PropertyMenu.tsx";
import clsx from "clsx";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";
import { ClipboardButton } from "../../shared/elements/ClipboardButton.tsx";
import { ShortendText } from "../../shared/elements/ShortendText.tsx";

export function DetailPane(props: {
  title: string;
  subTitleElements?: ReactNode;
  actions: DetailPaneAction[];
  subActions?: ReactNode;
  properties: PropertyEntry[];
  otherProperties: PropertyEntry[];
  elementId: string;
  children?: ReactNode;
}) {
  return (
    <Stack className={"pb-5 pt-1"} gap={5}>
      <Stack className={"flex-grow-0 flex-shrink-1"}>
        {props.title.length > 0 && (
          <Stack
            direction={"horizontal"}
            className={"justify-content-between align-items-baseline"}
          >
            <Stack className={"flex-grow-0"}>
              <ClipboardButton text={props.title}></ClipboardButton>
            </Stack>
            <Stack>
              <h5 className={"user-select-text"}>
                <ShortendText text={props.title}></ShortendText>
              </h5>
            </Stack>
            <PropertyMenu value={props.title}></PropertyMenu>
          </Stack>
        )}
        <Stack direction={"horizontal"} className={"justify-content-between"}>
          <Stack direction={"horizontal"} className={"ellipsis"}>
            <ClipboardButton text={props.elementId}></ClipboardButton>
            <span className={"ellipsis text-muted small user-select-text"}>
              {props.elementId}
            </span>
          </Stack>
          <PropertyMenu value={props.elementId}></PropertyMenu>
        </Stack>
        {props.subTitleElements}
      </Stack>
      <Collapsable
        title={<span className={"small fw-bold"}>Actions</span>}
        className={"border-top flex-grow-0"}
        initialState={false}
      >
        {props.actions.length > 0 && (
          <Stack direction={"horizontal"} className={"flex-wrap"}>
            {props.actions.map((action: DetailPaneAction, index: number) => (
              <NavbarButton
                key={action.title}
                onClick={action.action}
                disabled={action.disabled}
                className={clsx(
                  "flex-grow-1 justify-content-between w-50 border-top",
                  index % 2 == 0 && "border-end",
                )}
                title={action.title}
                icon={action.icon ?? undefined}
              ></NavbarButton>
            ))}
          </Stack>
        )}
      </Collapsable>

      {props.subActions}

      <PropertiesDisplay
        title={"Properties"}
        className={"border-top flex-grow-0"}
        properties={props.properties}
        elementId={props.elementId}
      ></PropertiesDisplay>

      <PropertiesDisplay
        title={"Other Properties"}
        className={"border-top flex-grow-0"}
        properties={props.otherProperties}
        elementId={props.elementId}
      ></PropertiesDisplay>
      {props.children}
      <div className={"flex-grow-1"}></div>
    </Stack>
  );
}
