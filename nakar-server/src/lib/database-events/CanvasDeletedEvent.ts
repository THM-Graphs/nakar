import type { Modules } from '@strapi/types';

export interface CanvasDeletedEvent {
  canvas: Modules.Documents.Result<'api::canvas.canvas'>;
  files: Modules.Documents.Result<'plugin::upload.file'>[];
}
