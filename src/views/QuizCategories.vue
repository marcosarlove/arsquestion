<template>
  <div class="app-screen app-screen--glow">
    <div class="quiz-hero">
      <img class="quiz-hero__art" :src="`${baseUrl}img/quiz-hero.svg`" alt="" />
      <p class="quiz-hero__kicker">Biblioteca</p>
      <h1 class="quiz-hero__title">Categorias de estudo</h1>
      <p class="quiz-hero__subtitle">Escolha uma área para explorar as subcategorias e iniciar seus quizzes.</p>
    </div>

    <div v-if="loading" class="status-text">Carregando categorias...</div>
    <div v-else class="quiz-grid">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="quiz-card quiz-card--featured"
        @click="goToCategory(cat.id)"
      >
        <div class="quiz-card__content">
          <h2>{{ cat.name }}</h2>
        </div>
        <div class="quiz-card__meta">Explorar subcategorias</div>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default {
  name: 'QuizCategories',
  setup() {
    const router = useRouter();
    const loading = ref(true);
    const categories = ref([]);
    const baseUrl = process.env.BASE_URL || '/';

    const loadCategories = async () => {
      const snap = await getDocs(collection(db, 'catogories'));
      categories.value = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => c.is_active !== false);
      loading.value = false;
    };

    const goToCategory = (id) => {
      router.push(`/quiz/${id}`);
    };

    onMounted(loadCategories);

    return { loading, categories, goToCategory, baseUrl };
  }
};
</script>
