import { Link } from "react-router";
import { CommonPropertyDto, ProjectPageDto } from "api-client";
import { CMSCardContent } from "./CMSCardContent.tsx";
import { Badge, Card, Stack } from "react-bootstrap";
import { Router } from "../../routing/Router.ts";

function CommonPropertyCard(props: {
  project: ProjectPageDto;
  commonProperty: CommonPropertyDto;
}) {
  return (
    <Card style={{ width: "400px" }} className={"align-self-stretch"}>
      <CMSCardContent
        title={
          <Stack direction={"horizontal"} gap={3}>
            <span className={"flex-shrink-1 ellipsis"}>
              {props.commonProperty.leftDatabase != null &&
              props.commonProperty.rightDatabase != null ? (
                <>
                  {props.commonProperty.leftDatabase.title}
                  {" & "}
                  {props.commonProperty.rightDatabase.title}
                </>
              ) : (
                <>Common Property</>
              )}
            </span>
            <Link
              to={Router.getCommonPropertyEditPath(
                props.project.id,
                props.commonProperty.id,
              )}
            >
              <i className={"bi bi-pen"}></i>
            </Link>
          </Stack>
        }
        subtitle={
          <Stack
            direction={"horizontal"}
            className={"user-select-text text-break overflow-visible text-wrap"}
            gap={2}
          >
            <Stack className={"align-items-end"}>
              {props.commonProperty.leftDatabase != null ? (
                <Link
                  to={Router.getDatabaseConnectionEditPath(
                    props.project.id,
                    props.commonProperty.leftDatabase.id,
                  )}
                >
                  {props.commonProperty.leftDatabase.title}
                </Link>
              ) : (
                <span className={"text-muted fst-italic"}>
                  No left database
                </span>
              )}{" "}
              <Badge bg={"secondary"} className={"shadow-sm"}>
                {props.commonProperty.leftLabel}
              </Badge>{" "}
              <code>{props.commonProperty.leftProperty}</code>
            </Stack>
            ≡
            <Stack className={"align-items-start"}>
              {props.commonProperty.rightDatabase != null ? (
                <Link
                  to={Router.getDatabaseConnectionEditPath(
                    props.project.id,
                    props.commonProperty.rightDatabase.id,
                  )}
                >
                  {props.commonProperty.rightDatabase.title}
                </Link>
              ) : (
                <span className={"text-muted fst-italic"}>
                  No right database
                </span>
              )}{" "}
              <Badge bg={"secondary"} className={"shadow-sm"}>
                {props.commonProperty.rightLabel}
              </Badge>{" "}
              <code>{props.commonProperty.rightProperty}</code>
            </Stack>
          </Stack>
        }
        icon={"link"}
      ></CMSCardContent>
    </Card>
  );
}

export default CommonPropertyCard;
