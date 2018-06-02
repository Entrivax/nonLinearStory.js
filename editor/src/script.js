var Templates = {}

;(function(interact, $, window){
    'use strict';

    Array.prototype.aggregate = function(select, aggregate) {
        if (this.length === 0)
            return null

        var output = select(this[0])

        for (var i = 1; i < this.length; i++) {
            output = aggregate(output, select(this[i]))
        }

        return output
    }

    window.NLSEditor = function() {
        var canvas,
            context,
            lateralMenu,
            offsetX = 0,
            offsetY = 0,
            gridSize = 10,
            zoom = 1,
            steps = [],
            stepWidth = 10,
            stepHeight = 6,
            selectedSteps = [],
            movingElements = [],
            settings = new Settings(),
            settingsModal,
            selectorInfo,
            isShiftKeyPressed = false,
            showDebugInfo = false
    
        $(function() {
            lateralMenu = $('#lateral-menu')
            canvas = $('#grid')[0]
            canvas.height = $(window).height() || window.innerHeight
            canvas.width = $(window).width() || window.innerWidth
            context = canvas.getContext('2d')
    
            interact('#grid')
                .draggable({
                    restrict: {
                        enabled: true,
                        restriction: 'self',
                    },
                })
                .on('dragstart', onDragStart)
                .on('dragmove', onDragMove)
                .on('dragend', onDragEnd)
                .on('tap', onClick)
                .on('keyup', onKeyUp)
                .on('keydown', onKeyDown)
                .on('keypress', onKeyPress)
                .styleCursor(false)
    
    
            $(window).resize(function() {
                canvas.height = $(window).height() || window.innerHeight
                canvas.width = $(window).width() || window.innerWidth
                redraw()
            })
    
            $('#grid').on('wheel', function(event) {
                var zoomDelta = event.originalEvent.deltaY > 0 ? -0.1 : 0.1
                var newZoom = zoom + zoomDelta
                newZoom = newZoom < 0.1 ? 0.1 : (newZoom > 5 ? 5 : newZoom)
                var zoomFactor = 1 - newZoom / zoom
                offsetX += (event.originalEvent.x - offsetX) * zoomFactor
                offsetY += (event.originalEvent.y - offsetY) * zoomFactor
                offsetX = Math.round(offsetX)
                offsetY = Math.round(offsetY)
                zoom = newZoom
                redraw()
            })
    
            $('#grid').on('contextmenu', function(event) {
                event.preventDefault()
    
                var gridPosition = {
                    x: Math.floor((event.pageX - offsetX) / (gridSize * zoom)),
                    y: Math.floor((event.pageY - offsetY) / (gridSize * zoom)),
                }
    
                showContextMenu('grid-context-menu', event.pageX, event.pageY, [ {
                    text: 'New step',
                    onClick: function() {
                        newStep(gridPosition.x, gridPosition.y)
                    }
                }])
            })
    
            $('#settings').click(function() {
                updateSettingsModal()
                settingsModal.dialog('open')
            })
    
            initSettingsModal()
    
            $(document).bind('mousedown', function(event) {
                // Hide context menu if clicked elsewhere
                if ($(event.target).parents('.grid-context-menu').length === 0) {
                    $('.grid-context-menu').hide(100)
                }
    
                if ($(event.target).parents('.lateral-menu-context-menu').length === 0) {
                    $('.lateral-menu-context-menu').hide(100)
                }
            })
    
            selectStep(null)
    
            if (!tryLoadFromLocalStorage()) {
                steps.push(new Step('startStep', 5, 5))
                settings.startingStep = steps[0].name
            }
    
            redraw()
        })
    
        function onKeyUp(event) {
            if (event.keyCode === 46) { // Delete keycode
                removeSelectedStep()
            } else if (event.keyCode === 16) {
                isShiftKeyPressed = false
            }
        }

        function onKeyDown(event) {
            if (event.keyCode === 16) {
                isShiftKeyPressed = true
            }
        }

        function onKeyPress(event) {
            if (event.keyCode === 68) { // D uppercase
                showDebugInfo = !showDebugInfo
                redraw()
            }
        }
    
        function updateSettingsModal() {
            var select = settingsModal.find('#starting-step')
            select.empty()
            for (var i = 0; i < steps.length; i++) {
                var option = $('<option></option>')
                option.val(steps[i].name)
                option.text(steps[i].name)
                if (steps[i].name === settings.startingStep) {
                    option.attr('selected', 'selected')
                }
                option.appendTo(select)
            }
            select.val(settings.startingStep)
            select.customSelect('refresh')

            var input = settingsModal.find('#project-name')
            input.val(settings.projectName)
        }
    
        function initSettingsModal() {
            settingsModal = $('<div></div>')

            var row = $('<div class="row"></div>')
            $('<div class="col-xs-12">Project name:</div>').appendTo(row)
            var inputContainer = $('<div class="col-xs-12"></div>')
            var input = $('<input type="text" id="project-name" placeholder="Enter a project name">')
            input.appendTo(inputContainer)
            inputContainer.appendTo(row)
            row.appendTo(settingsModal)

            row = $('<div class="row"></div>')
            $('<div class="col-xs-12">Starting step:</div>').appendTo(row)
            inputContainer = $('<div class="col-xs-12"></div>')
            input = $('<select id="starting-step"></select>')
            input.appendTo(inputContainer)
            input.customSelect({
                placeholder: '<span>Please select a step</span>'
            })
            inputContainer.appendTo(row)
            row.appendTo(settingsModal)
    
            var buttonsContainer = $('<div class="buttons-container"></div>')
            var closeButton = $('<div class="btn">Close</div>')
            var saveButton = $('<div class="btn btn-primary">Save</div>')
            closeButton.appendTo(buttonsContainer)
            closeButton.click(function() {
                settingsModal.dialog('close')
            })
            saveButton.appendTo(buttonsContainer)
            saveButton.click(function() {
                settingsModal.dialog('close')
                settings.projectName = settingsModal.find('#project-name').val()
                settings.startingStep = settingsModal.find('#starting-step').val()
                saveProjectIntoLocalStorage()
                redraw()
            })
            $('<div class="separator"></div>').appendTo(settingsModal)
            buttonsContainer.appendTo(settingsModal)
    
            settingsModal.dialog({ autoOpen: false, modal: true, draggable: false, resizable: false, minHeight: 50, title: 'Project settings' })
        }
    
        function showContextMenu(menuClass, x, y, elements) {
            // Clear animation queue
            var contextMenu = $('.' + menuClass)
            contextMenu.finish()
    
            // Empty currently created elements
            contextMenu.empty()
    
            // Menu elements creation
            for (var i = 0; i < elements.length; i++) {
                var menuElement = $('<li>' + elements[i].text + '</li>')
                ;(function(element) {
                    menuElement.click(function() {
                        contextMenu.hide(100)
                        element.onClick()
                    })
                })(elements[i])
                menuElement.appendTo(contextMenu)
            }
    
            // Show menu
            contextMenu.toggle(200).css({
                left: x + 'px',
                top: y + 'px',
            })
        }
    
        function onDragMove(event) {
            if (movingElements.length === 0) {
                offsetX += event.dx
                offsetY += event.dy
            } else {
                for (var i = 0; i < movingElements.length; i++) {
                    var movingElement = movingElements[i]
                    movingElement.element.x = Math.floor((event.pageX - offsetX - movingElement.mouseElementOffsetX) / (gridSize * zoom))
                    movingElement.element.y = Math.floor((event.pageY - offsetY - movingElement.mouseElementOffsetY) / (gridSize * zoom))
                }
            }
            redraw()
        }
    
        function onDragStart(event) {
            var moving = false
            for (var i = selectedSteps.length - 1; i >= 0; i--) {
                var stepRectangle = getStepRectangle(selectedSteps[i])
                if (event.x0 >= stepRectangle.x1 && event.x0 <= stepRectangle.x2 &&
                    event.y0 >= stepRectangle.y1 && event.y0 <= stepRectangle.y2) {
                        moving = true
                        break
                    }
            }
            
            if (moving) {
                for (var i = 0; i < selectedSteps.length; i++) {
                    var stepRectangle = getStepRectangle(selectedSteps[i])
                    movingElements.push({
                        element: selectedSteps[i],
                        mouseElementOffsetX: event.x0 - stepRectangle.x1,
                        mouseElementOffsetY: event.y0 - stepRectangle.y1,
                    })
                }
            }
        }
    
        function onDragEnd(event) {
            if (movingElements)
                saveProjectIntoLocalStorage()
            movingElements.length = 0
        }
    
        function newStep(x, y) {
            var step = new Step(
                'newStep',
                x,
                y
            )
    
            steps.push(step)
            selectStep(step)
            saveProjectIntoLocalStorage()
            redraw()
        }
    
        function removeSelectedStep() {
            if (selectedSteps.length == 0)
                return
            
            for (var i = 0; i < steps.length; i++) {
                var step = steps[i]
                for (var j = 0; j < step.paragraphs.length; j++) {
                    var paragraph = step.paragraphs[j]
                    for (var k = 0; k < selectedSteps.length; k++) {
                        var selectedStep = selectedSteps[k]
                        if (paragraph.type === 'path' && paragraph.toStep === selectedStep.name) {
                            paragraph.toStep = null
                        }
                    }
                }
            }
    
            for (var i = 0; i < selectedSteps.length; i++) {
                var selectedStep = selectedSteps[i]

                for (var indexOfStep = 0; indexOfStep < steps.length; indexOfStep++) {
                    var step = steps[indexOfStep]
                    if (step.name === selectedStep.name)
                        break
                }

                if (indexOfStep !== steps.length) {
                    steps.splice(indexOfStep, 1)
                }

                if (selectedStep.name === settings.startingStep) {
                    settings.startingStep = null
                }
            }
            
            selectStep(null)
            saveProjectIntoLocalStorage()
        }
    
        function onClick(event) {
            for (var i = steps.length - 1; i >= 0; i--) {
                var stepRectangle = getStepRectangle(steps[i])
                if (event.x >= stepRectangle.x1 && event.x <= stepRectangle.x2 &&
                    event.y >= stepRectangle.y1 && event.y <= stepRectangle.y2) {
                        selectStep(steps[i], isShiftKeyPressed)
                        break
                    }
            }
            if (i < 0) {
                selectStep(null, isShiftKeyPressed)
            }
        }

        function selectSteps(steps) {
            selectedSteps.length = 0
            for (var i = 0; i < steps.length; i++) {
                selectedSteps.push(steps[i])
            }
            updateLateralMenu()
            redraw()
        }
    
        function selectStep(step, invert) {
            if (!invert) {
                selectedSteps.length = 0
            }
            
            var indexOfStep = selectedSteps.indexOf(step)
            if (!invert || indexOfStep === -1) {
                if (step != null) {
                    selectedSteps.push(step)
                }
            } else if (indexOfStep !== -1) {
                selectedSteps.slice(indexOfStep, 1)
            }
            
            updateLateralMenu()
            redraw()
        }
    
        function updateLateralMenu() {
            lateralMenu.empty()
            if (selectedSteps.length != 1) {
                lateralMenu.hide(100)
                return
            }

            var selectedStep = selectedSteps[0]

            var panelTemplate = _.template(Templates['panel.ejs'])
            var textParagraphTemplate = _.template(Templates['textParagraph.ejs'])
            var pathParagraphTemplate = _.template(Templates['pathParagraph.ejs'])

            var generatedPanel = panelTemplate({
                step: selectedStep,
                steps: steps,
                textParagraphTemplate: textParagraphTemplate,
                pathParagraphTemplate: pathParagraphTemplate,
            })

            $(generatedPanel).appendTo(lateralMenu)

            lateralMenu.find('.add-button').click(function(event) {
                showContextMenu('lateral-menu-context-menu', event.pageX, event.pageY, [
                    {
                        text: 'New text element',
                        onClick: function() {
                            createTextParagraph()
                            updateLateralMenu()
                        }
                    },
                    {
                        text: 'New path',
                        onClick: function() {
                            createPathParagraph()
                            updateLateralMenu()
                        }
                    }
                ])
            })

            lateralMenu.find('.expander').click(function() {
                var $this = $(this)
                $this.parent().children('.expansion[data-expander-container="' + $this.attr('data-expander-container') + '"]').each(function() {
                    var expansion = $(this)
                    if ($this.hasClass('close')) {
                        expansion.slideUp(300)
                        $this.removeClass('close')
                    } else {
                        expansion.slideDown(300)
                        $this.addClass('close')
                    }
                })
            })

            lateralMenu.find('.expansion').hide(0)

            var paragraphs = lateralMenu.find('ul.paragraphs > li')

            for (var i = 0; i < paragraphs.length; i++) {
                var $paragraph = $(paragraphs[i])
                ;(function(i) {
                    $paragraph.find('.remove-button').click(function() {
                        selectedStep.paragraphs.splice(i, 1)
                        updateLateralMenu()
                    })
                })(i)
                var stepParagraph = selectedStep.paragraphs[i]
                if (stepParagraph.type === 'text') {
                    $paragraph.find('.is-text-js').prop('checked', stepParagraph.isTextJavascript)
                    $paragraph.find('.textTextArea').val(stepParagraph.text)
                    $paragraph.find('.isVisible').val(stepParagraph.isVisible)
                } else if (stepParagraph.type === 'path') {
                    $paragraph.find('.is-text-js').prop('checked', stepParagraph.isTextJavascript)
                    $paragraph.find('.textTextArea').val(stepParagraph.text)
                    $paragraph.find('.isVisible').val(stepParagraph.isVisible)
                    $paragraph.find('.onClick').val(stepParagraph.onClick)
                    if (stepParagraph.toStep) {
                        $paragraph.find('option[value="' + stepParagraph.toStep.replace(/\"/g) + '"]', '\\"').attr('selected', 'selected')
                    }
                    $paragraph.find('.to-step').customSelect({
                        placeholder: '<span>Please select a step</span>'
                    })
                }
            }

            lateralMenu.find('.step-name').val(selectedStep.name)
            lateralMenu.find('.onDisplay').val(selectedStep.onDisplay)

            lateralMenu.find('ul').sortable({
                placeholder: 'sortable-placeholder',
                update: updateStepInfos
            })

            lateralMenu.find('input, select, textarea').change(updateStepInfos)

            function createTextParagraph() {
                selectedStep.paragraphs.push({
                    type: 'text',
                    text: '',
                    isVisible: '',
                    isTextJavascript: '',
                })
            }

            function createPathParagraph() {
                selectedStep.paragraphs.push({
                    type: 'path',
                    toStep: null,
                    text: '',
                    onClick: '',
                    isVisible: '',
                    isTextJavascript: '',
                })
            }
            
            function updateStepInfos() {
                selectedStep.name = lateralMenu.find('.step-name').val()
                lateralMenu.find('.step-name').val(selectedStep.name)
    
                selectedStep.paragraphs.length = 0
                for (var i = 0; i < paragraphs.length; i++) {
                    var $element = $(paragraphs[i])
                    if ($element.hasClass('text-element')) {
                        selectedStep.paragraphs.push({
                            type: 'text',
                            text: $element.find('textarea').val(),
                            isVisible: $element.find('textarea.isVisible').val(),
                            isTextJavascript: $element.find('input.is-text-js').prop('checked'),
                        })
                    } else if ($element.hasClass('path-element')) {
                        var targetStepName = $element.find('select').val()
                        selectedStep.paragraphs.push({
                            type: 'path',
                            toStep: targetStepName,
                            text: $element.find('.textTextArea').val(),
                            onClick: $element.find('.onClick').val(),
                            isVisible: $element.find('textarea.isVisible').val(),
                            isTextJavascript: $element.find('input.is-text-js').prop('checked'),
                        })
                    }
                }
    
                selectedStep.onDisplay = lateralMenu.find('.onDisplay').val()
    
                saveProjectIntoLocalStorage()
                redraw()
            }
    
            lateralMenu.show(100)
        }
    
        function redraw() {
            drawGrid()
            drawSteps()
            drawLinks()
            drawDebug()
        }
    
        function drawGrid() {
            context.fillStyle = '#202225'
            context.fillRect(0, 0, canvas.width, canvas.height)
            context.beginPath()
            for (var x = offsetX % (gridSize * zoom) - .5; x < canvas.width; x += (gridSize * zoom)) {
                context.moveTo(x, 0)
                context.lineTo(x, canvas.height)
            }
            for (var y = offsetY % (gridSize * zoom) - .5; y < canvas.height; y += (gridSize * zoom)) {
                context.moveTo(0, y)
                context.lineTo(canvas.width, y)
            }
    
            context.lineWidth = 1
            context.strokeStyle = '#2f3136'
            context.stroke()
            context.closePath()
        }
    
        function drawLinks() {
            var gridSizeZoommed = gridSize * zoom
            context.lineWidth = 2
            context.strokeStyle = '#ffffff'
            context.fillStyle = '#ffffff'
            for (var i = 0; i < steps.length; i++) {
                var step = steps[i]
                var stepRect = null
                for (var j = 0; j < step.paragraphs.length; j++) {
                    if (step.paragraphs[j].type !== 'path') {
                        continue
                    }
                    if (stepRect == null) {
                        stepRect = getStepRectangle(step, 4)
                        stepRect.c = { x: (stepRect.x1 + stepRect.x2) * 0.5, y: (stepRect.y1 + stepRect.y2) * 0.5 }
                    }
    
                    var targetStep = findStep(step.paragraphs[j].toStep)
    
                    if (targetStep) {
                        var toStepRect = getStepRectangle(targetStep, 4)
                        toStepRect.c = { x: (toStepRect.x1 + toStepRect.x2) * 0.5, y: (toStepRect.y1 + toStepRect.y2) * 0.5 }
                        
                        var p1 = segRectInter(stepRect.c, toStepRect.c, stepRect)
                        var p2 = segRectInter(stepRect.c, toStepRect.c, toStepRect)
        
                        if (!p1 || !p2) {
                            continue
                        }
        
                        canvas_arrow(p1.x, p1.y, p2.x, p2.y)
                    }
                }
            }
        }
    
        function findStep(stepName) {
            for (var i = 0; i < steps.length; i++) {
                if (steps[i].name === stepName)
                    return steps[i]
            }
        }
    
        // https://stackoverflow.com/a/6333775
        function canvas_arrow(fromx, fromy, tox, toy){
            var headlen = 15 * zoom
            var angle = Math.atan2(toy - fromy, tox - fromx)
            context.beginPath()
            context.moveTo(fromx, fromy)
            context.lineTo(tox, toy)
            context.stroke()
            context.moveTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6))
            context.lineTo(tox, toy)
            context.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6))
            context.fill()
            context.closePath()
        }
    
        function drawSteps() {
            var gridSizeZoommed = gridSize * zoom
            var fontSize = 12 * zoom
            context.font = fontSize + 'px Helvetica'
            context.lineWidth = 1
            for (var i = 0; i < steps.length; i++) {
                var step = steps[i]
                context.fillStyle = '#36393e'
                context.fillRect(step.x * gridSizeZoommed + offsetX, step.y * gridSizeZoommed + offsetY, stepWidth * gridSizeZoommed, stepHeight * gridSizeZoommed)
                context.fillStyle = '#b9bbbe'
                context.fillText(step.name, step.x * gridSizeZoommed + offsetX, step.y * gridSizeZoommed + offsetY + fontSize, stepWidth * gridSizeZoommed)
                context.strokeStyle = '#1f2326'
                if (step.name === settings.startingStep) {
                    context.strokeStyle = '#43b581'
                }
                if (selectedSteps.indexOf(step) !== -1) {
                    context.strokeStyle = '#b9bbbe'
                }
                context.beginPath()
                context.rect(step.x * gridSizeZoommed + offsetX - 0.5, step.y * gridSizeZoommed + offsetY - 0.5, stepWidth * gridSizeZoommed, stepHeight * gridSizeZoommed)
                context.stroke()
                context.closePath()
            }
        }
    
        function getStepRectangle(step, outline) {
            var gridSizeZoommed = gridSize * zoom
            return {
                x1: step.x * gridSizeZoommed + offsetX + (outline ? -outline : 0),
                y1: step.y * gridSizeZoommed + offsetY + (outline ? -outline : 0),
                x2: (step.x + stepWidth) * gridSizeZoommed + offsetX + (outline ? outline : 0),
                y2: (step.y + stepHeight) * gridSizeZoommed + offsetY + (outline ? outline : 0),
            }
        }
    
        // https://stackoverflow.com/a/39592579
        function segInter(ps1, pe1, ps2, pe2) {
            var d =
                (pe2.y - ps2.y) * (pe1.x - ps1.x)
                -
                (pe2.x - ps2.x) * (pe1.y - ps1.y);
    
            //n_a and n_b are calculated as seperate values for readability
            var n_a =
                (pe2.x - ps2.x) * (ps1.y - ps2.y)
                -
                (pe2.y - ps2.y) * (ps1.x - ps2.x);
    
            var n_b =
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
            var ua = n_a / d;
            var ub = n_b / d;
    
            // The fractional point will be between 0 and 1 inclusive if the lines
            // intersect.  If the fractional calculation is larger than 1 or smaller
            // than 0 the lines would need to be longer to intersect.
            if (ua >= 0.0 && ua <= 1.0 && ub >= 0.0 && ub <= 1.0)
            {
                var intersection = {
                    x: ps1.x + (ua * (pe1.x - ps1.x)),
                    y: ps1.y + (ua * (pe1.y - ps1.y))
                }
                return intersection;
            }
            return null;
        }
    
        function segRectInter(p1, p2, rect) {
            var intersection = null;
            var r1 = {x: rect.x1, y: rect.y1}
            var r2 = {x: rect.x2, y: rect.y1}
            var r3 = {x: rect.x2, y: rect.y2}
            var r4 = {x: rect.x1, y: rect.y2}
            intersection = segInter(p1,p2,r1,r2);
            if (intersection == null)
                intersection = segInter(p1,p2,r2,r3);
            if (intersection == null)
                intersection = segInter(p1,p2,r3,r4);
            if (intersection == null)
                intersection = segInter(p1,p2,r4,r1);
            return intersection;
        }

        function drawDebug() {
            if (!showDebugInfo)
                return
            
            var fontSize = 11
            context.font = fontSize + 'px Helvetica'
            context.fillStyle = '#b9bbbe'
            var text = 'x: ' + offsetX + '\n' +
                        'y: ' + offsetY + '\n' +
                        'selected steps: [' + (selectedSteps.length > 0 ? selectedSteps.aggregate(e => e.name, (e1, e2) => e1 + ', ' + e2) : '') + ']'
            var lines = text.split('\n')
            for (var i = 0; i < lines.length; i++) {
                if (lines[i])
                    context.fillText(lines[i], 10, 10 + (i + 1) * fontSize)
            }
        }
        
        this.loadProject = loadProject
    
        function loadProject(project) {
            settings = new Settings(project.settings.projectName, project.settings.startingStep)
            steps.length = 0
            for (var i = 0; i < project.steps.length; i++) {
                var step = project.steps[i]
                var stepToAdd = new Step(step.name, step.x, step.y, step.paragraphs, step.onDisplay)
                steps.push(stepToAdd)
            }
            
            selectStep(null)
            
            saveProjectIntoLocalStorage()
        }
    
        this.exportProject = exportProject
    
        function exportProject() {
            var project = {}
            project.settings = JSON.parse(JSON.stringify(settings))
            project.steps = JSON.parse(JSON.stringify(steps))
            return project
        }
    
        this.createJs = createJs
        
        function createJs(loadWithoutReady) {
            var compiledTemplate = _.template(Templates['exportationTemplate.ejs'])
            var project = exportProject()
            project.escapeString = function(str) {
                return str.replace(/\'/g, '\\\'').replace(/(?:\r\n|\r|\n)/g, '<br>')
            }
            project.loadWithoutReady = loadWithoutReady
            return compiledTemplate(project)
        }
    
        function tryLoadFromLocalStorage() {
            try {
                var projectAsJson = localStorage.getItem('currentProject')
                if (projectAsJson) {
                    loadProject(JSON.parse(projectAsJson))
                } else {
                    return false
                }
            } catch (exception) {
                console.error(exception)
                return false
            }
            return true
        }
    
        function saveProjectIntoLocalStorage() {
            localStorage.setItem('currentProject', JSON.stringify(exportProject()))
        }
    
        function Settings(projectName, startingStep) {
            this.projectName = projectName
            this.startingStep = startingStep
        }
    
        function Step(name, x, y, paragraphs, onDisplay) {
            var _name
            var _self = this
            Object.defineProperty(this, 'name', {
                get: function() { return _name },
                set: function(value) {
                    if (value == '') {
                        value = '.'
                    }
                    var nameCount = 0
                    for (var i = 0; i < steps.length; i++) {
                        if (steps[i] !== _self && steps[i].name == value + (nameCount === 0 ? '' : '_' + nameCount)) {
                            nameCount++
                        }
                    }
                    var previousName = _name
                    if (nameCount === 0) {
                        _name = value
                    } else {
                        _name = value + '_' + nameCount
                    }
    
                    if (settings.startingStep === previousName) {
                        settings.startingStep = _name
                    }
    
                    for (var i = 0; i < steps.length; i++) {
                        for (var j = 0; j < steps[i].paragraphs.length; j++) {
                            var paragraph = steps[i].paragraphs[j]
                            if (paragraph.type === 'path' && paragraph.toStep === previousName) {
                                paragraph.toStep = _name
                            }
                        }
                    }
                },
                enumerable: true
            })
            this.name = name
            this.x = x || 0
            this.y = y || 0
            this.paragraphs = paragraphs || []
            this.onDisplay = onDisplay || ''
        }
    }
})(interact, jQuery, window);