;(function($) {
    $(document).ready(function() {
        var story = new NLSStory([
            new NLSStep('startStep', [
                function (story) { return 'Bienvenue dans ce jeu ! Vous l\'avez terminé ' + story['jeuTerminé'] + ' fois et commencé ' + story['jeuCommencé'] + ' fois.' },
                new NLSAction('Cliquez ici pour commencer le jeu.', 'step1', function(story) {
                    story['jeuCommencé'] += 1;
                }),
            ]),
            new NLSStep('step1', [
                'Bien, vous savez suivre des instructions, c\'est déjà pas trop mal !',
                new NLSAction('Dire coucou.', 'step2'),
                new NLSAction('Recommencer.', 'startStep'),
            ]),
            new NLSStep('step2', [
                'Oh, et bien coucou.',
                new NLSAction('Demander comment ça va.', 'step3'),
            ]),
            new NLSStep('step3', [
                'Mmmh, ça va.',
                new NLSAction('Terminer le jeu.', 'startStep', function(story) {
                    story['jeuTerminé'] += 1;
                }),
            ]),
        ]);
        story['jeuTerminé'] = 0;
        story['jeuCommencé'] = 0;
        $('nls').nonLinearStory(story, 'startStep');
    });
})(jQuery);
