<!-- src/views/GameScreen.vue -->
<template>
  <div class="app-screen app-screen--between" v-if="gameState">
    <!-- Main Content: Pergunta e Opções -->
    <div class="app-container">
      <div class="quiz-meta-inline">
        <span><strong>Categoria:</strong> {{ categoryName || '—' }}</span>
        <span><strong>Subcategorias:</strong> {{ subcategoryNames.length ? subcategoryNames.join(', ') : '—' }}</span>
        <span><strong>Perguntas:</strong> {{ difficultySummary.easy }}/{{ difficultySummary.medium }}/{{ difficultySummary.hard }} ({{ difficultySummary.total }})</span>
        <span><strong>Pontuação:</strong> {{ gameState.score }}</span>
      </div>
      <div v-if="currentQuestion">
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
        <div class="lifeline-group lifeline-group--inline">
          <button @click="useLifeline('fiftyFifty')" :disabled="!gameState.lifelines.fiftyFifty" class="lifeline-button">50/50</button>
          <button @click="useLifeline('hint')" :disabled="!gameState.lifelines.hint" class="lifeline-button">Dica</button>
          <button @click="useLifeline('skip')" :disabled="!gameState.lifelines.skip" class="lifeline-button">Pular</button>
        </div>
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

    <!-- Tela de Feedback -->
    <div
      v-if="showFeedbackScreen"
      ref="feedbackScreen"
      class="feedback-screen-legacy"
    >
      <div class="feedback-bg" :class="feedbackIsCorrect ? 'bg-correct' : 'bg-wrong'"></div>
      <div class="feedback-container animate-zoom-in-glow">
        <h2 :class="feedbackIsCorrect ? 'feedback-title feedback-title--correct' : 'feedback-title feedback-title--wrong'">
          {{ feedbackIsCorrect ? 'CERTO!' : 'Incorreto!' }}
        </h2>
        <p class="feedback-kicker">Pontos</p>
        <div class="feedback-prize">
          <div class="feedback-prize__glow"></div>
          <p>{{ currentPrizeDisplay }}</p>
        </div>
        <div class="feedback-hint">
          <p>{{ feedbackText }}</p>
        </div>
        <button @click="closeFeedbackScreen" class="button button-primary">Continuar</button>
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
      required: false,
      default: () => []
    }
  },
  data() {
    return {
      loading: true,
      error: null,
      questions: [],
      gameState: null,
      categoryName: '',
      subcategoryNames: [],
      sessionId: null,
      loadedFromSave: false,
      selectedAnswer: null,
      isAnswered: false,
      showHintModal: false,
      hintText: '',
      showFeedbackScreen: false,
      feedbackText: '',
      feedbackIsCorrect: false,
      lastPrize: 0
    };
  },
  computed: {
    currentQuestion() {
      return this.gameState ? this.gameState.questions[this.gameState.currentQuestionIndex] : null;
    }
    ,
    currentPrizeDisplay() {
      if (!this.gameState) return 0;
      return this.feedbackIsCorrect ? this.gameState.currentPrize : this.lastPrize;
    },
    difficultySummary() {
      if (!this.gameState) return { easy: 0, medium: 0, hard: 0, total: 0 };
      const easy = this.gameState.difficultyCounts?.easy || 0;
      const medium = this.gameState.difficultyCounts?.medium || 0;
      const hard = this.gameState.difficultyCounts?.hard || 0;
      return { easy, medium, hard, total: easy + medium + hard };
    }
  },
  async created() {
    AudioPlayer.preload('correct', 'audios/win.ogg');
    AudioPlayer.preload('wrong', 'audios/wrong.ogg');
    await this.loadQuestions();
    if (!this.error && !this.loadedFromSave) {
      this.startGame();
    }
  },
  methods: {
    generateSessionId() {
      return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    },
    saveGameState() {
      if (!this.gameState) return;
      if (!this.sessionId) {
        this.sessionId = this.generateSessionId();
      }
      const selectedSubcategories = JSON.parse(localStorage.getItem('ars_selectedSubcategories') || '[]');
      const selectedCategory = localStorage.getItem('ars_selectedCategory') || '';
      const selectionKey = JSON.stringify({
        category: selectedCategory,
        subcategories: [...selectedSubcategories].sort()
      });
      const payload = {
        state: this.gameState,
        sessionId: this.sessionId,
        isAnswered: this.isAnswered,
        selectedAnswer: this.selectedAnswer
      };
      localStorage.setItem('ars_gameState', JSON.stringify(payload));
      localStorage.setItem('ars_gameStateKey', selectionKey);
      window.dispatchEvent(new Event('ars_game_state_changed'));
    },
    async loadQuestions() {
      this.loading = true;
      try {
        const selectedSubcategories = JSON.parse(localStorage.getItem('ars_selectedSubcategories') || '[]');
        const selectedCategory = localStorage.getItem('ars_selectedCategory') || '';
        const selectionKey = JSON.stringify({
          category: selectedCategory,
          subcategories: [...selectedSubcategories].sort()
        });

        const savedGame = localStorage.getItem('ars_gameState');
        const savedGameKey = localStorage.getItem('ars_gameStateKey');
        if (savedGame && savedGameKey === selectionKey) {
          const parsed = JSON.parse(savedGame);
          Game.loadState(parsed.state);
          this.gameState = Game.getGameState();
          this.questions = this.gameState.questions || [];
          this.isAnswered = parsed.isAnswered || false;
          this.selectedAnswer = parsed.selectedAnswer ?? null;
          this.sessionId = parsed.sessionId || this.generateSessionId();
          this.loadedFromSave = true;
          await this.loadMeta(selectedCategory, selectedSubcategories);
          this.saveGameState();
          this.loading = false;
          return;
        }

        if (!selectedSubcategories.length || !selectedCategory) {
          throw new Error("Nenhuma subcategoria selecionada.");
        }

        const { collection, getDocs, query, where, doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');

        const chunks = [];
        for (let i = 0; i < selectedSubcategories.length; i += 10) {
          chunks.push(selectedSubcategories.slice(i, i + 10));
        }
        const allQuestions = [];
        for (const chunk of chunks) {
          const q = query(
            collection(db, 'quizzes'),
            where('category_id', '==', selectedCategory),
            where('subcategory_id', 'in', chunk)
          );
          const snap = await getDocs(q);
          snap.docs.forEach((d) => allQuestions.push(d.data()));
        }

        const byDifficulty = {
          easy: allQuestions.filter((q) => q.dificulty === 'easy'),
          medium: allQuestions.filter((q) => q.dificulty === 'medium'),
          hard: allQuestions.filter((q) => q.dificulty === 'hard')
        };

        this.shuffleArray(byDifficulty.easy);
        this.shuffleArray(byDifficulty.medium);
        this.shuffleArray(byDifficulty.hard);

        const selected = [
          ...byDifficulty.easy.slice(0, 50),
          ...byDifficulty.medium.slice(0, 30),
          ...byDifficulty.hard.slice(0, 20)
        ].map((q) => {
          const options = [
            q.options?.corret,
            q.options?.wrong1,
            q.options?.wrong2,
            q.options?.wrong3
          ].filter(Boolean);
          return {
            ...q,
            difficulty: q.dificulty,
            options,
            correctAnswerIndex: 0
          };
        });

        if (!selected.length) {
          throw new Error("Nenhuma pergunta encontrada nas subcategorias selecionadas.");
        }

        this.questions = this.shuffleArray(selected);
        localStorage.setItem('ars_cachedQuestions', JSON.stringify(this.questions));
        localStorage.setItem('ars_cachedQuestionsKey', selectionKey);
        await this.loadMeta(selectedCategory, selectedSubcategories, { db, doc, getDoc });
        this.loading = false;
      } catch (error) {
        console.error("Erro ao iniciar o jogo:", error);
        this.error = "Não foi possível carregar as perguntas. Tente novamente.";
      }
    },
    async loadMeta(selectedCategory, selectedSubcategories, injected) {
      try {
        const { doc, getDoc } = injected || (await import('firebase/firestore'));
        const { db } = injected ? { db: injected.db } : await import('../firebase');
        const catSnap = await getDoc(doc(db, 'catogories', selectedCategory));
        if (catSnap.exists()) {
          this.categoryName = catSnap.data().name || '';
        }
        const subNames = await Promise.all(
          selectedSubcategories.map(async (id) => {
            const subSnap = await getDoc(doc(db, 'catogories', selectedCategory, 'subcategories', id));
            return subSnap.exists() ? subSnap.data().name : id;
          })
        );
        this.subcategoryNames = subNames;
      } catch {
        this.categoryName = '';
        this.subcategoryNames = [];
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
      if (!this.sessionId) {
        this.sessionId = this.generateSessionId();
      }
      this.saveGameState();
    },
    onQuestionAnswered(isCorrect) {
      if (isCorrect) {
        AudioPlayer.play('correct');
      } else {
        AudioPlayer.play('wrong');
      }
      const previousPrize = this.gameState?.currentPrize || 0;
      this.lastPrize = previousPrize;
      this.isAnswered = true;
      const current = this.currentQuestion || {};
      const correctText = current.hintCorrect || current.hint_corret || 'Resposta correta!';
      const wrongText = current.hintWrong || current.hint_wromg || 'Resposta incorreta.';
      this.feedbackText = isCorrect ? correctText : wrongText;
      this.feedbackIsCorrect = isCorrect;
      if (isCorrect) {
        this.lastPrize = this.gameState?.currentPrize || this.lastPrize;
      }
      this.showFeedbackScreen = true;
    },
    onLifelineUsed(lifelineType) {
      if (lifelineType === 'hint') {
        this.showHint();
      }
      Game.handleLifeline(lifelineType);
      this.gameState = Game.getGameState();
      this.saveGameState();
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
      this.gameState = Game.getGameState();
      this.onQuestionAnswered(isCorrect, this.currentQuestion);
      this.saveGameState();
    },
    nextQuestion() {
      Game.nextQuestion();
      this.gameState = Game.getGameState();
      const result = Game.getGameResult();
      if (result !== 'ONGOING') {
        this.$router.push({ name: 'EndScreen', query: { result: result, score: this.gameState.score } });
        return;
      }
      this.isAnswered = false;
      this.selectedAnswer = null;
      this.saveGameState();
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
        if (type === 'skip') {
            const progressed = Game.nextQuestion();
            const result = Game.getGameResult();
            this.gameState = Game.getGameState();
            this.isAnswered = false;
            this.selectedAnswer = null;
            this.saveGameState();
            if (!progressed || result !== 'ONGOING') {
                this.$router.push({ name: 'EndScreen', query: { result: result, score: this.gameState.score } });
            }
            return;
        }
        this.gameState = Game.getGameState();
        this.saveGameState();
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
    ,
    closeFeedbackScreen() {
        const screen = this.$refs.feedbackScreen;
        if (screen) {
          screen.classList.remove('animate-zoom-in-glow');
          screen.classList.add('animate-zoom-out-glow');
        }
        setTimeout(() => {
          this.showFeedbackScreen = false;
          this.nextQuestion();
        }, 500);
    }
  }
};
</script>
