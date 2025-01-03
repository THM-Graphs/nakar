import { GetDatabase, GetScenario } from "../../../src-gen";
import { ScenarioGroupList } from "./ScenarioGroupList.tsx";

export function DatabaseDisplay(props: {
  database: GetDatabase;
  onScenarioSelect: (scenario: GetScenario) => void;
}) {
  return (
    <>
      <li>
        {props.database.title} ({props.database.url})
      </li>
      <ScenarioGroupList
        onScenarioSelect={props.onScenarioSelect}
        databaseId={props.database.id}
      ></ScenarioGroupList>
    </>
  );
}
