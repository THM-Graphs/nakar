import { Stack } from "react-bootstrap";
import { AppContextData } from "../state/AppContextData.ts";
import { DynamicList } from "../shared/elements/DynamicList.tsx";
import clsx from "clsx";
import { CSSProperties } from "react";
import { ProjectDisplay } from "./ProjectDisplay.tsx";
import { StartPageProjectDto } from "../../src-gen";

export function ProjectList(props: {
  title?: string;
  rooms: StartPageProjectDto[] | null;
  context: AppContextData;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Stack
      gap={0}
      className={clsx(
        "border-start border-end border-bottom border-top",
        props.className,
      )}
      style={props.style}
    >
      <DynamicList
        sticky={false}
        data={props.rooms ?? []}
        entityNamePlural={props.title ?? "Rooms"}
        collapsable={true}
        filter={(exp, r) => r.title.toLowerCase().includes(exp.toLowerCase())}
        render={(list) => (
          <>
            {list.map((project) => (
              <ProjectDisplay
                key={project.id}
                project={project}
              ></ProjectDisplay>
            ))}
          </>
        )}
      ></DynamicList>
    </Stack>
  );
}
