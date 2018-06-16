import { Step } from 'models/project/steps/Step';
import { TaskQueue, inject } from 'aurelia-framework';
import { CanvasController } from 'canvas/controller/canvas-controller';
import { ProjectManagerService } from 'services/ProjectManagerService';
import { Vector2 } from 'models/math/Vector2';
import { Project } from 'models/project/Project';
import { ContextMenu } from 'context-menu/context-menu';
import { PathParagraphModel } from 'models/project/steps/paragraphs/PathParagraphModel';
import { CanvasMaths, gridSize, stepWidth, stepHeight } from 'canvas/util/canvas-maths';

@inject(TaskQueue, CanvasController, ProjectManagerService, CanvasMaths)
export class CanvasRenderer {
    openContextMenuPosition: Vector2;
    steps: Step[];
    grid: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    contextMenuViewModel: ContextMenu;

    constructor(private taskQueue: TaskQueue, private canvasController: CanvasController, private projectManagerService: ProjectManagerService, private canvasMaths: CanvasMaths) { }

    attached() {
        this.taskQueue.queueMicroTask(() => {
            this.initCanvas();
        });
    }

    initCanvas() {
        this.projectManagerService.registerCanvasRenderer(this);
        this.context = this.grid.getContext('2d');
        interact(this.grid)
            .draggable({
                restrict: {
                    enabled: true,
                    restriction: 'self',
                },
            })
            .on('dragstart', (event) => this.canvasController.onDragStart(event))
            .on('dragmove', (event) => this.canvasController.onDragMove(event))
            .on('dragend', (event) => this.canvasController.onDragEnd(event))
            .on('tap', (event) => this.canvasController.onClick(event))
            .on('keyup', (event) => this.canvasController.onKeyUp(event))
            .on('keydown', (event) => this.canvasController.onKeyDown(event))
            .on('keypress', (event) => this.canvasController.onKeyPress(event))
            .styleCursor(false);

        $(window)
            .resize(() => this.resizeCanvas())
            .on('keyup', (event) => this.canvasController.onWindowKeyUp(event))
            .on('keydown', (event) => this.canvasController.onWindowKeyDown(event));

        $(this.grid)
            .on('wheel', (event) => this.canvasController.onWheel(event))
            .on('contextmenu', (event) => {
                event.preventDefault();
                this.openContextMenuPosition = new Vector2(event.pageX, event.pageY);
                this.contextMenuViewModel.show(this.openContextMenuPosition);
            });

        this.resizeCanvas();
    }

    private resizeCanvas() {
        this.grid.height = $(window).height() || window.innerHeight;
        this.grid.width = $(window).width() || window.innerWidth;
        this.redraw();
    }

    private newStep() {
        this.canvasController.onNewStep(this.openContextMenuPosition);
        this.contextMenuViewModel.hide();
    }

    redraw() {
        let offset = this.canvasController.getOffset();
        let zoom = this.canvasController.getZoom();
        let project = this.projectManagerService.getProject();
        let selectedSteps = this.projectManagerService.getSelectedSteps();

        this.drawGrid(offset, zoom);
        this.drawSteps(offset, zoom, project, selectedSteps);
        this.drawLinks(offset, zoom, project);
    }

    private drawGrid(offset: Vector2, zoom: number) {
        this.context.fillStyle = '#202225';
        this.context.fillRect(0, 0, this.grid.width, this.grid.height);
        this.context.beginPath();
        var gridSizeZoommed = gridSize * zoom;
        for (let x = offset.x % gridSizeZoommed - .5; x < this.grid.width; x += gridSizeZoommed) {
            this.context.moveTo(x, 0);
            this.context.lineTo(x, this.grid.height);
        }
        for (let y = offset.y % gridSizeZoommed - .5; y < this.grid.height; y += gridSizeZoommed) {
            this.context.moveTo(0, y);
            this.context.lineTo(this.grid.width, y);
        }

        this.context.lineWidth = 1;
        this.context.strokeStyle = '#2f3136';
        this.context.stroke();
        this.context.closePath();
    }

    private drawSteps(offset: Vector2, zoom: number, project: Project, selectedSteps: Step[]) {
        let gridSizeZoommed = gridSize * zoom;
        let fontSize = 12 * zoom;
        this.context.font = fontSize + 'px Helvetica';
        this.context.lineWidth = 1;
        for (let i = 0; i < project.steps.length; i++) {
            let step = project.steps[i];
            this.context.fillStyle = '#36393e';
            this.context.fillRect(step.x * gridSizeZoommed + offset.x, step.y * gridSizeZoommed + offset.y, stepWidth * gridSizeZoommed, stepHeight * gridSizeZoommed);
            this.context.fillStyle = '#b9bbbe';
            this.context.fillText(step.name, step.x * gridSizeZoommed + offset.x, step.y * gridSizeZoommed + offset.y + fontSize, stepWidth * gridSizeZoommed);
            this.context.strokeStyle = '#1f2326';
            if (step.name === project.settings.startingStep) {
                this.context.strokeStyle = '#43b581';
            }
            if (selectedSteps.indexOf(step) !== -1) {
                this.context.strokeStyle = '#b9bbbe';
            }
            this.context.beginPath();
            this.context.rect(step.x * gridSizeZoommed + offset.x - 0.5, step.y * gridSizeZoommed + offset.y - 0.5, stepWidth * gridSizeZoommed, stepHeight * gridSizeZoommed);
            this.context.stroke();
            this.context.closePath();
        }
    }

