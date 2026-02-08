import { NodeDetailsKnowledgeCardEntry } from "./NodeDetailsKnowledgeCardEntry.ts";
import { Fragment, ReactNode } from "react";
import { Link } from "react-router";

export function NodeDetailsKnowledgeCardEntryDisplay(props: {
  entry: NodeDetailsKnowledgeCardEntry;
}) {
  return (
    <span className={"user-select-text text-break small"}>
      <span className={"fw-bold"}>{props.entry.title}: </span>
      <span className={""}>
        <ul>
          {props.entry.values.length > 0 && (
            <>
              {props.entry.values.map((value) => (
                <Fragment key={value.id}>
                  <li key={value.title} className={""}>
                    <LinkWrapper onClick={value.onClick ?? null}>
                      {value.title.trim().length === 0 ? (
                        <span className={"text-muted fst-italic"}>
                          Empty Text
                        </span>
                      ) : (
                        <span>{value.title}</span>
                      )}
                    </LinkWrapper>
                  </li>
                </Fragment>
              ))}
            </>
          )}
          {props.entry.values.length === 0 && (
            <li>
              <span className={"text-muted fst-italic"}>None</span>
            </li>
          )}
        </ul>
      </span>
    </span>
  );
}

function LinkWrapper(props: {
  onClick: (() => void) | null;
  children: ReactNode;
}) {
  if (props.onClick == null) {
    return props.children;
  } else {
    return (
      <Link
        to={""}
        onClick={(e) => {
          e.preventDefault();
          props.onClick?.();
        }}
      >
        {props.children}
      </Link>
    );
  }
}
