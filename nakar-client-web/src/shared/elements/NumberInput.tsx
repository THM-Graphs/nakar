import { Form, Stack } from "react-bootstrap";
import { NavbarButton } from "./NavbarButton.tsx";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

const convertToNumber = (input: string | null): number | null => {
  const n = Number(input);
  if (isNaN(n)) {
    return null;
  } else {
    return n;
  }
};

export function NumberInput(props: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  min?: number;
}) {
  const [value, setValue] = useState<string>(props.value.toString());
  const [sliderValue, setSliderValue] = useState<number>(props.value);

  const valueIsValid: boolean = useMemo(() => {
    const number: number = Number(value);
    if (isNaN(number)) {
      return false;
    }
    return props.min == null || number >= props.min;
  }, [value, props.min]);

  useEffect(() => {
    setValue(props.value.toString());
  }, [props.value]);

  return (
    <Stack
      direction={"vertical"}
      className={clsx("align-items-stretch", props.className)}
    >
      <Stack direction={"horizontal"} className={"flex-grow-1"}>
        <Form.Control
          className={clsx("small", !valueIsValid && "bg-danger-subtle")}
          type="number"
          size={"sm"}
          disabled={props.disabled}
          value={value}
          min={props.min}
          onChange={(e) => {
            setValue(e.target.value);
            const n: number | null = convertToNumber(e.target.value);
            if (n != null && valueIsValid) {
              props.onChange(n);
            }
          }}
        />
        <NavbarButton
          icon={"plus-lg"}
          disabled={props.disabled}
          onClick={() => {
            const n: number | null = convertToNumber(value);
            if (n != null) {
              setValue((n + 1).toString());
              if (valueIsValid) {
                props.onChange(n + 1);
              }
            }
          }}
        ></NavbarButton>
        <NavbarButton
          disabled={props.disabled}
          icon={"dash-lg"}
          onClick={() => {
            const n: number | null = convertToNumber(value);
            if (n != null) {
              setValue((n - 1).toString());
              if (valueIsValid) {
                props.onChange(n - 1);
              }
            }
          }}
        ></NavbarButton>
      </Stack>
      <Form.Range
        value={sliderValue}
        onChange={(e) => {
          setSliderValue(Number(e.target.value));
          setValue(e.target.value);
        }}
        onMouseUp={() => {
          props.onChange(sliderValue);
        }}
      />
    </Stack>
  );
}
