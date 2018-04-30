;(function($) {
    'use strict';

    if (!$) {
        return console.warn('jQuery not detected!');
    }

    function NonLinearStory(element, story, initialStep) {
        var _self = this;
        _self.element = $(element);
        _self.story = story;

        _self.displayStep = function(step) {
            _self.element.fadeOut(200, function() {
                if (typeof step.onDisplay === 'function')
                    step.onDisplay(_self.story);
                var elem = _self.element.empty();
                for (var i = 0; i < step.elements.length; i++) {
                    (function (i) {
                        var e = step.elements[i];
                        if (typeof e === 'function')
                            e = e(_self.story);
                        if (typeof e === 'object' && e instanceof NLSAction) {
                            if (!e.isVisible || (typeof e.isVisible === 'function' && e.isVisible(_self.story))) {
                                var displayedName = step.elements[i].displayedName;
                                if (typeof displayedName === 'function')
                                    displayedName = displayedName(_self.story);

                                $('<div class="action">' + displayedName + '</div>')
                                    .bind('click', function() {
                                        if (typeof step.elements[i].onClick === 'function')
                                            step.elements[i].onClick(_self.story);
    
                                        var stepToGo = '';
    
                                        if (typeof step.elements[i].goToStep === 'string') {
                                            stepToGo = step.elements[i].goToStep;
                                        } else if (typeof step.elements[i].goToStep === 'function') {
                                            stepToGo = step.elements[i].goToStep(story);
                                        }
    
                                        var stepObject = _self.getStep(stepToGo);
    
                                        if (stepObject !== undefined) {
                                            _self.displayStep(stepObject);
                                        } else {
                                            console.error('Step ' + stepToGo + ' not found!');
                                        }
                                    }).appendTo(elem);
                            }
                        } else {
                            var elemToAppend = $('<div class="element"></div>');
                            elemToAppend.html(e);
                            elemToAppend.appendTo(elem);
                        }
                    })(i);
                }
                _self.element.fadeIn(200);
            })
        };

        _self.getStep = function(stepName) {
            for (var j = 0; j < story.steps.length; j++) {
                if (story.steps[j].name === stepName) {
                    return story.steps[j];
                }
            }
        };

        _self.init(initialStep);
    }

    NonLinearStory.prototype.init = function(initialStep) {
        if (typeof initialStep === 'string') {
            this.displayStep(this.getStep(initialStep));
        } else {
            this.displayStep(initialStep);
        }
    };

    $.fn.nonLinearStory = plugin_nonLinearStory;

    /**
     * 
     * @param {NLSStory} story The story
     * @param {NLSStep|string} initialStep The initial step object or the name of the initial step
     */
    function plugin_nonLinearStory(story, initialStep) {
        return this.each(function() {
            if (!$.data(this, 'plugin_nonLinearStory')) {
                $.data(this, 'plugin_nonLinearStory', 
                new NonLinearStory(this, story, initialStep));
            }
        });
    }
})(window.jQuery);

/**
 * Function returning the html to display
 * @callback HtmlToDisplayCallback
 * @param {NLSStory} story The story
 * @return {string} The html discribing the element
 */

/**
 * Function returning the name of the step to go as string
 * @callback StepNameCallback
 * @param {NLSStory} story The story
 * @returns {string} The name of the step
 */

/**
 * Function returning if the element is visible or not
 * @callback IsVisibleCallback
 * @param {NLSStory} story The story
 * @returns {boolean} Is element visible
 */

/**
 * Describe an action of an NLHStep
 * @constructor NLSAction
 * @param {string|HtmlToDisplayCallback} displayedName Name put in link
 * @param {string|StepNameCallback} goToStep Name of the step to go, or a function returning the name of the step to go as string
 * @param {function(NLSStory)} onClick Function executed when option is clicked
 * @param {IsVisibleCallback} isVisible Function executed at NLSStep display to know if action is visible
 */
function NLSAction(displayedName, goToStep, onClick, isVisible) {
    this.displayedName = displayedName;
    this.goToStep = goToStep;
    this.isVisible = isVisible;
    this.onClick = onClick;

    return this;
}

/**
 * Describe a step of an NLSStory
 * @constructor NLSStep
 * @param {string} name The name of the step
 * @param {Array<string | HtmlToDisplayCallback | NLSAction>} elements The html representing the step, or actions, or a function returning the html to display or an action
 * @param {function(NLSStory)} onDisplay Function to execute when step is displayed
 */
function NLSStep(name, elements, onDisplay) {
    this.name = name;
    this.elements = elements;
    this.onDisplay = onDisplay;

    return this;
}

/**
 * Describe an story
 * @constructor NLSStory
 * @param {NLSStep[]} steps List of steps composing an story
 */
function NLSStory(steps) {
    this.steps = steps;

    return this;
}