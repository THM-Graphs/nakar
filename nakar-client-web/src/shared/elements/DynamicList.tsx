import { ReactElement, useEffect, useState } from "react";
import { Form, Stack } from "react-bootstrap";
import { NavbarButton } from "./NavbarButton.tsx";
import { numberFormat } from "../data/numberFormat.ts";
import { Collapsable } from "./Collapsable.tsx";
import clsx from "clsx";

export function DynamicList<T>(props: {
  data: readonly T[];
  render: (data: readonly T[]) => ReactElement | null;
  entityNamePlural: string;
  filter?: (expression: string, value: T) => boolean;
  previewLimit?: number;
  collapsable?: boolean;
  customTitle?: string;
  className?: string;
  sticky?: boolean;
}): ReactElement | null {
  const previewLimit = props.previewLimit ?? 10;
  const collapsable = props.collapsable ?? true;
  const useFilter = props.filter != null && props.data.length > 5;

  const [showAllElements, setShowAllElements] = useState(false);
  const [filterValue, setFilterValue] = useState("");

  const [filteredElements, setFilteredElements] = useState<readonly T[]>(
    props.data,
  );
  const [elements, setElements] = useState<readonly T[]>(props.data);

  useEffect(() => {
    setFilteredElements(() => {
      const filterFunction = props.filter;
      const filtered =
        filterFunction == null
          ? props.data
          : props.data.filter((v) => filterFunction(filterValue.trim(), v));
      return filtered;
    });
  }, [props.data, filterValue]);

  useEffect(() => {
    setElements(() => {
      const sliced = filteredElements.slice(
        0,
        showAllElements ? props.data.length : previewLimit,
      );
      return sliced;
    });
  }, [filteredElements, showAllElements]);

  const list = (
    <Stack
      className={clsx(
        "flex-shrink-1 align-items-stretch",
        props.collapsable === false && props.className,
      )}
    >
      {useFilter && (
        <Stack
          direction={"horizontal"}
          className={"bg-body border-top border-bottom ps-2"}
        >
          <i className={"bi bi-filter"}></i>
          <Form.Control
            size={"sm"}
            className={"border-0 pt-0 pb-0"}
            value={filterValue}
            onChange={(event) => {
              setFilterValue(event.target.value);
            }}
            placeholder={`Filter ${props.entityNamePlural.toLowerCase()}`}
          ></Form.Control>
          {filterValue.length > 0 && (
            <NavbarButton
              icon={"x-lg"}
              onClick={() => {
                setFilterValue("");
              }}
            ></NavbarButton>
          )}
        </Stack>
      )}
      {props.render(elements)}
      {filteredElements.length > previewLimit && !showAllElements && (
        <NavbarButton
          onClick={() => {
            setShowAllElements(true);
          }}
        >
          <span className={"text-muted fst-italic small"}>
            … show all {numberFormat(filteredElements.length)}{" "}
            {props.entityNamePlural.toLowerCase()}
          </span>
        </NavbarButton>
      )}
      {filteredElements.length > previewLimit && showAllElements && (
        <NavbarButton
          onClick={() => {
            setShowAllElements(false);
          }}
        >
          <span className={"text-muted fst-italic small"}>
            … hide {(filteredElements.length - previewLimit).toString()}{" "}
            {props.entityNamePlural.toLowerCase()}
          </span>
        </NavbarButton>
      )}
      {filteredElements.length === 0 && (
        <span className={"small text-muted fst-italic align-self-center p-2"}>
          No {props.entityNamePlural.toLowerCase()}
        </span>
      )}
    </Stack>
  );

  return collapsable ? (
    <Collapsable
      className={clsx("flex-grow-0 flex-shrink-1", props.className)}
      sticky={props.sticky}
      title={
        <Stack
          direction={"horizontal"}
          className={
            "flex-grow-1 pe-1 align-items-center justify-content-between"
          }
          gap={2}
        >
          <span className={"fw-bold small"}>
            {props.customTitle ?? props.entityNamePlural}
          </span>

          <span className={"text-muted small"}>
            {numberFormat(props.data.length)}
          </span>
        </Stack>
      }
      initialState={false}
    >
      <Stack className={"flex-shrink-1 flex-grow-1"}>{list}</Stack>
    </Collapsable>
  ) : (
    <>{list}</>
  );
}
