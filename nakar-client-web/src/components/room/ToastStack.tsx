import { Toast, ToastContainer } from "react-bootstrap";
import { useContext, useEffect, useState } from "react";
import { WebSocketsManagerContext } from "../../lib/ws/WebSocketsManagerContext.ts";
import { v4 } from "uuid";

export function ToastStack() {
  const [message, setMessages] = useState<ToastMessage[]>([]);
  const websocketsManager = useContext(WebSocketsManagerContext);

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
      websocketsManager.onScenarioDataChanged$.subscribe((event) => {
        pushMessage({
          id: v4(),
          message: `Scenario loaded: ${event.scenarioTitle}`,
          date: new Date(event.date),
          title: "Graph",
        });
      }),
      websocketsManager.onError$.subscribe((event) => {
        pushMessage({
          id: v4(),
          message: event.message,
          date: new Date(event.date),
          title: "Error",
        });
      }),
      websocketsManager.onUserJoined$.subscribe((event) => {
        pushMessage({
          id: v4(),
          message: `User ${event.userName} joined the room.`,
          date: new Date(event.date),
          title: "User joined",
        });
      }),
      websocketsManager.onUserLeft$.subscribe((event) => {
        pushMessage({
          id: v4(),
          message: `User ${event.userName} left the room. (${event.message})`,
          date: new Date(event.date),
          title: "User left",
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
        >
          <Toast.Header>
            <img
              src="holder.js/20x20?text=%20"
              className="rounded me-2"
              alt=""
            />
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
};
