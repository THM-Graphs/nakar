import { Subject } from "rxjs";

export class D3RendererEvents {
  public onZoomIn: Subject<void>;
  public onZoomOut: Subject<void>;
  public onCenter: Subject<void>;
  public onZoomOutOverview: Subject<void>;

  constructor() {
    console.log("Did create instance of D3RendererEvents");
    this.onZoomIn = new Subject();
    this.onZoomOut = new Subject();
    this.onCenter = new Subject();
    this.onZoomOutOverview = new Subject();
  }
}
