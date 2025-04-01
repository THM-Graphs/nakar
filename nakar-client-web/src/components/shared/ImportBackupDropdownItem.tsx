import { Button, Dropdown, Form, Modal } from "react-bootstrap";
import { FormEvent, useRef, useState } from "react";
import { postImport } from "../../../src-gen";

export function ImportBackupDropdownItem() {
  const [show, setShow] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await postImport({
        body: { file: file },
      });
      if (result.error == null) {
        // alert("Import successful.");
        // setShow(false);
      } else {
        // alert(`Error uploading file: ${JSON.stringify(result.error)}`);
      }
    } catch (error: unknown) {
      alert(`Error uploading file: ${JSON.stringify(error)}`);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Dropdown.Item
        onClick={() => {
          setShow(true);
        }}
      >
        <span className="me-1">Import Backup (.tar.gz)</span>
        <span className="me-2"></span>
        <i className="bi bi-upload"></i>
      </Dropdown.Item>
      <Modal
        show={show}
        onHide={() => {
          setShow(false);
        }}
      >
        <form onSubmit={(event) => void handleSubmit(event)}>
          <Modal.Header closeButton>
            <Modal.Title>Import</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Import ZIP file</Form.Label>
              <Form.Control type="file" ref={fileInputRef} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShow(false);
              }}
            >
              Cancel
            </Button>
            <Button type={"submit"} variant="primary">
              Import
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
}
