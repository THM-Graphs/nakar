import { Form, Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { useRef } from "react";
import clsx from "clsx";

export function SearchForm(props: {
  onSearch: () => void;
  className?: string;
}) {
  const searchTerm = useBearStore((s) => s.room.panels.search.searchTerm);
  const setSearchTerm = useBearStore((s) => s.room.panels.search.setSearchTerm);
  const textInput = useRef<HTMLInputElement>(null);

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        textInput.current?.focus();
        props.onSearch();
      }}
      className={props.className}
    >
      <Stack
        direction={"horizontal"}
        className={clsx("bg-body border-top border-bottom")}
      >
        <Form.Control
          ref={textInput}
          className={"rounded-0 border-0"}
          style={{ fontSize: "14px" }}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
        ></Form.Control>
        {searchTerm.length > 0 && (
          <NavbarButton
            icon={"x-lg"}
            onClick={() => {
              setSearchTerm("");
              textInput.current?.focus();
            }}
            buttonType={"button"}
            className={"align-self-stretch"}
          ></NavbarButton>
        )}
        <NavbarButton
          icon={"search"}
          buttonType={"submit"}
          className={"align-self-stretch"}
        ></NavbarButton>
      </Stack>
    </Form>
  );
}
