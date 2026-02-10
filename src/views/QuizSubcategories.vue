<template>
  <div class="app-screen app-screen--glow">
    <div class="app-container">
      <img class="quiz-hero__art" :src="`${baseUrl}img/quiz-hero.svg`" alt="" />
      <h1 class="page-title">Subcategorias</h1>
      <p class="section-text" v-if="categoryDescription">{{ categoryDescription }}</p>
      <p class="section-text" v-else>Selecione uma subcategoria para continuar.</p>
      <div v-if="isPremiumUser" class="premium-badge">Premium ativo</div>
    </div>

    <div v-if="loading" class="status-text">Carregando subcategorias...</div>
    <div v-else>
      <div v-if="activeDescription" class="quiz-description-overlay">
        <div class="quiz-description-shadow">
          <p>{{ activeDescription || 'Passe o mouse em uma subcategoria para ver a descrição.' }}</p>
        </div>
      </div>
      <div class="quiz-grid quiz-grid--dense" @mouseleave="setDescription('')">
        <div
          v-for="sub in subcategories"
          :key="sub.id"
          class="quiz-card quiz-card--hover"
          :class="{ 'quiz-card--selected': selectedIds.includes(sub.id), 'quiz-card--locked': sub.accessState === 'premium' }"
          @mouseenter="setDescription(sub.description || 'Sem descrição disponível.')"
          @focus="setDescription(sub.description || 'Sem descrição disponível.')"
          @mouseleave="setDescription('')"
          @click="handleSubcategoryClick(sub)"
          tabindex="0"
        >
          <div class="quiz-card__content">
            <h2>{{ sub.name }}</h2>
            <div class="quiz-card__status" v-if="sub.accessState !== 'free'">
              <span v-if="sub.accessState === 'premium'" class="quiz-status-icon" aria-label="Bloqueado">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 1a5 5 0 00-5 5v4H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 9V6a3 3 0 016 0v4H9z"/>
                </svg>
              </span>
              <span v-else-if="sub.accessState === 'pending'" class="quiz-status-icon" aria-label="Pendente">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 1.75A10.25 10.25 0 1022.25 12 10.26 10.26 0 0012 1.75zm0 18.5A8.25 8.25 0 1120.25 12 8.26 8.26 0 0112 20.25z"/>
                  <path d="M12 6.75a1 1 0 011 1v4.1l3.05 1.77a1 1 0 01-1 1.73l-3.55-2.05a1 1 0 01-.5-.87V7.75a1 1 0 011-1z"/>
                </svg>
              </span>
              <span v-else-if="sub.accessState === 'accepted'" class="quiz-status-icon" aria-label="Liberado">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17 9h-1V7a4 4 0 10-8 0h2a2 2 0 114 0v2H7a2 2 0 00-2 2v9a2 2 0 002 2h10a2 2 0 002-2v-9a2 2 0 00-2-2zm-5 9a2 2 0 110-4 2 2 0 010 4z"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <div v-if="showPremiumModal" class="modal">
    <div class="modal__content">
      <h2>Recurso premium</h2>
      <p>Este conteúdo é exclusivo para assinantes. Para ter acesso, finalize sua subscrição.</p>
      <div class="cta-row">
        <button class="button button-primary" @click="goToUpgrade">Ver planos</button>
        <button class="button button-secondary" @click="closeModal">Fechar</button>
      </div>
    </div>
  </div>

  <div v-if="selectedIds.length" class="quiz-fab">
    <button class="button button-primary button-hero" @click="startQuiz">
      Iniciar quiz ({{ selectedIds.length }})
    </button>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { collection, getDocs, doc, getDoc, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../services/auth';

export default {
  name: 'QuizSubcategories',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { user } = useAuth();
    const loading = ref(true);
    const subcategories = ref([]);
    const categoryDescription = ref('');
    const activeDescription = ref('');
    const showPremiumModal = ref(false);
    const selectedPremiumId = ref('');
    const selectedPremiumCategoryId = ref('');
    const baseUrl = process.env.BASE_URL || '/';
    const selectedIds = ref([]);
    const isPremiumUser = ref(false);

    const loadSubcategories = async () => {
      const categoryId = route.params.categoryId;
      const savedSelected = JSON.parse(localStorage.getItem('ars_selectedSubcategories') || '[]');
      selectedIds.value = savedSelected;
      const categorySnap = await getDoc(doc(db, 'catogories', categoryId));
      if (categorySnap.exists()) {
        categoryDescription.value = categorySnap.data().description || '';
      }
      const snap = await getDocs(collection(db, 'catogories', categoryId, 'subcategories'));
      const userId = user.value?.uid;
      let isPremium = false;
      let userEmail = '';
      if (userId) {
        const userSnap = await getDoc(doc(db, 'users', userId));
        if (userSnap.exists()) {
          isPremium = userSnap.data().is_premium === true;
          userEmail = userSnap.data().email || '';
        }
      }
      isPremiumUser.value = isPremium;

      const results = [];
      for (const d of snap.docs) {
        const data = d.data();
        if (data.is_active === false) continue;
        let accessState = 'free';
        if (!data.is_free) {
          if (isPremium) {
            accessState = 'accepted';
          } else if (userEmail) {
            const reqQuery = query(
              collection(db, 'requests'),
              where('user_email', '==', userEmail),
              limit(20)
            );
            const reqSnap = await getDocs(reqQuery);
            let matched = null;
            reqSnap.docs.forEach((docSnap) => {
              const req = docSnap.data();
              const feature = String(req.feature_requested || '');
              const [catId, subId] = feature.split(',').map((v) => v?.trim());
              if (catId === categoryId && subId === d.id) {
                matched = req;
              }
            });
            if (matched) {
              if (matched.status === 'accepted') accessState = 'accepted';
              else if (matched.status === 'pending') accessState = 'pending';
              else accessState = 'premium';
            } else {
              accessState = 'premium';
            }
          } else {
            accessState = 'premium';
          }
        }
        results.push({ id: d.id, ...data, accessState });
      }
      subcategories.value = results;
      loading.value = false;
    };

    onMounted(loadSubcategories);

    const setDescription = (value) => {
      activeDescription.value = value || '';
    };

    const handleSubcategoryClick = (sub) => {
      if (sub.accessState === 'premium') {
        selectedPremiumId.value = sub.id;
        selectedPremiumCategoryId.value = route.params.categoryId;
        showPremiumModal.value = true;
        return;
      }
      if (sub.accessState === 'pending') return;
      if (sub.accessState !== 'accepted' && sub.accessState !== 'free') return;

      const idx = selectedIds.value.indexOf(sub.id);
      if (idx === -1) selectedIds.value.push(sub.id);
      else selectedIds.value.splice(idx, 1);
    };

    const closeModal = () => {
      showPremiumModal.value = false;
      selectedPremiumId.value = '';
      selectedPremiumCategoryId.value = '';
    };

    const goToUpgrade = () => {
      router.push({
        path: '/upgrade',
        query: {
          feature: selectedPremiumId.value,
          category: selectedPremiumCategoryId.value
        }
      });
    };

    const startQuiz = () => {
      localStorage.setItem('ars_selectedSubcategories', JSON.stringify(selectedIds.value));
      localStorage.setItem('ars_selectedCategory', String(route.params.categoryId || ''));
      localStorage.removeItem('ars_gameState');
      localStorage.removeItem('ars_gameStateKey');
      localStorage.removeItem('ars_cachedQuestions');
      localStorage.removeItem('ars_cachedQuestionsKey');
      window.dispatchEvent(new Event('ars_game_state_changed'));
      router.push('/game');
    };

    return {
      loading,
      subcategories,
      categoryDescription,
      activeDescription,
      setDescription,
      handleSubcategoryClick,
      showPremiumModal,
      closeModal,
      goToUpgrade,
      baseUrl,
      selectedIds,
      startQuiz,
      isPremiumUser
    };
  }
};
</script>
