import { Card, Form } from "react-bootstrap";

export function CMSEditTextCard(props: {
  title: string;
  subtitle?: string;
  value: string;
  onChange?: (newValue: string) => void;
}) {
  return (
    <Card className={"p-3"}>
      <Form.Group className="">
        <Form.Label>{props.title}</Form.Label>
        <Form.Control
          type="text"
          placeholder={props.title}
          value={props.value}
          onChange={(e) => {
            props.onChange?.(e.target.value);
          }}
        />
        {props.subtitle && (
          <Form.Text className="text-muted">{props.subtitle}</Form.Text>
        )}
      </Form.Group>
    </Card>
  );
}
