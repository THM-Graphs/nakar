import { Alert, Form, Spinner, Stack } from "react-bootstrap";
import { CMSButton } from "./CMSButton.tsx";
import { ReactNode, useState } from "react";
import { useNavigate } from "react-router";
import { handleError } from "../error/handleError.ts";
import { CMSHeader } from "./CMSHeader.tsx";

export function CMSEditPageForm(props: {
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  closeUrl: string;
  afterDeleteUrl: string;
  entityTitleSingular: string;
  children?: ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        props
          .onSave()
          .then(() => navigate(props.closeUrl))
          .catch((e: unknown) => {
            setError(handleError(e));
          })
          .finally(() => {
            setLoading(false);
          });
      }}
    >
      <Stack gap={5}>
        <CMSHeader title={`Edit ${props.entityTitleSingular}`}></CMSHeader>
        {props.children}
        <Stack gap={3}>
          {error && (
            <Alert
              variant={"danger"}
              onClose={() => {
                setError(null);
              }}
              dismissible={true}
            >
              {error}
            </Alert>
          )}
          <Stack
            direction={"horizontal"}
            gap={3}
            className={"justify-content-between"}
          >
            <Stack direction={"horizontal"} gap={2}>
              <CMSButton
                title={"Save & Close"}
                icon={"floppy"}
                type={"submit"}
              ></CMSButton>
              <CMSButton
                title={"Save"}
                icon={"floppy"}
                onClick={(e) => {
                  e.preventDefault();
                  setLoading(true);
                  setError(null);
                  props
                    .onSave()
                    .then(() => navigate(0))
                    .catch((e: unknown) => {
                      setError(handleError(e));
                    })
                    .finally(() => {
                      setLoading(false);
                    });
                }}
              ></CMSButton>
              <CMSButton
                title={"Cancel"}
                link={props.closeUrl}
                variant={"secondary"}
              ></CMSButton>
              {loading && <Spinner variant={"primary"} size={"sm"}></Spinner>}
            </Stack>
            <CMSButton
              title={`Delete ${props.entityTitleSingular}`}
              icon={"trash"}
              variant={"danger"}
              onClick={(e) => {
                e.preventDefault();

                if (!confirm(`Delete ${props.entityTitleSingular}?`)) {
                  return;
                }

                setLoading(true);
                setError(null);
                props
                  .onDelete()
                  .then(() => {
                    return navigate(props.afterDeleteUrl);
                  })
                  .catch((error: unknown) => {
                    setError(handleError(error));
                  })
                  .finally(() => {
                    setLoading(false);
                  });
              }}
            ></CMSButton>
          </Stack>
        </Stack>
      </Stack>
    </Form>
  );
}
