# nonLinearStory.js

nonLinearStory.js is a Javascript library to write interactive stories.

## Requirements

- jQuery (tested with >= 1.12, compatible with 3.3.1)

## Installation

```html
<!-- Be sure to have jQuery included -->
<script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
<!-- Include the library -->
<script src="./non-linear-story.js"></script>
```

## How to use

### Hello world

You have to create steps (the screens) of your story.

```javascript
var steps = [
	new NLSStep('start', [
		'Hello world!'
	])
];
```

Then you have to create the object which will contain the data of your story.

```javascript
var story = new NLSStory(steps);
```

Finally, you can instanciate the engine and start it.

```javascript
var nls = new NonLinearStory(story);

nls.start();
```

### Navigation between steps

With the exemple above, there is not a lot of interaction, to change that, we will add more steps and actions allowing navigation between those steps.

```javascript
var steps = [
	new NLSStep('start', [
		'Hi, my name is Jordan, how are you?',
		new NLSAction('I\'m fine and you?', 'fine'),
		new NLSAction('I\'m confused what is happening?', 'confused')
	]),
	new NLSStep('fine', [
		'That\'s pretty nice, so. I\'m fine too! :D',
		new NLSAction('Restart from the beginning', 'start')
	]),
	new NLSStep('confused', [
		'I can imagine, you\'re new here? You are going to learn, it\'s pretty <span style="color: green">simple</span>!',
		new NLSAction('Restart from the beginning', 'start')
	]),
];
```

With this code above, we already wrote three simple steps!

### Write variables

To write some variables into your text, you can pass a function returning a string instead of a plain string.

```javascript
var steps = [
	new NLSStep('start', [
		'Hi, my name is Jordan, what\'s your name?',
		new NLSAction('Hi, my name is Johnson.', 'step1', function(nls) { // This function is executed when the player click on this action
			nls.set('name', 'Johnson'); // We just set a variable named 'name' with the value Johnson
		}),
		new NLSAction('Hi, my name is Jack.', 'step1', function(nls) {
			nls.set('name', 'Jack'); // And here Jack
		})
	]),
	new NLSStep('step1', [
		function(nls) {
			return 'So, ' + nls.get('name') + ', how are you?'; // So we can now write the name of the player!
		},
		new NLSAction(function(nls) { // You can use function here to write variables in the action text too
			return 'Fine, thank you. (So, my name is ' + nls.get('name') + '...)';
		}, 'step2'),
	]),
	new NLSStep('step2', [
		'Have a nice day ' + nls.get('name') + '!'
	])
];
```

### Conditional navigation

There is some ways to influence the road available to the player programmatically.

First, you can use a function to change the step to go :

```javascript
new NLSAction('Hi', function(nls) {
	// A function can be used to determine the step to go when clicked
	if (nls.get('name') === 'Johnson') {
		return 'stepJohnson';
	} else {
		return 'stepOtherName';
	}
})
```

Or, you can hide actions to the player if a condition is not fulfilled

```javascript
// This action will be hidden if the variable 'name' has a value different from 'Johnson'
new NLSAction('My name is not Johnson!', 'step2', undefined, function(nls) {
	return nls.get('name') !== 'Johnson';
})
```

More than that, even texts can be displayed or hidden programmatically.

```javascript
new NLSStep('step2', [
	new NLSText('My name is Johnson!', function(nls) {
		return nls.get('name') === 'Johnson';
	})
])
```

## Constructors

#### `NonLinearStory(story, options)`

- `story` => NLSStory, the story instance
- `options` => NonLinearStoryOptions, ***optional***, the settings of the engine

#### `NLSStory(steps)`

- `steps` => Array<NLSStep>, list of steps of the story

#### `NLSStep(name, elements, onDisplay)`

- `name` => string, the name of the step
- `elements` => Array<string | function(NonLinearStory):string | NLSText | NLSAction>, list of the elements to show
- `onDisplay` => function(NLSStepChangeEvent), ***optional***, function to execute when the step is displayed

#### `NLSAction(html, goToStep, onClick, isVisible, selector, outAnimationClass, outAnimationDuration, inAnimationClass, inAnimationDuration)`

- `html` => string | function(NonLinearStory):string, the html displayed of the action or just plain text
- `goToStep` => string | function(NonLinearStory):string, the step to go to when the player click on this action
- `onClick` => function(NonLinearStory), ***optional***, function executed when the player click on this action
- `isVisible` => function(NonLinearStory):boolean, ***optional***, function executed to know if the action is visible
- `selector` => string, ***optional***, the jQuery selector which must be used to know where to display the action
- `outAnimationClass` => string, ***optional***, hiding animation class for this action
- `outAnimationDuration` => number, ***optional***, hiding animation duration
- `inAnimationClass` => string, ***optional***, showing animation class for this action
- `inAnimationDuration` => number, ***optional***, showing animation duration

#### `NLSText(html, isVisible, selector, outAnimationClass, outAnimationDuration, inAnimationClass, inAnimationDuration)`

- `html` => string | function(NonLinearStory):string, the html displayed of the text or just plain text
- `isVisible` => function(NonLinearStory):boolean, ***optional***, function executed to know if the text is visible
- `selector` => string, ***optional***, the jQuery selector which must be used to know where to display the text
- `outAnimationClass` => string, ***optional***, hiding animation class for this text
- `outAnimationDuration` => number, ***optional***, hiding animation duration
- `inAnimationClass` => string, ***optional***, showing animation class for this text
- `inAnimationDuration` => number, ***optional***, showing animation duration

## Objects

#### `NonLinearStoryOptions`

```javascript
// Default values
var options = {
	baseSelector: 'body', // Selector used to place steps texts if not defined
	initialStep: 'start', // Initial step of the story
	outAnimationClass: null, // Animation class used to hide elements
	outAnimationDuration: 0, // Animation duration used to hide elements
	inAnimationClass: null, // Animation class used to show elements
	inAnimationDuration: 0, // Animation duration used to show elements
};
```

#### `NLSStepChangeEvent`

- `previousStep` => string, the previous step name
- `currentStep` => string, the step being displayed
- `nlsInstance` => NonLinearStory, the instance of the current NonLinearStory