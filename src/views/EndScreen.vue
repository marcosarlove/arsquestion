<!-- src/views/EndScreen.vue -->
<template>
  <div class="app-screen">
    <div class="app-container">
      <h1 v-if="result === 'WIN'" class="result-title result-title--win">Parabéns!</h1>
      <h1 v-else class="result-title result-title--lose">Fim de Jogo</h1>
      <p class="result-score">Sua pontuação final foi: {{ score }}</p>
      <div class="button-row">
        <button @click="restartGame" class="button button-primary">Jogar Novamente</button>
        <button @click="goToStartScreen" class="button button-secondary">Tela Inicial</button>
      </div>
    </div>
  </div>
</template>

<script>
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
  methods: {
    restartGame() {
      const savedCategories = JSON.parse(localStorage.getItem('ars_selectedCategories'));
      if (savedCategories) {
        this.$router.push({ name: 'GameScreen', params: { categories: savedCategories } });
      } else {
        this.$router.push('/'); // Se não houver categorias salvas, volta para o início
      }
    },
    goToStartScreen() {
      this.$router.push('/');
    },
  },
};
</script>
