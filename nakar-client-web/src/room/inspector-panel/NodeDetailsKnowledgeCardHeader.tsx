import { NodeDto } from "../../../src-gen";
import { Stack } from "react-bootstrap";
import { ShortendText } from "../../shared/elements/ShortendText.tsx";
import { Link } from "react-router";

export function NodeDetailsKnowledgeCardHeader(props: { node: NodeDto }) {
  return (
    <>
      <Stack
        className={
          "sticky-top bg-body-tertiary border-bottom p-2 align-items-center mb-2"
        }
        direction={"horizontal"}
        gap={2}
      >
        <Stack>
          <span className={"text-muted small user-select-text"}>
            {props.node.labels.join(", ")}
          </span>
          <span className={"fs-5 user-select-text text-break fw-bold"}>
            <ShortendText
              text={props.node.title}
              render={(t) => (
                <>
                  {props.node.url != null ? (
                    <Link to={props.node.url} target={"_blank"}>
                      {t}
                    </Link>
                  ) : (
                    <>{t}</>
                  )}
                </>
              )}
            ></ShortendText>
          </span>
        </Stack>
      </Stack>
    </>
  );
}
