import { singleton } from 'aurelia-framework';
import { Step } from 'models/project/steps/Step';
import { Vector2 } from 'models/math/Vector2';

export const gridSize: number = 10;
export const stepWidth: number = 10;
export const stepHeight: number = 6;

@singleton()
export class CanvasMaths {
    getStepRectangle(step: Step, offset: Vector2, zoom: number, outline: number = 0) {
        var gridSizeZoommed = gridSize * zoom;
        return {
            x1: step.x * gridSizeZoommed + offset.x + (outline ? -outline : 0),
            y1: step.y * gridSizeZoommed + offset.y + (outline ? -outline : 0),
            x2: (step.x + stepWidth) * gridSizeZoommed + offset.x + (outline ? outline : 0),
            y2: (step.y + stepHeight) * gridSizeZoommed + offset.y + (outline ? outline : 0),
        };
    }
}