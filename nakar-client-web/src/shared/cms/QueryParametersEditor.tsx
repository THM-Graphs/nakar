import { Card, Stack } from "react-bootstrap";
import { useCallback } from "react";
import { UpdateScenarioQueryParameterEntryDto } from "../../../src-gen";
import { v4 } from "uuid";
import { QueryParameterEditor } from "./QueryParameterEditor.tsx";
import { NavbarButton } from "../elements/NavbarButton.tsx";

export function QueryParametersEditor(props: {
  value: UpdateScenarioQueryParameterEntryDto[];
  onChange: (newEntry: UpdateScenarioQueryParameterEntryDto[]) => void;
}) {
  const addQueryParameter = useCallback(() => {
    const newQueryParameter: UpdateScenarioQueryParameterEntryDto = {
      id: v4(),
      identifier: "",
      title: "",
      dataType: "string",
      defaultValue: "",
      allowedLabels: "",
    };
    props.onChange([...props.value, newQueryParameter]);
  }, [props.value, props.onChange]);

  const removeQueryParameter = useCallback(
    (queryParameterId: string) => {
      props.onChange(props.value.filter((p) => p.id !== queryParameterId));
    },
    [props.value, props.onChange],
  );

  return (
    <Stack gap={1}>
      {props.value.map((parameter: UpdateScenarioQueryParameterEntryDto) => (
        <QueryParameterEditor
          key={parameter.id}
          value={parameter}
          onChange={(
            newParameter: UpdateScenarioQueryParameterEntryDto,
          ): void => {
            props.onChange(
              props.value.map(
                (
                  p: UpdateScenarioQueryParameterEntryDto,
                ): UpdateScenarioQueryParameterEntryDto =>
                  p.id === newParameter.id ? newParameter : p,
              ),
            );
          }}
          onDelete={(e) => {
            e.preventDefault();
            if (
              parameter.identifier === "" ||
              confirm("Remove query parameter?")
            ) {
              removeQueryParameter(parameter.id);
            }
          }}
        ></QueryParameterEditor>
      ))}

      <Card>
        <NavbarButton
          className={"align-self-stretch pt-1 pb-1"}
          icon={"plus-lg"}
          title={"Add Query Parameter"}
          onClick={(e) => {
            e.preventDefault();
            addQueryParameter();
          }}
        ></NavbarButton>
      </Card>
    </Stack>
  );
}
