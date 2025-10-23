import clsx from "clsx";

export function SuccessIcon(props: { success: boolean }) {
  return (
    <i
      className={clsx(
        "bi",
        props.success ? "bi-check text-success" : "bi-x text-danger",
      )}
    ></i>
  );
}
