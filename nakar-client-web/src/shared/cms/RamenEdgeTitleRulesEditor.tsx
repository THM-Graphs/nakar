import type { RamenEdgeTitleRuleDto } from "api-client";
import { Button, Card, Col, Form, Row, Stack } from "react-bootstrap";
import { NavbarButton } from "../elements/NavbarButton.tsx";

export function RamenEdgeTitleRulesEditor(props: {
  value: RamenEdgeTitleRuleDto[];
  onChange: (rules: RamenEdgeTitleRuleDto[]) => void;
}) {
  function updateRule(index: number, rule: RamenEdgeTitleRuleDto): void {
    props.onChange(props.value.map((entry, i) => (i === index ? rule : entry)));
  }

  return (
    <Stack>
      <h5>RAMEN Edge Titles</h5>
      <Stack gap={1}>
        <Form.Text>
          Map an annotation type to the property that supplies its edge title.
        </Form.Text>
        {props.value.map((rule, index) => (
          <Card key={index} className={"p-3 gap-3 flex-grow-1"}>
            <Stack direction={"horizontal"} gap={3}>
              <Row className={"flex-grow-1"}>
                <Col>
                  <Form.Group
                    controlId={`ramen-annotation-type-${index.toString()}`}
                  >
                    <Form.Label>Annotation Type Value</Form.Label>
                    <Form.Control
                      required
                      aria-describedby={`ramen-annotation-type-hint-${index.toString()}`}
                      className={"font-monospace"}
                      value={rule.annotationType}
                      onChange={(event) => {
                        updateRule(index, {
                          ...rule,
                          annotationType: event.target.value,
                        });
                      }}
                    ></Form.Control>
                    <Form.Text
                      id={`ramen-annotation-type-hint-${index.toString()}`}
                      className={"user-select-text"}
                    >
                      The value of the <code>type</code> -Property. Example:
                      "relation".
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group
                    controlId={`ramen-title-property-${index.toString()}`}
                  >
                    <Form.Label>Title Property Key</Form.Label>
                    <Form.Control
                      aria-describedby={`ramen-title-property-hint-${index.toString()}`}
                      className={"font-monospace"}
                      value={rule.titleProperty}
                      onChange={(event) => {
                        updateRule(index, {
                          ...rule,
                          titleProperty: event.target.value,
                        });
                      }}
                    ></Form.Control>
                    <Form.Text
                      id={`ramen-title-property-hint-${index.toString()}`}
                      className={"user-select-text"}
                    >
                      Leave empty to use the value of the <code>type</code>{" "}
                      property.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Button
                type={"button"}
                size={"sm"}
                variant={"danger"}
                className={"shadow-sm align-self-start flex-grow-0"}
                aria-label={"Remove rule"}
                onClick={() => {
                  props.onChange(props.value.filter((_, i) => i !== index));
                }}
              >
                <i className={"bi bi-trash"} aria-hidden={true}></i>
              </Button>
            </Stack>
          </Card>
        ))}
        <Card>
          <NavbarButton
            buttonType={"button"}
            icon={"plus-lg"}
            title={"Add Rule"}
            className={"align-self-stretch pt-1 pb-1"}
            onClick={() => {
              props.onChange([
                ...props.value,
                { annotationType: "", titleProperty: "" },
              ]);
            }}
          ></NavbarButton>
        </Card>
      </Stack>
    </Stack>
  );
}
