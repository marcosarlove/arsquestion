function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const Game = (() => {
    const PRIZE_LADDER = [0, 100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];

    let state = {
        questions: [],
        removedOptions: [],
        currentQuestionIndex: 0,
        score: 0,
        currentPrize: PRIZE_LADDER[0],
        errors: 0,
        maxErrors: 3,
        lifelines: { fiftyFifty: true, hint: true, skip: true },
        wrongAnswers: [],
    };

    let onQuestionAnsweredCallback = null;
    let onLifelineUsedCallback = null;

    const init = (quizData, questionAnsweredCb, lifelineUsedCb) => {
        let questionsToPlay = [...quizData.questions];
        shuffleArray(questionsToPlay);

        // Now, for each question, shuffle its answers and update the correct index
        state.questions = questionsToPlay.map(originalQuestion => {
            const question = JSON.parse(JSON.stringify(originalQuestion)); // Deep copy
            const correctAnswerText = question.options[question.correctAnswerIndex];
            shuffleArray(question.options);
            question.correctAnswerIndex = question.options.indexOf(correctAnswerText);
            return question;
        });

        state.currentQuestionIndex = 0;
        state.score = 0;
        state.currentPrize = PRIZE_LADDER[0];
        state.errors = 0;
        state.removedOptions = [];
        state.lifelines = { fiftyFifty: true, hint: true, skip: true };
        state.wrongAnswers = [];
        onQuestionAnsweredCallback = questionAnsweredCb;
        onLifelineUsedCallback = lifelineUsedCb;
        console.log("Game initialized with fully shuffled questions and answers:", state.questions);
    };

    const startGameFlow = () => {
        if (isGameOver()) {
            console.log("Game Over!");
            return;
        }
        const currentQuestion = getCurrentQuestion();
        UI.renderQuestionScreen(currentQuestion, getGameState(), handleAnswer, handleLifeline);
    };

    const handleAnswer = (selectedIndex) => {
        const currentQuestion = getCurrentQuestion();
        const isCorrect = answerQuestion(selectedIndex);
        if (onQuestionAnsweredCallback) {
            onQuestionAnsweredCallback(isCorrect, currentQuestion);
        }
    };

    const handleLifeline = (lifelineType) => {
        if (!state.lifelines[lifelineType]) return;

        state.lifelines[lifelineType] = false;

        if (lifelineType === 'fiftyFifty') {
            const currentQuestion = getCurrentQuestion();
            const correctAnswerIndex = currentQuestion.correctAnswerIndex;
            let incorrectOptions = [];
            for (let i = 0; i < currentQuestion.options.length; i++) {
                if (i !== correctAnswerIndex) {
                    incorrectOptions.push(i);
                }
            }
            incorrectOptions.sort(() => Math.random() - 0.5);
            state.removedOptions = [incorrectOptions[0], incorrectOptions[1]];
            console.log(`50/50 used. Removing options at indexes: ${state.removedOptions}`);
        }

        if (onLifelineUsedCallback) {
            onLifelineUsedCallback(lifelineType);
        }

        if (lifelineType !== 'skip') {
            startGameFlow();
        }
    };

    const getCurrentQuestion = () => {
        return state.questions[state.currentQuestionIndex];
    };

    const answerQuestion = (selectedIndex) => {
        const currentQuestion = getCurrentQuestion();
        const isCorrect = selectedIndex === currentQuestion.correctAnswerIndex;

        if (isCorrect) {
            state.score++;
            state.currentPrize = PRIZE_LADDER[state.score] || PRIZE_LADDER[PRIZE_LADDER.length - 1];
            console.log("Correct! Score:", state.score, "Prize:", state.currentPrize);
        } else {
            state.errors++;
            state.wrongAnswers.push(currentQuestion);
            console.log("Wrong! Errors:", state.errors);
        }
        return isCorrect;
    };

    const nextQuestion = () => {
        state.currentQuestionIndex++;
        state.removedOptions = [];
        if (state.currentQuestionIndex < state.questions.length && state.errors < state.maxErrors) {
            return true;
        } else {
            return false;
        }
    };

    const isGameOver = () => {
        return state.errors >= state.maxErrors || state.currentQuestionIndex >= state.questions.length;
    };

    const getGameState = () => {
        return { 
            ...state,
            prizeLadder: PRIZE_LADDER
        };
    };

    return {
        init,
        getCurrentQuestion,
        answerQuestion,
        nextQuestion,
        isGameOver,
        getGameState,
        startGameFlow
    };
})();
