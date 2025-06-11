import { Toast, ToastContainer } from "react-bootstrap";
import { useEffect, useState } from "react";
import { v4 } from "uuid";
import { match } from "ts-pattern";
import { AppContext } from "../../lib/state/AppContext.ts";

export function ToastStack(props: { context: AppContext }) {
  const [message, setMessages] = useState<ToastMessage[]>([]);
  const websocketsManager = props.context.webSocketsManager;

  const pushMessage = (message: Omit<ToastMessage, "id">) => {
    const id = v4();
    setMessages((messages: ToastMessage[]): ToastMessage[] => [
      ...messages,
      {
        id: id,
        ...message,
      },
    ]);
    setTimeout(() => {
      removeMessage(id);
    }, 5000);
  };

  const removeMessage = (messageId: string) => {
    setMessages((messages) => messages.filter((m) => m.id != messageId));
  };

  useEffect(() => {
    const subscriptions = [
      websocketsManager.onNotification$.subscribe((notification) => {
        pushMessage({
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
