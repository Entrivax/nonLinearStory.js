;(function($) {
    $(document).ready(function() {
        var story = new NLSStory([
            new NLSStep('startStep', [
                'This is the game beginning.',
                new NLSAction('Click here to start the game.', 'step1', undefined, undefined, '#choices'),
            ]),
            new NLSStep('step1', [
                'You just start the game!',
                new NLSAction('Say hello.', 'step2', undefined, undefined, '#choices'),
                new NLSAction('Restart.', 'startStep', undefined, undefined, '#choices'),
            ]),
            new NLSStep('step2', [
                'Hello !',
                new NLSAction('Restart.', 'startStep', undefined, undefined, '#choices'),
            ]),
        ]);
        var nls = new NonLinearStory(story, {
            baseSelector: '#text1',
            initialStep: 'startStep',
            outAnimationClass: 'fade-out',
            outAnimationDuration: 200,
            inAnimationClass: 'fade-in',
            inAnimationDuration: 200,
        });

        nls.start();
    });
})(jQuery);
