import { Alert, Form, Modal, Stack } from "react-bootstrap";
import { Panel } from "../../shared/elements/Panel.tsx";
import { ReactElement, useEffect, useState } from "react";
import { DatabaseSelect } from "../database/DatabaseSelect.tsx";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { Node, postDatabaseSearch } from "../../../src-gen";
import { resultOrThrow } from "../../data/resultOrThrow.ts";
import { Loadable } from "../../data/Loadable.ts";
import { handleError } from "../../error/handleError.ts";
import { match } from "ts-pattern";
import { Loading } from "../../shared/elements/Loading.tsx";

export function SearchModal() {
  const shown = true;
  const handleClose = () => {};
  const handleClean = () => {};

  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string | null>(
    null,
  );

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [result, setResult] = useState<Loadable<Node[] | null>>({
    type: "data",
    data: null,
  });

  useEffect(() => {
    if (searchTerm.length > 0) {
      if (result.type != "loading") {
        void executeSearch();
      }
    } else {
      setResult({ type: "data", data: null });
    }
  }, [searchTerm]);

  const executeSearch = async (): Promise<void> => {
    setResult({ type: "loading" });
    try {
      const postResult = resultOrThrow(
        await postDatabaseSearch({
          path: { id: selectedDatabaseId ?? "" },
          body: { searchTerm: searchTerm },
        }),
      );
      setResult({ type: "data", data: postResult.nodes });
    } catch (error) {
      setResult({ type: "error", message: handleError(error) });
    }
  };

  return (
    <Modal show={shown} onHide={handleClose} onExited={handleClean}>
      <Panel
        title={"Search"}
        onClose={handleClose}
        direction={"none"}
        hidden={false}
        fullWidth={true}
      >
        <DatabaseSelect
          database={selectedDatabaseId}
          onChange={setSelectedDatabaseId}
        ></DatabaseSelect>

        {selectedDatabaseId == null && (
          <span className={"small text-muted p-3"}>
            Select a database to search.
          </span>
        )}
        {selectedDatabaseId != null && (
          <>
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                void executeSearch();
              }}
            >
              <Stack
                direction={"horizontal"}
                className={"bg-body border-top border-bottom mt-2 mb-2"}
              >
                <Form.Control
                  className={"rounded-0 border-0"}
                  style={{ fontSize: "14px" }}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                ></Form.Control>
                <NavbarButton icon={"search"}></NavbarButton>
              </Stack>
            </Form>
            {match(result)
              .returnType<ReactElement>()
              .with({ type: "loading" }, () => <Loading></Loading>)
              .with({ type: "data" }, (data) => (
                <span>{JSON.stringify(data.data)}</span>
              ))
              .with({ type: "error" }, (error) => (
                <Alert
                  variant={"danger"}
                  className={"border-start-0 border-end-0 rounded-0 small"}
                >
                  {error.message}
                </Alert>
              ))
              .exhaustive()}
          </>
        )}
      </Panel>
    </Modal>
  );
}
