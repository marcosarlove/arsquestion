document.addEventListener('DOMContentLoaded', async () => {
    const QUIZ_FILES = [
        'acentuacao_grafica.json',
        'formas_de_tratamento.json',
        'pronominalizacao.json',
        'sintaxe_oracoes.json',
        'verbos.json',
        'verbos_conjugacao.json',
        'conceitos_narrativos.json',
        'morfologia.json',
        'regras_de_pontuacao.json',
        'sintaxe_termos_da_oracao.json',
        'crase.json',
        'ortografia.json',
        'relacao_semantica.json',
        'uso_do_imperativo.json'
    ];

    AudioPlayer.preload('correct', 'audios/win.ogg');
    AudioPlayer.preload('wrong', 'audios/wrong.ogg');

    async function loadQuizData(categoryFile) {
        try {
            const response = await fetch(`data/${categoryFile}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Erro ao carregar dados do quiz:", error);
            UI.renderScreen(`<div class="alert alert-danger" role="alert">Erro ao carregar dados do quiz. Por favor, tente novamente mais tarde.</div>`);
            return null;
        }
    }

    async function getAvailableCategories() {
        const categories = [];
        for (const file of QUIZ_FILES) {
            try {
                const data = await loadQuizData(file);
                if (data) {
                    categories.push({
                        file: file,
                        name: data.category,
                        subcategory: data.subcategory
                    });
                }
            } catch (error) {
                console.error(`Failed to load metadata from ${file}`, error);
            }
        }
        return categories;
    }

    const onQuestionAnswered = (isCorrect, question) => {
        const continueCallback = () => {
            const feedbackContainer = document.getElementById('feedbackContainer');
            if (feedbackContainer) {
                feedbackContainer.classList.remove('animate-zoom-in-glow');
                feedbackContainer.classList.add('animate-zoom-out-glow');
            }

            setTimeout(() => {
                if (Game.isGameOver()) {
                    UI.renderGameOverScreen(Game.getGameState());
                } else {
                    Game.nextQuestion();
                    if (Game.isGameOver()) {
                        UI.renderGameOverScreen(Game.getGameState());
                    } else {
                        UI.renderLoadingScreen("Próxima pergunta...");
                        setTimeout(Game.startGameFlow, 1000);
                    }
                }
            }, 500); // Wait for exit animation to complete
        };

        if (isCorrect) {
            AudioPlayer.play('correct');
            UI.renderFeedbackScreen(isCorrect, question, continueCallback);
        } else {
            AudioPlayer.play('wrong');
            UI.renderFeedbackScreen(isCorrect, question, continueCallback);
        }
    };

    const onLifelineUsed = (lifelineType) => {
        console.log(`Lifeline used: ${lifelineType}`);
        if (lifelineType === 'skip') {
            if (Game.isGameOver()) {
                UI.renderGameOverScreen(Game.getGameState());
            } else {
                UI.renderLoadingScreen("Pulando pergunta...");
                setTimeout(() => {
                    Game.nextQuestion();
                    Game.startGameFlow();
                }, 1500);
            }
        } else if (lifelineType === 'hint') {
            const currentQuestion = Game.getCurrentQuestion();
            if (currentQuestion.hint) {
                UI.renderHintModal(currentQuestion.hint);
            } else {
                UI.renderHintModal("Nenhuma dica disponível para esta pergunta.");
            }
        }
    };

    const handleStartGame = async (selectedCategoryFiles) => {
        // Initialize audio on first user gesture
        AudioPlayer.init();

        if (selectedCategoryFiles.length === 0) {
            alert('Por favor, selecione pelo menos uma categoria para iniciar o jogo.');
            return;
        }

        UI.renderLoadingScreen("Carregando perguntas...");

        const allQuestions = [];
        const promises = selectedCategoryFiles.map(file => loadQuizData(file));

        try {
            const results = await Promise.all(promises);
            results.forEach(data => {
                if (data && data.questions) {
                    allQuestions.push(...data.questions);
                }
            });

            if (allQuestions.length === 0) {
                throw new Error("Nenhuma pergunta encontrada nas categorias selecionadas.");
            }

            Game.init({ questions: allQuestions }, onQuestionAnswered, onLifelineUsed, goToStartScreen);
            console.log("Jogo inicializado com", allQuestions.length, "perguntas. Estado atual:", Game.getGameState());
            Game.startGameFlow();

        } catch (error) {
            console.error("Erro ao iniciar o jogo:", error);
            UI.renderScreen(`<div class="alert alert-danger" role="alert">Não foi possível carregar as perguntas. Tente novamente.</div>`);
        }
    };

    async function goToStartScreen() {
        UI.renderLoadingScreen("Buscando categorias...");
        const availableCategories = await getAvailableCategories();
        if (availableCategories.length > 0) {
            UI.renderStartScreen(availableCategories, handleStartGame);
        } else {
            UI.renderScreen(`<div class="alert alert-warning" role="alert">Nenhuma categoria de quiz foi encontrada.</div>`);
        }
    }

    function main() {
        goToStartScreen();
    }

    main();
});
