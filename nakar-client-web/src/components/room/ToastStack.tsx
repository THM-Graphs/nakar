import { Toast, ToastContainer } from "react-bootstrap";
import { match } from "ts-pattern";
import { useBearStore } from "../../lib/state/useBearStore.ts";
import clsx from "clsx";

export function ToastStack() {
  const notifications = useBearStore((s) => s.room.ui.notifications);
  const removeNotification = useBearStore((s) => s.room.ui.removeNotification);

  return (
    <ToastContainer className="position-absolute bottom-0 p-2 mb-1">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          onClose={() => {
            removeNotification(notification.id);
          }}
          className={clsx(
            match(notification.severity)
              .with("error", () => "text-dark")
              .with("warning", () => "text-dark")
              .with("message", () => "")
              .exhaustive(),
          )}
          bg={match(notification.severity)
            .with("error", () => "danger")
            .with("warning", () => "warning")
            .with("message", () => undefined)
            .exhaustive()}
        >
          <Toast.Header>
            <strong className="me-auto">
              {match(notification.severity)
                .with("warning", () => "Warning")
                .with("message", () => "Message")
                .with("error", () => "Error")
                .exhaustive()}
            </strong>
            <small className="text-muted">
              {notification.date.toLocaleString()}
            </small>
          </Toast.Header>
          <Toast.Body>{notification.message}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
}
