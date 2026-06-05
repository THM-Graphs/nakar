import { NodeDto } from "api-client";
import { Image, Stack } from "react-bootstrap";
import { Link } from "react-router";
import { useMemo } from "react";

export function NodeDetailsKnowledgeCardCoverImage(props: { node: NodeDto }) {
  const url: URL | null = useMemo(() => {
    if (props.node.coverImageUrl == null) {
      return null;
    }
    try {
      return new URL(props.node.coverImageUrl);
    } catch {
      return null;
    }
  }, [props.node.coverImageUrl]);

  return (
    <>
      {url != null && (
        <Stack
          className={"border-bottom position-relative bg-white flex-grow-0"}
        >
          <Link to={url.toString()} target={"_blank"}>
            <Image fluid={true} src={url.toString()}></Image>
          </Link>
        </Stack>
      )}
    </>
  );
}
