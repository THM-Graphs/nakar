import { Card, Stack } from "react-bootstrap";
import { useCallback } from "react";
import {
  ColorPresetDto,
  UpdateScenarioPostActionEntryDto,
} from "../../../src-gen";
import { v4 } from "uuid";
import { NavbarButton } from "../elements/NavbarButton.tsx";
import { PostScenarioActionEditor } from "./PostScenarioActionEditor.tsx";

export function PostScenarioActionsEditor(props: {
  value: UpdateScenarioPostActionEntryDto[];
  onChange: (newEntry: UpdateScenarioPostActionEntryDto[]) => void;
}) {
  const addPostAction = useCallback(() => {
    const defaultColor: ColorPresetDto = {
      type: "ColorPresetDto",
      index: 0,
    };
    const newQueryParameter: UpdateScenarioPostActionEntryDto = {
      id: v4(),
      label: "",
      circleRadius: 2000,
      type: "connectResultNodes",
      layoutAlgorithm: "circle",
      relationshipType: "",
      factor: 2,
      width: 2,
      color: defaultColor,
      radius: 40,
      property: "",
    };
    props.onChange([...props.value, newQueryParameter]);
  }, [props.value, props.onChange]);

  const removePostAction = useCallback(
    (queryParameterId: string) => {
      props.onChange(props.value.filter((p) => p.id !== queryParameterId));
    },
    [props.value, props.onChange],
  );

  return (
    <Stack gap={1}>
      {props.value.map((parameter: UpdateScenarioPostActionEntryDto) => (
        <PostScenarioActionEditor
          key={parameter.id}
          value={parameter}
          onChange={(newParameter: UpdateScenarioPostActionEntryDto): void => {
            props.onChange(
              props.value.map(
                (
                  p: UpdateScenarioPostActionEntryDto,
                ): UpdateScenarioPostActionEntryDto =>
                  p.id === newParameter.id ? newParameter : p,
              ),
            );
          }}
          onDelete={(e) => {
            e.preventDefault();
            if (
              parameter.label === "" ||
              confirm("Remove post scenario action?")
            ) {
              removePostAction(parameter.id);
            }
          }}
        ></PostScenarioActionEditor>
      ))}

      <Card>
        <NavbarButton
          className={"align-self-stretch pt-1 pb-1"}
          icon={"plus-lg"}
          title={"Add Post Scenario Action"}
          onClick={(e) => {
            e.preventDefault();
            addPostAction();
          }}
        ></NavbarButton>
      </Card>
    </Stack>
  );
}
