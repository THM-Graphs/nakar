import { Stack } from "react-bootstrap";
import { Panel } from "../../shared/elements/Panel.tsx";
import { useState } from "react";
import { DatabaseSelect } from "../database/DatabaseSelect.tsx";
import { Node, postDatabaseSearch } from "../../../src-gen";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { Loadable } from "../../shared/data/Loadable.ts";
import { handleError } from "../../shared/error/handleError.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { SearchForm } from "./SearchForm.tsx";
import { SearchResultDisplay } from "./SearchResultDisplay.tsx";
import { SearchCapabilitiesDisplay } from "./SearchCapabilitiesDisplay.tsx";
import { RoomContext } from "../../pages/Room.tsx";

export function SearchPanel(props: { roomContext: RoomContext }) {
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string | null>(
    null,
  );

  const searchTerm = useBearStore((s) => s.room.panels.search.searchTerm);
  const leftPanel = useBearStore((s) => s.room.panels.left);
  const hide = useBearStore((s) => s.room.panels.search.hide);

  const [result, setResult] = useState<Loadable<Node[] | null>>({
    type: "data",
    data: null,
  });

  // useEffect(() => {
  //   if (searchTerm.length > 0) {
  //     if (result.type != "loading") {
  //       void executeSearch();
  //     }
  //   } else {
  //     setResult({ type: "data", data: null });
  //   }
  // }, [searchTerm]);

  const executeSearch = async (): Promise<void> => {
    setResult({ type: "loading" });
    try {
      const postResult = resultOrThrow(
        await postDatabaseSearch({
          path: { id: selectedDatabaseId ?? "" },
          body: {
            searchTerm: searchTerm,
            roomId: props.roomContext.initialRoomData.id,
          },
        }),
      );
      setResult({ type: "data", data: postResult.nodes });
    } catch (error) {
      setResult({ type: "error", message: handleError(error) });
    }
  };

  return (
    <Panel
      title={"Search"}
      onClose={hide}
      direction={"left"}
      hidden={leftPanel != "search"}
    >
      <Stack gap={3}>
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
            <SearchForm
              onSearch={() => {
                void executeSearch();
              }}
            ></SearchForm>
            <SearchResultDisplay
              result={result}
              roomContext={props.roomContext}
              databaseId={selectedDatabaseId}
            ></SearchResultDisplay>
            <SearchCapabilitiesDisplay
              databaseId={selectedDatabaseId}
            ></SearchCapabilitiesDisplay>
          </>
        )}
        <div className={"flex-grow-1"}></div>
      </Stack>
    </Panel>
  );
}
