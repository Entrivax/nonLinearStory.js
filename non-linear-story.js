;(function($, window) {
    'use strict';

    if (!$) {
        return console.warn('jQuery not detected!');
    }

    function timer(delay) {
        var deferred = $.Deferred();
        setTimeout(function() {
            deferred.resolve();
        }, delay);
        return deferred;
    }

    /**
     * Options of NonLinearStory
     * @typedef {Object} NonLinearStoryOptions
     * @property {string} baseSelector Selector used to place steps texts if not defined
     * @property {string} initialStep Initial step of the story
     * @property {string} outAnimationClass Animation class used to hide elements
     * @property {number} outAnimationDuration Animation duration used to hide elements
     * @property {string} inAnimationClass Animation class used to show elements
     * @property {number} inAnimationDuration Animation duration used to show elements
     */

    /**
     * Constructor of a NonLinearStory
     * @constructor NonLinearStory
     * @param {NLSStory} story The story
     * @param {NonLinearStoryOptions} options Options of NonLinearStory
     */
    function NonLinearStory(story, options) {
        var _self = this;
        _self.story = story;
        _self.options = $.extend({
            baseSelector: 'body', // Selector used to place steps texts if not defined
            initialStep: 'start', // Initial step of the story
            outAnimationClass: null, // Animation class used to hide elements
            outAnimationDuration: 0, // Animation duration used to hide elements
            inAnimationClass: null, // Animation class used to show elements
            inAnimationDuration: 0, // Animation duration used to show elements
        }, options);

        var canUseAction = true;
        var shownElements = [];
        var currentStep = undefined;
        var variables = {};

        /**
         * Describe a step change event
         * @constructor NLSStepChangeEvent
         * @param {string} previousStep The previous step
         * @param {string} currentStep The current step
         * @param {NonLinearStory} nlsInstance The current instance of NonLinearStory
         */
        function NLSStepChangeEvent(previousStep, currentStep, nlsInstance) {
            this.previousStep = previousStep;
            this.currentStep = currentStep;
            this.nlsInstance = nlsInstance;

            return this;
        }

        /**
         * @returns {string} The name of the current step
         */
        _self.getCurrentStepName = function() {
            return currentStep.name;
        };

        /**
         * @returns {Array<string>} The list of defined variables
         */
        _self.getVariables = function() {
            return Object.keys(variables);
        };

        /**
         * Get the value from the variable name
         * @param {string} variable The name of the variable to get
         * @returns {*} The value of the variable
         */
        _self.get = function(variable) {
            return variables[variable];
        };

        /**
         * Set the value from the variable name
         * @param {string} variable The name of the variable to set
         * @param {*} value The value to set to the variable
         */
        _self.set = function(variable, value) {
            variables[variable] = value;
        };

        /**
         * Change the displayed step
         * @param {NLSStep} step The step to display
         */
        _self.displayStep = function(step) {
            canUseAction = false;
            var i;
            var deferreds = [];

            for(i = 0; i < shownElements.length; i++) {
                var elem = shownElements[i];

                if (elem.displayOptions.outAnimationClass)
                    elem.element.addClass(elem.displayOptions.outAnimationClass);

                ;(function(elem) {
                    var deferred = timer(elem.displayOptions.outAnimationDuration);
                    deferred.done(function() {
                        elem.element.remove();
                    });
                    deferreds.push(deferred);
                })(elem);
            }

            function onDone() {
                var lastStep = currentStep;
                currentStep = step;

                shownElements = [];
                canUseAction = true;

                var i;
                for (i = 0; i < step.elements.length; i++) {
                    (function(i) {
                        var e = step.elements[i];
                        if (typeof e === 'function')
                            e = e(_self);

                        var displayOptions = {
                            outAnimationClass: _self.options.outAnimationClass,
                            outAnimationDuration: _self.options.outAnimationDuration,
                            inAnimationClass: _self.options.inAnimationClass,
                            inAnimationDuration: _self.options.inAnimationDuration,
                        }

                        if (typeof e === 'string') {
                            var elemToAdd = $('<div class="paragraph"></div>');
                            elemToAdd.html(e);

                            ;(function(elemToAdd) {
                                timer(0).done(function() {
                                    elemToAdd.appendTo(_self.options.baseSelector);
                                });
                                if (displayOptions.inAnimationClass != null) {
                                    elemToAdd.addClass(displayOptions.inAnimationClass);
                                    timer(displayOptions.inAnimationDuration).done(function() {
                                        elemToAdd.removeClass(displayOptions.inAnimationClass);
                                    });
                                }
                            })(elemToAdd);

                            shownElements.push({
                                displayOptions: displayOptions,
                                element: elemToAdd,
                            });

                        } else if (typeof e === 'object' && (e instanceof NLSAction || e instanceof NLSText)) {
                            if (!e.isVisible || (typeof e.isVisible === 'function' && e.isVisible(_self))) {
                                var htmlText = e.html;
                                if (typeof htmlText === 'function')
                                    htmlText = htmlText(_self);

                                var elemToAdd = $('<div class="paragraph"></div>');
                                elemToAdd.html(htmlText);

                                if (e instanceof NLSAction) {
                                    elemToAdd.addClass('action');
                                    elemToAdd.bind('click', function() {
                                        if (!canUseAction) {
                                            return;
                                        }
                                    
                                        if (typeof step.elements[i].onClick === 'function')
                                            step.elements[i].onClick(_self);
    
                                        var stepToGo = '';
    
                                        if (typeof step.elements[i].goToStep === 'string') {
                                            stepToGo = step.elements[i].goToStep;
                                        } else if (typeof step.elements[i].goToStep === 'function') {
                                            stepToGo = step.elements[i].goToStep(_self);
                                        }
    
                                        var stepObject = _self.getStep(stepToGo);
    
                                        if (stepObject !== undefined) {
                                            _self.displayStep(stepObject);
                                        } else {
                                            console.error('Step ' + stepToGo + ' not found!');
                                        }
                                    });
                                }

                                displayOptions = {
                                    outAnimationClass: e.outAnimationClass === undefined ? _self.options.outAnimationClass : e.outAnimationClass,
                                    outAnimationDuration: e.outAnimationDuration === undefined ? _self.options.outAnimationDuration : e.outAnimationDuration,
                                    inAnimationClass: e.inAnimationClass === undefined ? _self.options.inAnimationClass : e.inAnimationClass,
                                    inAnimationDuration: e.inAnimationDuration === undefined ? _self.options.inAnimationDuration : e.inAnimationDuration,
                                };
                                
                                var targetSelector = e.selector !== undefined ? e.selector : _self.options.baseSelector;
                                
                                if (targetSelector == null) {
                                    console.warn('WARNING: no selector defined for element');
                                    return;
                                }

                                var selectedElement = $(targetSelector).eq(0);
                                if (selectedElement.length === 0) {
                                    console.warn('WARNING: element from selector "' + targetSelector + '" not found');
                                    return;
                                }

                                ;(function(elemToAdd, selectedElement) {
                                    timer(0).done(function() {
                                        elemToAdd.appendTo(selectedElement);
                                    });
                                    if (displayOptions.inAnimationClass != null) {
                                        elemToAdd.addClass(displayOptions.inAnimationClass);
                                        timer(displayOptions.inAnimationDuration).done(function() {
                                            elemToAdd.removeClass(displayOptions.inAnimationClass);
                                        });
                                    }
                                })(elemToAdd, selectedElement);

                                shownElements.push({
                                    displayOptions: displayOptions,
                                    element: elemToAdd,
                                });
                            }
                        }
                    })(i);
                }
                
                if (typeof step.onDisplay === 'function')
                    step.onDisplay(new NLSStepChangeEvent(lastStep ? lastStep.name : undefined, currentStep ? currentStep.name : undefined, _self));
            }

            $.when.apply(null, deferreds).done(onDone);
        };

        /**
         * Get the step instance from its step name
         * @param {string} stepName The step name
         * @returns {NLSStep} The instance of the step
         */
        _self.getStep = function(stepName) {
            for (var j = 0; j < story.steps.length; j++) {
                if (story.steps[j].name === stepName) {
                    return story.steps[j];
                }
            }
        };

        /**
         * Start the story
         */
        _self.start = function() {
            if (typeof _self.options.initialStep === 'string') {
                this.displayStep(this.getStep(_self.options.initialStep));
            } else {
                this.displayStep(_self.options.initialStep);
            }
        };
    };

    window.NonLinearStory = NonLinearStory;
})(window.jQuery, window);

