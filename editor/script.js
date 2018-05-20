;(function(interact, $, window){
    'use strict';

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
        movingElement

    $(function() {
        lateralMenu = $('#lateral-menu')
        canvas = $('#grid')[0]
        canvas.height = $(window).height()
        canvas.width = $(window).width()
        context = canvas.getContext('2d')

        drawGrid()
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

        $(window).resize(function() {
            canvas.height = $(window).height()
            canvas.width = $(window).width()
            redraw()
        })

        $('#grid').on('wheel', function() {
            zoom += -event.deltaY / 1000
            zoom = zoom < 0.1 ? 0.1 : (zoom > 5 ? 5 : zoom)
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

        steps.push(new Step('pouet', 5, 10))

        redraw()
    })

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
        movingElement = undefined
    }

    function newStep(x, y) {
        var step = new Step(
            'newStep',
            x,
            y,
        )

        steps.push(step)
        selectStep(step)
        redraw()
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
            })
            sortable.appendTo(container)
            var button = $('<button class="add-button"><i class="fas fa-plus"></i></button>')
            button.appendTo(container)
            return container
        }

        var nameInput = createTextInput('Step name:', 'The name of the step', selectedStep.name)

        var paragraphs = createParagraphsContainer('Paragraphs:')
        paragraphs.find('ul').on('change', updateStepInfos)
        paragraphs.find('button').click(function() {
            showContextMenu('lateral-menu-context-menu', event.pageX, event.pageY, [
                {
                    text: 'New text element',
                    onClick: function() {
                        var container = $('<li class="text-element"><i class="fas fa-sort"></i> <span>Text:</span> <span class="remove-button"><i class="fas fa-times"></i></span><textarea></textarea></li>')
                        container.find('.remove-button').click(function() {
                            container.remove()
                            updateStepInfos()
                        })
                        container.appendTo(paragraphs.find('ul'))
                        updateStepInfos()
                    }
                },
                {
                    text: 'New path',
                    onClick: function() {
                        var container = $('<li class="path-element"><i class="fas fa-sort"></i> <span>Path:</span> <span class="remove-button"><i class="fas fa-times"></i></span><div class="path-params"></div></li>')
                        container.find('.remove-button').click(function() {
                            container.remove()
                            updateStepInfos()
                        })
                        var select = $('<select></select>')
                        for (var i = 0; i < steps.length; i++) {
                            var option = $('<option></option>')
                            option.text(steps[i].name)
                            option.val(steps[i].name)
                            option.appendTo(select)
                        }
                        select.change(updateStepInfos)
                        
                        var textArea = $('<textarea></textarea>')
                        textArea.change(updateStepInfos)
                        
                        var pathParamsContainer = container.find('.path-params')
                        $('<div class="sub-title">Target step:</div>').appendTo(pathParamsContainer)
                        select.appendTo(pathParamsContainer)
                        $('<div class="sub-title">Text:</div>').appendTo(pathParamsContainer)
                        textArea.appendTo(pathParamsContainer)
                        container.appendTo(paragraphs.find('ul'))
                        select.customSelect()
                        updateStepInfos()
                    }
                }
            ])
        })

        for (var i = 0; i < selectedStep.paragraphs.length; i++) {
            var paragraph = selectedStep.paragraphs[i]
            if (paragraph.type === 'text') {
                var textarea = $('<textarea></textarea>')
                textarea.change(updateStepInfos)
                textarea.val(paragraph.text)
                var container = $('<li class="text-element"><i class="fas fa-sort"></i> <span>Text:</span> <span class="remove-button"><i class="fas fa-times"></i></span></li>')
                container.find('.remove-button').click(function() {
                    container.remove()
                    updateStepInfos()
                })
                textarea.appendTo(container)
                container.appendTo(paragraphs.find('ul'))
            } else if (paragraph.type === 'path') {
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
                    option.appendTo(select)
                }

                select.val(paragraph.toStep || steps[0].name)
                select.change(updateStepInfos)
                        
                var textArea = $('<textarea></textarea>')
                textArea.val(paragraph.text)
                textArea.change(updateStepInfos)
                
                var pathParamsContainer = container.find('.path-params')
                $('<div class="sub-title">Target step:</div>').appendTo(pathParamsContainer)
                select.appendTo(pathParamsContainer)
                $('<div class="sub-title">Text:</div>').appendTo(pathParamsContainer)
                textArea.appendTo(pathParamsContainer)
                container.appendTo(paragraphs.find('ul'))
                select.customSelect()
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
                        text: $element.find('textarea').val()
                    })
                } else if ($element.hasClass('path-element')) {
                    var targetStepName = $element.find('select').val()
                    selectedStep.paragraphs.push({
                        type: 'path',
                        toStep: targetStepName,
                        text: $element.find('textarea').val()
                    })
                }
            }

            redraw()
        }

        nameInput.appendTo(lateralMenu)
        paragraphs.appendTo(lateralMenu)
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


    function Step(name, x, y, paragraphs) {
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

                for (var i = 0; i < steps.length; i++) {
                    for (var j = 0; j < steps[i].paragraphs.length; j++) {
                        var paragraph = steps[i].paragraphs[j]
                        if (paragraph.type === 'path' && paragraph.toStep === previousName) {
                            paragraph.toStep = _name
                        }
                    }
                }
            }
        })
        this.name = name
        this.x = x || 0
        this.y = y || 0
        this.paragraphs = paragraphs || []
    }
})(interact, jQuery, window)