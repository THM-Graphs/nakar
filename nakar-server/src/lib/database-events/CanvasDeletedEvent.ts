import type { Modules } from '@strapi/strapi';

export interface CanvasDeletedEvent {
  canvas: Modules.Documents.Result<'api::canvas.canvas'>;
  files: Modules.Documents.Result<'plugin::upload.file'>[];
}
