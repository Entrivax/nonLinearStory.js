;(function($) {

    function NonLinearStory(element, story, initialStep) {
        var _self = this;
        _self.element = $(element);
        _self.history = story;

        _self.displayStep = function(step) {
            _self.element.fadeOut(200, function() {
                if (typeof step.onDisplay === 'function')
                    step.onDisplay(_self.history);
                var elem = _self.element.empty();
                for (var i = 0; i < step.elements.length; i++) {
                    (function (i) {
                        var e = step.elements[i];
                        if (typeof e === 'function')
                            e = e(_self.history);
                        if (typeof e === 'object' && e instanceof NLSAction) {
                            $('<div class="action">' + step.elements[i].displayedName + '</div>')
                                .bind('click', function() {
                                    if (typeof step.elements[i].onClick === 'function')
                                        step.elements[i].onClick(_self.history);

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
})(jQuery);

/**
 * Describe an action of an NLHStep
 * @constructor NLHAction
 * @param {string} displayedName Name put in link
 * @param {string|function(NLSStory)} goToStep Name of the step to go, or a function returning the name of the step to go as string
 * @param {function(NLSStory)} onClick Function executed when option is clicked
 */
function NLSAction(displayedName, goToStep, onClick) {
    this.displayedName = displayedName;
    this.goToStep = goToStep;
    this.onClick = onClick;

    return this;
}

/**
 * Describe a step of an NLSStory
 * @constructor NLHStep
 * @param {string} name The name of the step
 * @param {string[]|function(NLSStory)[]|NLSAction[]} elements The html representing the step, or actions, or a function returning the html to display or an action
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
 * @constructor NLHStory
 * @param {NLSStep[]} steps List of steps composing an story
 */
function NLSStory(steps) {
    this.steps = steps;

    return this;
}