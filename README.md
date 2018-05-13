# nonLinearStory.js

nonLinearStory.js is a Javascript library to write interactive stories.

## Requirements

- jQuery (tested with >= 1.12, compatible with 3.3.1)

## Installation

```html
<!-- Be sure to have jQuery included -->
<script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
<!-- Include the library -->
<script src="./src/non-linear-story.js"></script>
```

## How to use

### Hello world

You have to create steps (the screens) of your story.

```js
var steps = [
	new NLSStep('start', [
		'Hello world!'
	])
];
```

Then you have to create the object which will contain the data of your story.

```js
var story = new NLSStory(steps);
```

Finally, you can instanciate the engine and start it.

```js
var nls = new NonLinearStory(story);

nls.start();
```

### Navigation between steps

With the exemple above, there is not a lot of interaction, to change that, we will add more steps and actions allowing navigation between those steps.

```js
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