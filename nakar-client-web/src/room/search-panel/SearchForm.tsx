import { Form, Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { useRef, useState } from "react";
import clsx from "clsx";

export function SearchForm(props: {
  onSearch: () => Promise<void> | void;
  className?: string;
}) {
  const searchTerm = useBearStore((s) => s.room.panels.search.searchTerm);
  const setSearchTerm = useBearStore((s) => s.room.panels.search.setSearchTerm);
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );
  const textInput = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        textInput.current?.focus();
        setLoading(true);
        Promise.resolve(props.onSearch())
          .catch(pushErrorNotification)
          .finally(() => {
            setLoading(false);
          });
      }}
      className={props.className}
    >
      <Stack
        direction={"horizontal"}
        className={clsx("bg-body border rounded overflow-hidden m-1")}
      >
        <Form.Control
          ref={textInput}
          className={"rounded-0 border-0"}
          style={{ fontSize: "14px" }}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          disabled={loading}
          placeholder={"Search"}
        ></Form.Control>
        {searchTerm.length > 0 && (
          <NavbarButton
            icon={"x-lg"}
            onClick={() => {
              setSearchTerm("");
              textInput.current?.focus();
            }}
            buttonType={"button"}
            className={"align-self-stretch ps-1 pe-1"}
            disabled={loading}
          ></NavbarButton>
        )}
        <NavbarButton
          icon={"search"}
          buttonType={"submit"}
          className={"align-self-stretch ps-1 pe-1"}
          disabled={loading}
        ></NavbarButton>
      </Stack>
    </Form>
  );
}