/**
 * Function returning the html to display
 * @callback HtmlToDisplayCallback
 * @param {NonLinearStory} nls The NonLinearStory instance
 * @return {string} The html discribing the element
 */

/**
 * Function returning the name of the step to go as string
 * @callback StepNameCallback
 * @param {NonLinearStory} nls The NonLinearStory instance
 * @returns {string} The name of the step
 */

/**
 * Function returning if the element is visible or not
 * @callback IsVisibleCallback
 * @param {NonLinearStory} nls The NonLinearStory instance
 * @returns {boolean} Is element visible
 */

/**
 * Describe a text to display in a NLSStep
 * @constructor NLSText
 * @param {string|HtmlToDisplayCallback} html Html to display
 * @param {IsVisibleCallback} [isVisible] Function executed at NLSStep display to know if text is visible
 * @param {string} [selector] Selector used to display element
 * @param {string} [outAnimationClass] Class to use to hide this element
 * @param {string} [outAnimationDuration] Duration of the hiding class
 * @param {string} [inAnimationClass] Class to use to show this element
 * @param {string} [inAnimationDuration] Duration of the showing class
 */
function NLSText(html, isVisible, selector, outAnimationClass, outAnimationDuration, inAnimationClass, inAnimationDuration) {
    this.html = html;
    this.isVisible = isVisible;
    this.selector = selector;
    this.outAnimationClass = outAnimationClass;
    this.outAnimationDuration = outAnimationDuration;
    this.inAnimationClass = inAnimationClass;
    this.inAnimationDuration = inAnimationDuration;

    return this;
}

