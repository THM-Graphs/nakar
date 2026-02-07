import { Container, Form, Spinner, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { useState } from "react";
import { projectControllerCreateProject } from "../../src-gen";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { useNavigate } from "react-router";
import { CMSErrorCard } from "../shared/cms/CMSErrorCard.tsx";
import { CMSHeader } from "../shared/cms/CMSHeader.tsx";
import { CMSButton } from "../shared/cms/CMSButton.tsx";
import { CMSEditTextCard } from "../shared/cms/CMSEditTextCard.tsx";
import { Router } from "../routing/Router.ts";

export function AddProject() {
  const [title, setTitle] = useState<string>("Untitled Project");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const navigate = useNavigate();

  return (
    <Stack className={""}>
      <CMSNavbar
        breadcrumbContext={[
          { title: "Home", url: "/" },
          { title: "Create Project", url: "#" },
        ]}
      ></CMSNavbar>
      <div className={"overflow-auto mb-auto pt-5 pb-5"}>
        <Container>
          <Stack gap={3}>
            <CMSHeader title={"Create Project"}></CMSHeader>
            <CMSErrorCard error={error}></CMSErrorCard>
            <Form
              onSubmit={(event) => {
                event.preventDefault();
                setLoading(true);
                setError(null);
                projectControllerCreateProject({
                  body: {
                    title: title,
                  },
                })
                  .then(resultOrThrow)
                  .then((result) => {
                    return navigate(Router.getProjectPath(result.id));
                  })
                  .catch((error: unknown) => {
                    setError(error);
                  })
                  .finally(() => {
                    setLoading(false);
                  });
              }}
            >
              <Stack gap={3}>
                <CMSEditTextCard
                  title={"Project Title"}
                  value={title}
                  onChange={setTitle}
                  subtitle={"This title will be shown on your start page."}
                ></CMSEditTextCard>
                <Stack
                  direction={"horizontal"}
                  gap={3}
                  className={"justify-content-between"}
                >
                  <Stack direction={"horizontal"} gap={2}>
                    <CMSButton
                      title={"Create Project"}
                      icon={"plus-lg"}
                      type={"submit"}
                    ></CMSButton>
                    <CMSButton
                      title={"Cancel"}
                      link={"/"}
                      variant={"secondary"}
                    ></CMSButton>
                    {loading && (
                      <Spinner variant={"primary"} size={"sm"}></Spinner>
                    )}
                  </Stack>
                </Stack>
              </Stack>
            </Form>
          </Stack>
        </Container>
      </div>
    </Stack>
  );
}
