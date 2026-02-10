<!-- src/views/EndScreen.vue -->
<template>
  <div class="app-screen">
    <div class="app-container">
      <template v-if="result === 'WIN'">
        <h1 class="result-title result-title--win">Parabéns!</h1>
        <p class="result-score">Você concluiu o quiz com sucesso.</p>
      </template>
      <template v-else>
        <h1 class="result-title result-title--lose">Fim de Jogo</h1>
        <p class="result-score">Não foi dessa vez, mas você pode tentar novamente.</p>
      </template>
      <p class="result-score">Sua pontuação final foi: {{ safeScore }}</p>
      <div class="button-row">
        <button @click="restartGame" class="button button-primary">Jogar Novamente</button>
        <button @click="goBack" class="button button-secondary">Voltar</button>
      </div>
    </div>
  </div>
</template>

<script>
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../services/auth';

export default {
  name: 'EndScreen',
  props: {
    result: {
      type: String,
      required: true, // 'WIN' or 'LOSE'
    },
    score: {
      type: Number,
      required: true,
    },
  },
  computed: {
    safeScore() {
      const value = Number(this.score);
      return Number.isFinite(value) ? value : 0;
    }
  },
  mounted() {
    this.updateUserStats();
  },
  methods: {
    async updateUserStats() {
      try {
        const { authReadyPromise } = useAuth();
        await authReadyPromise;
        const user = auth.currentUser;
        if (!user) return;

        const savedGame = JSON.parse(localStorage.getItem('ars_gameState') || '{}');
        const sessionId = savedGame.sessionId || '';
        if (!sessionId) return;

        const lastUpdated = localStorage.getItem('ars_statsUpdatedSession');
        if (lastUpdated === sessionId) return;

        const points = this.safeScore;
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return;

        const stats = snap.data().stats || {};
        const currentTotal = Number(stats.total_points) || 0;
        const currentCompleted = Number(stats.completed_quizzes) || 0;
        const nextStats = {
          ...stats,
          total_points: currentTotal + points,
          completed_quizzes: this.result === 'WIN' ? currentCompleted + 1 : currentCompleted
        };

        await updateDoc(userRef, { stats: nextStats });
        localStorage.setItem('ars_statsUpdatedSession', sessionId);
      } catch (error) {
        console.error('Erro ao atualizar estatísticas do usuário:', error);
      }
    },
    restartGame() {
      localStorage.removeItem('ars_gameState');
      localStorage.removeItem('ars_gameStateKey');
      localStorage.removeItem('ars_cachedQuestions');
      localStorage.removeItem('ars_cachedQuestionsKey');
      window.dispatchEvent(new Event('ars_game_state_changed'));
      this.$router.push('/game');
    },
    goBack() {
      localStorage.removeItem('ars_gameState');
      localStorage.removeItem('ars_gameStateKey');
      localStorage.removeItem('ars_cachedQuestions');
      localStorage.removeItem('ars_cachedQuestionsKey');
      window.dispatchEvent(new Event('ars_game_state_changed'));
      const categoryId = localStorage.getItem('ars_selectedCategory') || '';
      if (categoryId) {
        this.$router.push(`/quiz/${categoryId}`);
      } else {
        this.$router.push('/quiz');
      }
    },
  },
};
</script>
