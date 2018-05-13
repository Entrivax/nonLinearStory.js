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
                new NLSAction(function (story) {
                    if (story['passéParLà'] == 0)
                        return 'Mais je suis déjà passé par là !';
                    else
                        return 'Ça va faire ' + (story['passéParLà'] + 1) + ' fois que je vais cliquer ici !';
                }, 'step4', function(story) {
                    story['passéParLà'] += 1;
                }, function(story) {
                    return story['jeuTerminé'] > 0;
                }),
            ]),
            new NLSStep('step4', [
                'Oui.',
                new NLSAction('Terminer le jeu.', 'startStep', function(story) {
                    story['jeuTerminé'] += 1;
                }),
            ]),
        ]);
        story['jeuTerminé'] = 0;
        story['jeuCommencé'] = 0;
        story['passéParLà'] = 0;
        var nls = new NonLinearStory(story, {
            baseSelector: 'nls',
            initialStep: 'startStep',
            outAnimationClass: 'fade-out',
            outAnimationDuration: 200,
            inAnimationClass: 'fade-in',
            inAnimationDuration: 200,
        });
    });
})(jQuery);