    private drawLinks(offset: Vector2, zoom: number, project: Project) {
        let gridSizeZoommed = gridSize * zoom;
        this.context.lineWidth = 2;
        this.context.strokeStyle = '#ffffff';
        this.context.fillStyle = '#ffffff';
        let steps = project.steps;
        for (let i = 0; i < steps.length; i++) {
            let step = steps[i];
            let stepRect = null;
            for (let j = 0; j < step.paragraphs.length; j++) {
                if (step.paragraphs[j].type !== 'path') {
                    continue;
                }
                if (stepRect == null) {
                    stepRect = this.canvasMaths.getStepRectangle(step, offset, zoom, 4);
                    stepRect.c = { x: (stepRect.x1 + stepRect.x2) * 0.5, y: (stepRect.y1 + stepRect.y2) * 0.5 };
                }

                let targetStep = this.findStep(steps, (<PathParagraphModel>step.paragraphs[j]).toStep);

                if (targetStep) {
                    let toStepRect: any = this.canvasMaths.getStepRectangle(targetStep, offset, zoom, 4);
                    toStepRect.c = { x: (toStepRect.x1 + toStepRect.x2) * 0.5, y: (toStepRect.y1 + toStepRect.y2) * 0.5 };
                    
                    let p1 = this.segRectInter(stepRect.c, toStepRect.c, stepRect);
                    let p2 = this.segRectInter(stepRect.c, toStepRect.c, toStepRect);
    
                    if (!p1 || !p2) {
                        continue;
                    }
    
                    this.canvas_arrow(p1.x, p1.y, p2.x, p2.y, zoom);
                }
            }
        }
    }

    private findStep(steps: Step[], stepName: string) {
        for (let i = 0; i < steps.length; i++) {
            if (steps[i].name === stepName) {
                return steps[i];
            }
        }
    }

    // https://stackoverflow.com/a/6333775
    private canvas_arrow(fromx: number, fromy: number, tox: number, toy: number, zoom: number){
        let headlen = 15 * zoom;
        let angle = Math.atan2(toy - fromy, tox - fromx);
        this.context.beginPath();
        this.context.moveTo(fromx, fromy);
        this.context.lineTo(tox, toy);
        this.context.stroke();
        this.context.moveTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
        this.context.lineTo(tox, toy);
        this.context.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));
        this.context.fill();
        this.context.closePath();
    }

    // https://stackoverflow.com/a/39592579
    private segInter(ps1, pe1, ps2, pe2) {
        let d =
            (pe2.y - ps2.y) * (pe1.x - ps1.x)
            -
            (pe2.x - ps2.x) * (pe1.y - ps1.y);

        //n_a and n_b are calculated as seperate values for readability
        let n_a =
            (pe2.x - ps2.x) * (ps1.y - ps2.y)
            -
            (pe2.y - ps2.y) * (ps1.x - ps2.x);

        let n_b =
            (pe1.x - ps1.x) * (ps1.y - ps2.y)
            -
            (pe1.y - ps1.y) * (ps1.x - ps2.x);

        // Make sure there is not a division by zero - this also indicates that
        // the lines are parallel.  
        // If n_a and n_b were both equal to zero the lines would be on top of each 
        // other (coincidental).  This check is not done because it is not 
        // necessary for this implementation (the parallel check accounts for this).
        if (d == 0)
            return null;

        // Calculate the intermediate fractional point that the lines potentially intersect.
        let ua = n_a / d;
        let ub = n_b / d;

        // The fractional point will be between 0 and 1 inclusive if the lines
        // intersect.  If the fractional calculation is larger than 1 or smaller
        // than 0 the lines would need to be longer to intersect.
        if (ua >= 0.0 && ua <= 1.0 && ub >= 0.0 && ub <= 1.0)
        {
            let intersection = {
                x: ps1.x + (ua * (pe1.x - ps1.x)),
                y: ps1.y + (ua * (pe1.y - ps1.y))
            }
            return intersection;
        }
        return null;
    }

    private segRectInter(p1, p2, rect) {
        let intersection = null;
        let r1 = {x: rect.x1, y: rect.y1}
        let r2 = {x: rect.x2, y: rect.y1}
        let r3 = {x: rect.x2, y: rect.y2}
        let r4 = {x: rect.x1, y: rect.y2}
        intersection = this.segInter(p1,p2,r1,r2);
        if (intersection == null)
            intersection = this.segInter(p1,p2,r2,r3);
        if (intersection == null)
            intersection = this.segInter(p1,p2,r3,r4);
        if (intersection == null)
            intersection = this.segInter(p1,p2,r4,r1);
        return intersection;
    }
}