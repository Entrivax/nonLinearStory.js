import { ProjectManagerService } from 'services/ProjectManagerService';
import { inject, transient } from 'aurelia-framework';
import { Vector2 } from 'models/math/Vector2';
import { Step } from 'models/project/steps/Step';
import { gridSize, CanvasMaths } from 'canvas/util/CanvasMaths';

@inject(ProjectManagerService, CanvasMaths)
@transient()
export class CanvasController {
    private offset: Vector2;
    private zoom: number;
    private movingElements: MovingElement[];
    private isShiftKeyPressed: boolean;

    constructor(private projectManagerService: ProjectManagerService, private canvasMaths: CanvasMaths) {
        this.offset = new Vector2(0, 0);
        this.zoom = 1;
        this.movingElements = [];
        this.isShiftKeyPressed = false;
    }

    getOffset() {
        return new Vector2(this.offset.x, this.offset.y);
    }

    getZoom() {
        return this.zoom;
    }

    onNewStep(position: Vector2) {
        let gridPosition = {
            x: Math.floor((position.x - this.offset.x) / (gridSize * this.zoom)),
            y: Math.floor((position.y - this.offset.y) / (gridSize * this.zoom)),
        }

        this.projectManagerService.newStep('newStep', gridPosition);
        this.projectManagerService.requestRedraw();
    }

    /*******************************/
    /*         Drag events         */
    /*******************************/
    onDragStart(event) {
        let moving = false;
        var selectedSteps = this.projectManagerService.getSelectedSteps();
        for (let i = selectedSteps.length - 1; i >= 0; i--) {
            let stepRectangle = this.canvasMaths.getStepRectangle(selectedSteps[i], this.offset, this.zoom);
            if (event.x0 >= stepRectangle.x1 && event.x0 <= stepRectangle.x2 &&
                event.y0 >= stepRectangle.y1 && event.y0 <= stepRectangle.y2) {
                    moving = true;
                    break;
                }
        }
        
        if (moving) {
            for (let i = 0; i < selectedSteps.length; i++) {
                let stepRectangle = this.canvasMaths.getStepRectangle(selectedSteps[i], this.offset, this.zoom);
                this.movingElements.push(new MovingElement(
                    selectedSteps[i],
                    new Vector2(event.x0 - stepRectangle.x1, event.y0 - stepRectangle.y1)
                ));
            }
        }
    }

    onDragMove(event) {
        if (this.movingElements.length === 0) {
            this.offset.x += event.dx;
            this.offset.y += event.dy;
        } else {
            for (var i = 0; i < this.movingElements.length; i++) {
                var movingElement = this.movingElements[i];
                movingElement.element.x = Math.floor((event.pageX - this.offset.x - movingElement.mouseElementOffset.x) / (gridSize * this.zoom));
                movingElement.element.y = Math.floor((event.pageY - this.offset.y - movingElement.mouseElementOffset.y) / (gridSize * this.zoom));
            }
        }
        this.projectManagerService.requestRedraw();
    }

    onDragEnd(event) {
        this.movingElements.length = 0;
    }

    /*******************************/
    /*     Mouse click events      */
    /*******************************/
    onClick(event) {
        let steps = this.projectManagerService.getProject().steps;
        let stepFound = false;
        for (let i = steps.length - 1; i >= 0; i--) {
            let stepRectangle = this.canvasMaths.getStepRectangle(steps[i], this.offset, this.zoom);
            if (event.x >= stepRectangle.x1 && event.x <= stepRectangle.x2 &&
                event.y >= stepRectangle.y1 && event.y <= stepRectangle.y2) {
                    this.projectManagerService.selectStep(steps[i], this.isShiftKeyPressed);
                    stepFound = true;
                    break;
                }
        }
        if (!stepFound) {
            this.projectManagerService.selectStep(null, this.isShiftKeyPressed);
        }
        this.projectManagerService.requestRedraw();
    }

    /*******************************/
    /*     Mouse wheel events      */
    /*******************************/
    onWheel(event) {
        var zoomDelta = event.originalEvent.deltaY > 0 ? -0.1 : 0.1;
        var newZoom = this.zoom + zoomDelta;
        newZoom = newZoom < 0.1 ? 0.1 : (newZoom > 5 ? 5 : newZoom);
        var zoomFactor = 1 - newZoom / this.zoom;
        this.offset.x += (event.originalEvent.x - this.offset.x) * zoomFactor;
        this.offset.y += (event.originalEvent.y - this.offset.y) * zoomFactor;
        this.offset.x = Math.round(this.offset.x);
        this.offset.y = Math.round(this.offset.y);
        this.zoom = newZoom;
        this.projectManagerService.requestRedraw();
    }

    /*******************************/
    /*       Keyboard events       */
    /*******************************/
    onKeyDown(event) {

    }

    onKeyUp(event) {
        if (event.keyCode === 46) { // Delete keycode
            this.projectManagerService.removeSteps(this.projectManagerService.getSelectedSteps());
            this.projectManagerService.selectStep(null, false);
            this.projectManagerService.requestRedraw();
        }
    }

    onKeyPress(event) {

    }

    /*******************************/
    /*   Window keyboard events    */
    /*******************************/
    onWindowKeyDown(event) {
        if (event.keyCode === 16) {
            this.isShiftKeyPressed = true;
        }
    }

    onWindowKeyUp(event) {
        if (event.keyCode === 16) {
            this.isShiftKeyPressed = false;
        }
    }
}

class MovingElement {
    constructor(
        public element: Step,
        public mouseElementOffset: Vector2
    ) { }
}
