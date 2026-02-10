<!-- src/views/GameScreen.vue -->
<template>
  <div class="app-screen app-screen--between" v-if="gameState">
    <!-- Header: Lifelines e Botão de Sair -->
    <div class="app-header">
      <button @click="onBack" class="link-button">Sair</button>
      <div class="lifeline-group">
        <button @click="useLifeline('fiftyFifty')" :disabled="!gameState.lifelines.fiftyFifty" class="lifeline-button">50/50</button>
        <button @click="useLifeline('hint')" :disabled="!gameState.lifelines.hint" class="lifeline-button">Dica</button>
        <button @click="useLifeline('skip')" :disabled="!gameState.lifelines.skip" class="lifeline-button">Pular</button>
      </div>
    </div>

    <!-- Main Content: Pergunta e Opções -->
    <div class="app-container">
      <div class="question-card">
        <p class="question-text" v-html="currentQuestion.question"></p>
      </div>
      <div class="grid grid-2 answers-grid">
        <button v-for="(option, index) in currentQuestion.options" :key="index"
                @click="handleAnswer(index)"
                :disabled="isOptionDisabled(index)"
                class="answer-option"
                :class="getOptionClass(index)">
          <span class="option-letter">{{ String.fromCharCode(65 + index) }}.</span>
          <span v-html="option"></span>
        </button>
      </div>
    </div>

    <!-- Footer: Barra de Progresso e Nível -->
    <div class="app-container">
      <div class="progress-meta">
        <span>Score: {{ gameState.score }}</span>
        <span>Erros: {{ gameState.errors }}/{{ gameState.maxErrors }}</span>
      </div>
      <div class="progress">
        <div class="progress__bar" :style="{ width: (gameState.currentQuestionIndex / gameState.questions.length) * 100 + '%' }"></div>
      </div>
    </div>

    <!-- Modal de Dica -->
    <div v-if="showHintModal" class="modal">
      <div class="modal__content">
        <h2>Dica</h2>
        <p>{{ hintText }}</p>
        <button @click="closeHintModal" class="button button-primary">Fechar</button>
      </div>
    </div>
  </div>
  <div v-else class="app-screen">
    <div v-if="loading" class="status-text">Carregando...</div>
    <div v-else-if="error" class="status-text status-error">{{ error }}</div>
  </div>
</template>

<script>
import Game from '../services/game.js';
import AudioPlayer from '../services/audio.js';

export default {
  name: 'GameScreen',
  props: {
    categories: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      error: null,
      questions: [],
      gameState: null,
      selectedAnswer: null,
      isAnswered: false,
      showHintModal: false,
      hintText: '',
    };
  },
  computed: {
    currentQuestion() {
      return this.gameState ? this.gameState.questions[this.gameState.currentQuestionIndex] : null;
    }
  },
  async created() {
    AudioPlayer.preload('correct', 'audios/win.ogg');
    AudioPlayer.preload('wrong', 'audios/wrong.ogg');
    await this.loadQuestions();
    if (!this.error) {
      this.startGame();
    }
  },
  methods: {
    async loadQuestions() {
      this.loading = true;
      const allQuestions = [];
      const promises = this.categories.map(file => this.loadQuizData(file));
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

        this.questions = this.shuffleArray(allQuestions);
        this.loading = false;
      } catch (error) {
        console.error("Erro ao iniciar o jogo:", error);
        this.error = "Não foi possível carregar as perguntas. Tente novamente.";
      }
    },
    async loadQuizData(categoryFile) {
      try {
        const response = await fetch(`/data/${categoryFile}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Erro ao carregar dados do quiz:", error);
        this.error = "Erro ao carregar dados do quiz. Por favor, tente novamente mais tarde.";
        return null;
      }
    },
    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },
    startGame() {
      Game.init({ questions: this.questions }, this.onLifelineUsed);
      this.gameState = Game.getGameState();
      AudioPlayer.init();
    },
    onQuestionAnswered(isCorrect) {
      if (isCorrect) {
        AudioPlayer.play('correct');
      } else {
        AudioPlayer.play('wrong');
      }
      this.isAnswered = true;
      setTimeout(() => {
        this.nextQuestion();
      }, 2000); // Aguarda 2 segundos antes de ir para a próxima pergunta
    },
    onLifelineUsed(lifelineType) {
      if (lifelineType === 'hint') {
        this.showHint();
      }
      Game.handleLifeline(lifelineType);
      this.gameState = Game.getGameState();
    },
    onBack() {
      if (confirm('Tem certeza que deseja sair? Seu progresso será perdido.')) {
        this.$router.push('/');
      }
    },
    handleAnswer(index) {
      if (this.isAnswered) return;
      this.selectedAnswer = index;
      const isCorrect = Game.answerQuestion(index);
      this.onQuestionAnswered(isCorrect, this.currentQuestion);
    },
    nextQuestion() {
      const result = Game.getGameResult();
      if (result !== 'ONGOING') {
        // Lógica para fim de jogo (vitória ou derrota)
        this.$router.push({ name: 'EndScreen', params: { result: result, score: this.gameState.score } });
        return;
      }

      Game.nextQuestion();
      this.gameState = Game.getGameState();
      this.isAnswered = false;
      this.selectedAnswer = null;
    },
    isOptionDisabled(index) {
      return this.isAnswered || (this.gameState.removedOptions && this.gameState.removedOptions.includes(index));
    },
    getOptionClass(index) {
      if (!this.isAnswered && this.gameState.removedOptions && this.gameState.removedOptions.includes(index)) {
        return 'answer-option--dimmed';
      }
      if (!this.isAnswered) {
        return '';
      }
      if (index === this.currentQuestion.correctAnswerIndex) {
        return 'answer-option--correct';
      }
      if (index === this.selectedAnswer) {
        return 'answer-option--wrong';
      }
      return 'answer-option--dimmed';
    },
    useLifeline(type) {
        if (type === 'hint') {
            this.showHint();
        }
        Game.handleLifeline(type);
        this.gameState = Game.getGameState();
    },
    showHint() {
        if (this.currentQuestion.hint) {
            this.hintText = this.currentQuestion.hint;
        } else {
            this.hintText = "Nenhuma dica disponível para esta pergunta.";
        }
        this.showHintModal = true;
    },
    closeHintModal() {
        this.showHintModal = false;
    }
  }
};
</script>
