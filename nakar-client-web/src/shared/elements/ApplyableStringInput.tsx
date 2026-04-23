import { Fragment, useEffect, useState } from "react";
import { Dropdown, Form, Stack } from "react-bootstrap";
import { NavbarButton } from "./NavbarButton.tsx";
import { DropdownButton } from "./DropdownButton.tsx";

export function ApplyableStringInput(props: {
  value: string;
  onChange: (newValue: string) => void;
  size?: "sm" | "lg";
  className?: string;
  suggestions?: string[];
}) {
  const [currentText, setCurrentText] = useState(props.value);
  useEffect(() => {
    setCurrentText(props.value);
  }, [props.value]);
  const dirty = currentText != props.value;
  const apply = () => {
    props.onChange(currentText);
  };

  return (
    <Stack direction={"horizontal"} className={props.className}>
      <Form.Control
        size={props.size}
        value={currentText}
        onChange={(e) => {
          setCurrentText(e.target.value);
        }}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            apply();
          }
        }}
      ></Form.Control>
      {props.suggestions != null && (
        <DropdownButton icon={"chevron-down"}>
          {props.suggestions.map((suggestion) => (
            <Fragment key={suggestion}>
              <Dropdown.Item
                onClick={() => {
                  props.onChange(suggestion);
                }}
              >
                <span className={"small"}>{suggestion}</span>
              </Dropdown.Item>
            </Fragment>
          ))}
        </DropdownButton>
      )}
      <NavbarButton
        title={"Apply"}
        onClick={() => {
          apply();
        }}
        disabled={!dirty}
      ></NavbarButton>
    </Stack>
  );
}
