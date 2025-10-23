import { Form, Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { useRef } from "react";

export function SearchForm(props: { onSearch: () => void }) {
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
    >
      <Stack
        direction={"horizontal"}
        className={"bg-body border-top border-bottom"}
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
        <NavbarButton
          icon={"x-lg"}
          onClick={() => {
            setSearchTerm("");
            textInput.current?.focus();
          }}
          buttonType={"button"}
          className={"align-self-stretch"}
        ></NavbarButton>
        <NavbarButton
          icon={"search"}
          buttonType={"submit"}
          className={"align-self-stretch"}
        ></NavbarButton>
      </Stack>
    </Form>
  );
}
