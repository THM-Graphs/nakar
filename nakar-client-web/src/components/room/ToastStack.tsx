import { Toast, ToastContainer } from "react-bootstrap";
import { useEffect, useState } from "react";
import { v4 } from "uuid";
import { WebSocketsManager } from "../../lib/ws/WebSocketsManager.ts";
import { match } from "ts-pattern";

export function ToastStack(props: { websocketsManager: WebSocketsManager }) {
  const [message, setMessages] = useState<ToastMessage[]>([]);

  const pushMessage = (message: ToastMessage) => {
    setMessages((messages: ToastMessage[]): ToastMessage[] => [
      ...messages,
      message,
    ]);
    setTimeout(() => {
      removeMessage(message.id);
    }, 5000);
  };

  const removeMessage = (messageId: string) => {
    setMessages((messages) => messages.filter((m) => m.id != messageId));
  };

  useEffect(() => {
    const subscriptions = [
      props.websocketsManager.onNotification$.subscribe((notification) => {
        pushMessage({
          id: v4(),
          message: notification.message,
          date: new Date(notification.date),
          title: notification.title,
          severity: notification.severity,
        });
      }),
    ];

    return () => {
      subscriptions.forEach((s) => {
        s.unsubscribe();
      });
    };
  }, []);

  return (
    <ToastContainer className="position-absolute bottom-0 p-2">
      {message.map((message) => (
        <Toast
          key={message.id}
          onClose={() => {
            removeMessage(message.id);
          }}
          bg={match(message.severity)
            .with("error", () => "danger")
            .with("warning", () => "warning")
            .with("message", () => undefined)
            .exhaustive()}
        >
          <Toast.Header>
            <strong className="me-auto">{message.title}</strong>
            <small className="text-muted">
              {message.date.toLocaleString()}
            </small>
          </Toast.Header>
          <Toast.Body>{message.message}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
}

type ToastMessage = {
  id: string;
  title: string;
  message: string;
  date: Date;
  severity: "error" | "warning" | "message";
};
