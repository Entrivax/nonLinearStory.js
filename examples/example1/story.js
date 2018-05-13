;(function($) {
    $(document).ready(function() {
        var story = new NLSStory([
            new NLSStep('startStep', [
                function (nls) { return 'Bienvenue dans ce jeu ! Vous l\'avez terminé ' + nls.get('jeuTerminé') + ' fois et commencé ' + nls.get('jeuCommencé') + ' fois.' },
                new NLSAction('Cliquez ici pour commencer le jeu.', 'step1', function(nls) {
                    nls.set('jeuCommencé', nls.get('jeuCommencé') + 1);
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
                new NLSAction('Terminer le jeu.', 'startStep', function(nls) {
                    nls.set('jeuTerminé', nls.get('jeuTerminé') + 1);
                }),
                new NLSAction(function (nls) {
                    if (nls.get('passéParLà') == 0)
                        return 'Mais je suis déjà passé par là !';
                    else
                        return 'Ça va faire ' + (nls.get('passéParLà') + 1) + ' fois que je vais cliquer ici !';
                }, 'step4', function(nls) {
                    nls.set('passéParLà', nls.get('passéParLà') + 1);
                }, function(nls) {
                    return nls.get('jeuTerminé') > 0;
                }),
            ]),
            new NLSStep('step4', [
                'Oui.',
                new NLSAction('Terminer le jeu.', 'startStep', function(nls) {
                    nls.set('jeuTerminé', nls.get('jeuTerminé') + 1);
                }),
            ]),
        ]);
        var nls = new NonLinearStory(story, {
            baseSelector: 'nls',
            initialStep: 'startStep',
            outAnimationClass: 'fade-out',
            outAnimationDuration: 200,
            inAnimationClass: 'fade-in',
            inAnimationDuration: 200,
        });

        nls.set('jeuTerminé', 0);
        nls.set('jeuCommencé', 0);
        nls.set('passéParLà', 0);

        nls.start();
    });
})(jQuery);
