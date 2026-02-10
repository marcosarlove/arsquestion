<template>
  <header class="app-header-bar">
    <button class="app-header__back" @click="goBack" aria-label="Voltar">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div class="app-header__brand" @click="goHome">
      <img :src="`${baseUrl}img/logo.png`" alt="Logo do ARSQuestion" />
      <span>ARS<span>Question</span></span>
    </div>

    <button class="app-header__toggle" @click="toggleMenu" aria-label="Abrir menu">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <nav :class="['app-header__nav', { 'app-header__nav--open': menuOpen }]">
      <a @click.prevent="goHome" href="#">Home</a>
      <a @click.prevent="goLessons" href="#">Aulas</a>
      <a @click.prevent="goQuiz" href="#">Quiz</a>
      <a @click.prevent="goStats" href="#">Estatísticas</a>
      <a v-if="isAdmin" @click.prevent="goAdmin" href="#">Admin</a>
    </nav>

    <div class="app-header__actions">
      <div v-if="isAuthenticated" class="app-header__user" @click="goProfile">
        <span>{{ displayName }}</span>
        <span v-if="isPremium" class="app-header__premium">Premium ativo</span>
        <span class="app-header__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v3h16v-3c0-2.761-3.582-5-8-5z"></path>
          </svg>
        </span>
      </div>
      <div v-else class="app-header__auth">
        <button class="button button-ghost" @click="goLogin">Iniciar sessão</button>
        <button class="button button-primary" @click="goSignup">Criar conta</button>
      </div>
    </div>
  </header>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../services/auth';

export default {
  name: 'AppHeader',
  setup() {
    const { user, profile, fetchUserProfile } = useAuth();
    const router = useRouter();
    const menuOpen = ref(false);
    const baseUrl = process.env.BASE_URL || '/';

    const isAuthenticated = computed(() => !!user.value);
    const displayName = computed(() => user.value?.displayName || user.value?.email || 'Usuário');
    const isAdmin = computed(() => (profile.value?.role || '').toLowerCase() === 'admin');
    const isPremium = computed(() => profile.value?.is_premium === true);

    const goHome = () => router.push('/');
    const goBack = () => {
      if (router.currentRoute.value.path !== '/') {
        router.back();
      }
    };
    const goLessons = () => router.push('/aulas');
    const goQuiz = () => router.push('/quiz');
    const goStats = () => router.push('/estatisticas');
    const goAdmin = () => router.push('/admin');
    const goProfile = () => router.push('/profile');
    const goLogin = () => router.push('/login');
    const goSignup = () => router.push({ path: '/login', query: { mode: 'signup' } });

    const toggleMenu = () => {
      menuOpen.value = !menuOpen.value;
    };

    const loadProfile = async () => {
      if (user.value) {
        await fetchUserProfile();
      }
    };

    onMounted(loadProfile);
    watch(user, loadProfile);

    return {
      menuOpen,
      baseUrl,
      isAuthenticated,
      displayName,
      isAdmin,
      isPremium,
      toggleMenu,
      goHome,
      goBack,
      goLessons,
      goQuiz,
      goStats,
      goAdmin,
      goProfile,
      goLogin,
      goSignup
    };
  }
};
</script>
