function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const Game = (() => {
    let state = {
        questions: [],
        removedOptions: [],
        currentQuestionIndex: 0,
        score: 0,
        currentPrize: 0,
        errors: 0,
        maxErrors: 3,
        lifelines: { fiftyFifty: true, hint: true, skip: true },
        wrongAnswers: [],
        prizeLadder: [],
        difficultyCounts: {},
        difficultyStarts: {}
    };

    let onLifelineUsedCallback = null;

    const init = (quizData, lifelineUsedCb) => {
        let allQuestions = [...quizData.questions];

        // Group by difficulty
        const easyQuestions = allQuestions.filter(q => q.difficulty === 'easy');
        const mediumQuestions = allQuestions.filter(q => q.difficulty === 'medium');
        const hardQuestions = allQuestions.filter(q => q.difficulty === 'hard');
        const otherQuestions = allQuestions.filter(q => !['easy', 'medium', 'hard'].includes(q.difficulty));

        // Shuffle each group individually
        shuffleArray(easyQuestions);
        shuffleArray(mediumQuestions);
        shuffleArray(hardQuestions);
        shuffleArray(otherQuestions);

        // Combine them in the correct order
        const sortedQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions, ...otherQuestions];

        // Now, for each question, shuffle its answers and update the correct index
        state.questions = sortedQuestions.map(originalQuestion => {
            const question = JSON.parse(JSON.stringify(originalQuestion)); // Deep copy
            const correctAnswerText = question.options[originalQuestion.correctAnswerIndex];
            shuffleArray(question.options);
            question.correctAnswerIndex = question.options.indexOf(correctAnswerText);
            return question;
        });
        
        // Generate prize ladder dynamically
        const numQuestions = state.questions.length;
        state.prizeLadder = Array.from({ length: numQuestions + 1 }, (_, i) => i);

        // Store difficulty counts and start indexes
        state.difficultyCounts = {
            easy: easyQuestions.length,
            medium: mediumQuestions.length,
            hard: hardQuestions.length,
            other: otherQuestions.length
        };
        state.difficultyStarts = {
            easy: 0,
            medium: easyQuestions.length,
            hard: easyQuestions.length + mediumQuestions.length,
            other: easyQuestions.length + mediumQuestions.length + hardQuestions.length
        };

        state.currentQuestionIndex = 0;
        state.score = 0;
        state.currentPrize = state.prizeLadder[0];
        state.errors = 0;
        state.removedOptions = [];
        state.lifelines = { fiftyFifty: true, hint: true, skip: true };
        state.wrongAnswers = [];
        onLifelineUsedCallback = lifelineUsedCb;
        console.log("Game initialized with difficulty-sorted questions:", state.difficultyCounts);
    };

    const startGameFlow = () => {
        if (isGameOver()) {
            console.log("Game Over!");
            return;
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
            state.currentPrize = state.prizeLadder[state.score];
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
        }
        else {
            return false;
        }
    };

    const getGameResult = () => {
        if (state.errors >= state.maxErrors) return 'LOSE';
        if (state.currentQuestionIndex >= state.questions.length) return 'WIN';
        return 'ONGOING';
    };

    const isGameOver = () => {
        return getGameResult() !== 'ONGOING';
    };

    const getGameState = () => {
        return { ...state };
    };

    return {
        init,
        getCurrentQuestion,
        answerQuestion,
        nextQuestion,
        isGameOver,
        getGameState,
        startGameFlow,
        getGameResult,
        handleLifeline
    };
})();

export default Game;
