Templates = {}

;(function(interact, $, window){
    'use strict';

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
            selectedStep,
            movingElement,
            settings = new Settings(),
            settingsModal
    
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
        }
    
        function initSettingsModal() {
            settingsModal = $('<div></div>')
            var row = $('<div class="row"></div>')
            $('<div class="col-xs-12">Starting step:</div>').appendTo(row)
            var inputContainer = $('<div class="col-xs-12"></div>')
            var input = $('<select id="starting-step"></select>')
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
            if (movingElement === undefined) {
                offsetX += event.dx
                offsetY += event.dy
            } else {
                movingElement.element.x = Math.floor((event.pageX - offsetX - movingElement.mouseElementOffsetX) / (gridSize * zoom))
                movingElement.element.y = Math.floor((event.pageY - offsetY - movingElement.mouseElementOffsetY) / (gridSize * zoom))
            }
            redraw()
        }
    
        function onDragStart(event) {
            for (var i = steps.length - 1; i >= 0; i--) {
                var stepRectangle = getStepRectangle(steps[i])
                if (event.x0 >= stepRectangle.x1 && event.x0 <= stepRectangle.x2 &&
                    event.y0 >= stepRectangle.y1 && event.y0 <= stepRectangle.y2) {
                        movingElement = {
                            element: steps[i],
                            mouseElementOffsetX: event.x0 - stepRectangle.x1,
                            mouseElementOffsetY: event.y0 - stepRectangle.y1,
                        }
                        break
                    }
            }
        }
    
        function onDragEnd(event) {
            if (movingElement)
                saveProjectIntoLocalStorage()
            movingElement = undefined
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
            if (selectedStep == null)
                return
            
            for (var i = 0; i < steps.length; i++) {
                var step = steps[i]
                for (var j = 0; j < step.paragraphs.length; j++) {
                    var paragraph = step.paragraphs[j]
                    if (paragraph.type === 'path' && paragraph.toStep === selectedStep.name) {
                        paragraph.toStep = null
                    }
                }
            }
    
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
            
            selectStep(null)
            saveProjectIntoLocalStorage()
        }
    
        function onClick(event) {
            for (var i = steps.length - 1; i >= 0; i--) {
                var stepRectangle = getStepRectangle(steps[i])
                if (event.x >= stepRectangle.x1 && event.x <= stepRectangle.x2 &&
                    event.y >= stepRectangle.y1 && event.y <= stepRectangle.y2) {
                        selectStep(steps[i])
                        break
                    }
            }
            if (i < 0) {
                selectStep(null)
            }
        }
    
        function selectStep(step) {
            selectedStep = step
            updateLateralMenu()
            redraw()
        }
    
        function updateLateralMenu() {
            lateralMenu.empty()
            if (selectedStep == null) {
                lateralMenu.hide(100)
                return
            }
            
            function createTextInput(labelText, inputPlaceholder, initialValue) {
                var container = $('<div class="input-field"></div>')
                var label = $('<label></label>')
                label.text(labelText)
                label.appendTo(container)
                var input = $('<input type="text">')
                input.attr('placeholder', inputPlaceholder)
                input.appendTo(container)
                input.change(updateStepInfos)
                input.val(initialValue)
                return container
            }
    
            function createParagraphsContainer(labelText) {
                var container = $('<div class="input-field sortable"></div>')
                var label = $('<label></label>')
                label.text(labelText)
                label.appendTo(container)
                var sortable = $('<ul></ul>')
                sortable.sortable({
                    placeholder: 'sortable-placeholder',
                    update: updateStepInfos
                })
                sortable.appendTo(container)
                var button = $('<button class="add-button"><i class="fas fa-plus"></i></button>')
                button.appendTo(container)
                return container
            }
    
            function createExtraContainer(onDisplayLabel, onDisplay, onDisplayPlaceholder) {
                var extraContent = $('<div class="expansion"></div>')
                extraContent.hide()
        
                var expander = $('<div class="expander"><i class="fas fa-angle-down"></i></div>')
                expander.click(function() {
                    var $this = $(this)
                    if ($this.hasClass('close')) {
                        extraContent.slideUp(300)
                        $this.removeClass('close')
                    } else {
                        extraContent.slideDown(300)
                        $this.addClass('close')
                    }
                })
    
                var container = $('<div class="additionnal-params"></div>')
                var label = $('<div class="sub-title"></div>')
                label.text(onDisplayLabel)
                label.appendTo(container)
                var input = $('<textarea class="onDisplay"></textarea>')
                input.attr('placeholder', onDisplayPlaceholder)
                input.appendTo(container)
                input.change(updateStepInfos)
                input.val(onDisplay)
    
                container.appendTo(extraContent)
    
                return [expander, extraContent]
            }
    
            var nameInput = createTextInput('Step name:', 'The name of the step', selectedStep.name)
    
            var paragraphs = createParagraphsContainer('Paragraphs:')
            paragraphs.find('ul').on('change', updateStepInfos)
            paragraphs.find('button').click(function(event) {
                showContextMenu('lateral-menu-context-menu', event.pageX, event.pageY, [
                    {
                        text: 'New text element',
                        onClick: function() {
                            createTextParagraph(null)
                            updateStepInfos()
                        }
                    },
                    {
                        text: 'New path',
                        onClick: function() {
                            createPathParagraph(null)
                            updateStepInfos()
                        }
                    }
                ])
            })
    
            var extraContainer = createExtraContainer('On display:', selectedStep.onDisplay, 'Javascript code here...')
    
            function createTextParagraph(paragraph) {
                var container = $('<li class="text-element"><i class="fas fa-sort"></i> <span>Text:</span> <span class="remove-button"><i class="fas fa-times"></i></span><div class="path-params"></div></li>')
                container.find('.remove-button').click(function() {
                    container.remove()
                    updateStepInfos()
                })
    
                var paramsContainer = container.find('.path-params')
                        
                var label = $('<div class="sub-title"></div>')
                label.text('Text:')
                label.appendTo(paramsContainer)
                
                var textarea = $('<textarea class="textTextArea"></textarea>')
                textarea.change(updateStepInfos)
                textarea.val(paragraph ? paragraph.text : '')
                textarea.appendTo(paramsContainer)
    
                var checkbox = $('<input type="checkbox" class="is-text-js">')
                checkbox.change(updateStepInfos)
                checkbox.prop('checked', paragraph ? paragraph.isTextJavascript : false)
                checkbox.appendTo(paramsContainer)
                label = $('<span></span>')
                label.text('Is text JavaScript')
                label.appendTo(paramsContainer)
    
                var extraContent = $('<div class="expansion"></div>')
                extraContent.hide()
    
                var expander = $('<div class="expander"><i class="fas fa-angle-down"></i></div>')
                expander.click(function() {
                    var $this = $(this)
                    if ($this.hasClass('close')) {
                        extraContent.slideUp(300)
                        $this.removeClass('close')
                    } else {
                        extraContent.slideDown(300)
                        $this.addClass('close')
                    }
                })
    
                label = $('<div class="sub-title"></div>')
                label.text('Is visible:')
                label.appendTo(extraContent)
                var input = $('<textarea class="isVisible"></textarea>')
                input.attr('placeholder', 'Javascript code here... (must return boolean)')
                input.appendTo(extraContent)
                input.val(paragraph ? paragraph.isVisible : '')
                input.change(updateStepInfos)
    
                expander.appendTo(paramsContainer)
                extraContent.appendTo(paramsContainer)
    
                paramsContainer.appendTo(container)
    
                container.appendTo(paragraphs.find('ul'))
            }
    
            function createPathParagraph(paragraph) {
                var container = $('<li class="path-element"><i class="fas fa-sort"></i> <span>Path:</span> <span class="remove-button"><i class="fas fa-times"></i></span><div class="path-params"></div></li>')
                container.find('.remove-button').click(function() {
                    container.remove()
                    updateStepInfos()
                })
    
                var select = $('<select></select>')
    
                for (var j = 0; j < steps.length; j++) {
                    var option = $('<option></option>')
                    option.text(steps[j].name)
                    option.val(steps[j].name)
                    if (paragraph && steps[j].name === paragraph.toStep) {
                        option.attr('selected', 'selected')
                    }
                    option.appendTo(select)
                }
    
                select.change(updateStepInfos)
                
                var paramsContainer = container.find('.path-params')
    
                var textArea = $('<textarea class="textTextArea"></textarea>')
                textArea.val(paragraph ? paragraph.text : '')
                textArea.change(updateStepInfos)
    
                $('<div class="sub-title">Target step:</div>').appendTo(paramsContainer)
                select.appendTo(paramsContainer)
                $('<div class="sub-title">Text:</div>').appendTo(paramsContainer)
                textArea.appendTo(paramsContainer)
    
                var checkbox = $('<input type="checkbox" class="is-text-js">')
                checkbox.change(updateStepInfos)
                checkbox.prop('checked', paragraph ? paragraph.isTextJavascript : false)
                checkbox.appendTo(paramsContainer)
                var label = $('<span></span>')
                label.text('Is text JavaScript')
                label.appendTo(paramsContainer)
    
                var extraContent2 = $('<div class="expansion"></div>')
                extraContent2.hide()
    
                var expander = $('<div class="expander"><i class="fas fa-angle-down"></i></div>')
                expander.click(function() {
                    var $this = $(this)
                    if ($this.hasClass('close')) {
                        extraContent2.slideUp(300)
                        $this.removeClass('close')
                    } else {
                        extraContent2.slideDown(300)
                        $this.addClass('close')
                    }
                })
    
                $('<div class="sub-title">On click:</div>').appendTo(extraContent2)
                var onClickTextArea = $('<textarea class="onclick"></textarea>')
                onClickTextArea.attr('placeholder', 'Javascript code here...')
                onClickTextArea.val(paragraph ? paragraph.onClick : '')
                onClickTextArea.change(updateStepInfos)
                onClickTextArea.appendTo(extraContent2)
                        
                label = $('<div class="sub-title"></div>')
                label.text('Is visible:')
                label.appendTo(extraContent2)
                var input = $('<textarea class="isVisible"></textarea>')
                input.attr('placeholder', 'Javascript code here... (must return boolean)')
                input.appendTo(extraContent2)
                input.change(updateStepInfos)
                input.val(paragraph ? paragraph.isVisible : '')
    
                expander.appendTo(paramsContainer)
                extraContent2.appendTo(paramsContainer)
    
                container.appendTo(paragraphs.find('ul'))
                select.customSelect({
                    placeholder: '<span>Please select a step</span>'
                })
            }
    
            for (var i = 0; i < selectedStep.paragraphs.length; i++) {
                var paragraph = selectedStep.paragraphs[i]
                if (paragraph.type === 'text') {
                    createTextParagraph(paragraph)
                } else if (paragraph.type === 'path') {
                    createPathParagraph(paragraph)
                }
            }
            
            function updateStepInfos() {
                selectedStep.name = nameInput.find('input').val()
                nameInput.find('input').val(selectedStep.name)
    
                var elements = paragraphs.find('li.text-element, li.path-element')
                selectedStep.paragraphs.length = 0
                for (var i = 0; i < elements.length; i++) {
                    var $element = $(elements[i])
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
                            onClick: $element.find('.onclick').val(),
                            isVisible: $element.find('textarea.isVisible').val(),
                            isTextJavascript: $element.find('input.is-text-js').prop('checked'),
                        })
                    }
                }
    
                selectedStep.onDisplay = extraContainer[1].find('.onDisplay').val()
                selectedStep.isVisible = extraContainer[1].find('.isVisible').val()
    
                saveProjectIntoLocalStorage()
    
                redraw()
            }
    
            nameInput.appendTo(lateralMenu)
            paragraphs.appendTo(lateralMenu)
            extraContainer[0].appendTo(lateralMenu)
            extraContainer[1].appendTo(lateralMenu)
            lateralMenu.show(100)
        }
    
        function redraw() {
            drawGrid()
            drawSteps()
            drawLinks()
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
                if (step == selectedStep) {
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
        
        this.loadProject = loadProject
    
        function loadProject(project) {
            settings = new Settings(project.settings.startingStep)
            steps.length = 0
            for (var i = 0; i < project.steps.length; i++) {
                var step = project.steps[i]
                var stepToAdd = new Step(step.name, step.x, step.y, step.paragraphs, step.onDisplay)
                steps.push(stepToAdd)
            }
    
            selectStep(null)
        }
    
        this.exportProject = exportProject
    
        function exportProject() {
            var project = {}
            project.settings = JSON.parse(JSON.stringify(settings))
            project.steps = JSON.parse(JSON.stringify(steps))
            return project
        }
    
        this.createJs = createJs
        
        function createJs() {
            var compiledTemplate = _.template(exportationTemplate())
            var project = exportProject()
            project.escapeString = function(str) {
                return str.replace(/\'/g, '\\\'').replace(/(?:\r\n|\r|\n)/g, '<br>')
            }
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
    
        function Settings(startingStep) {
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
    
        function exportationTemplate() {
            return Templates['exportationTemplate.ejs']
                .join('\n')
                .replace(/(?:\s*)(\<%(?!=).*)/g, '$1') // Replace whitespace only occupied by logic in template
        }
    }
})(interact, jQuery, window);