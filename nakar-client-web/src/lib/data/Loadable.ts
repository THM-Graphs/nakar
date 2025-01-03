export type Loadable<T> =
  | {
      type: "loading";
    }
  | {
      type: "error";
      message: string;
    }
  | {
      type: "data";
      data: T;
    };
