import { Button, Container, Form, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { AppContext } from "../state/AppContext.ts";
import { CMSFooter } from "../shared/cms/CMSFooter.tsx";
import { match, P } from "ts-pattern";
import { useState } from "react";
import { ProjectPageDto } from "../../src-gen";

export function AddEditProject(props: { context: AppContext }) {
  const [title, setTitle] = useState<string>("Untitled Project");

  const project: ProjectPageDto | null = null;
  return (
    <Stack
      style={{ height: "100%", width: "100%" }}
      className={"justify-content-start bg-body-tertiary"}
    >
      <CMSNavbar context={props.context} backUrl={"/"}></CMSNavbar>
      <div className={"overflow-auto mb-auto pt-5 pb-5"}>
        <Container>
          <Stack gap={5}>
            <h1 className={"user-select-text"}>
              {match(project)
                .with(P.nullish, () => "Create Project")
                .otherwise(() => "Edit Project")}
            </h1>
            <Form
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <Form.Group className="mb-3">
                <Form.Label>Project Title</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Project Title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                  }}
                />
                <Form.Text className="text-muted">
                  This title will be shown on your start page.
                </Form.Text>
              </Form.Group>

              <Button variant="primary" type="submit">
                {match(project)
                  .with(P.nullish, () => "Create Project")
                  .otherwise(() => "Edit Project")}
              </Button>
            </Form>
          </Stack>
        </Container>
      </div>
      <CMSFooter></CMSFooter>
    </Stack>
  );
}