/**
 * Describe an action of a NLSStep
 * @constructor NLSAction
 * @param {string|HtmlToDisplayCallback} html Html of the action
 * @param {string|StepNameCallback} goToStep Name of the step to go, or a function returning the name of the step to go as string
 * @param {function(NonLinearStory)} [onClick] Function executed when option is clicked
 * @param {IsVisibleCallback} [isVisible] Function executed at NLSStep display to know if action is visible
 * @param {string} [selector] Selector used to display element
 * @param {string} [outAnimationClass] Class to use to hide this element
 * @param {string} [outAnimationDuration] Duration of the hiding class
 * @param {string} [inAnimationClass] Class to use to show this element
 * @param {string} [inAnimationDuration] Duration of the showing class
 */
function NLSAction(html, goToStep, onClick, isVisible, selector, outAnimationClass, outAnimationDuration, inAnimationClass, inAnimationDuration) {
    this.html = html;
    this.goToStep = goToStep;
    this.isVisible = isVisible;
    this.onClick = onClick;
    this.selector = selector;
    this.outAnimationClass = outAnimationClass;
    this.outAnimationDuration = outAnimationDuration;
    this.inAnimationClass = inAnimationClass;
    this.inAnimationDuration = inAnimationDuration;

    return this;
}

/**
 * Describe a step of an NLSStory
 * @constructor NLSStep
 * @param {string} name The name of the step
 * @param {Array<string | HtmlToDisplayCallback | NLSText | NLSAction>} elements The html representing the step, or actions, or a function returning the html to display or an action
 * @param {function(NLSStepChangeEvent)} [onDisplay] Function to execute when step is displayed
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