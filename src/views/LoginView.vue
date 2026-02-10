<template>
  <div class="app-screen app-screen--glow">
    <div class="auth-card">
      <div class="auth-header">
        <div class="hero-logo">
          <img :src="`${baseUrl}img/logo.png`" alt="Logo do ARSQuestion" />
          <div class="hero-mark">ARS<span>Question</span></div>
        </div>
        <p class="auth-kicker">Criado por Marcos Arlove</p>
      </div>

      <div class="auth-tabs">
        <button
          class="auth-tab"
          :class="{ 'auth-tab--active': !isSignup }"
          @click="goToLogin"
          type="button"
        >
          Iniciar sessão
        </button>
        <button
          class="auth-tab"
          :class="{ 'auth-tab--active': isSignup }"
          @click="goToSignup"
          type="button"
        >
          Criar conta
        </button>
      </div>

      <div class="auth-body">
        <h2 class="auth-title">
          {{ isSignup ? 'Crie sua conta em segundos.' : 'Bem-vindo de volta.' }}
        </h2>
        <p class="auth-subtitle">
          {{ isSignup
            ? 'Entre com Google e sincronize seu progresso em qualquer dispositivo.'
            : 'Faça login para continuar suas trilhas de estudo e manter o ritmo.'
          }}
        </p>

        <button
          @click="login"
          type="button"
          class="button button-primary button-full button-large"
        >
          {{ isSignup ? 'Criar conta com Google' : 'Entrar com Google' }}
        </button>

      </div>
    </div>
  </div>
</template>

<script>
import { computed, watch } from 'vue';
import { useAuth } from '../services/auth';
import { useRouter, useRoute } from 'vue-router';

export default {
  name: 'LoginView',
  setup() {
    const { user, signInWithGoogle, createUserProfile } = useAuth();
    const router = useRouter();
    const route = useRoute();
    const baseUrl = process.env.BASE_URL || '/';

    const isSignup = computed(() => route.query.mode === 'signup');

    const login = async () => {
      const signedUser = await signInWithGoogle();
      if (isSignup.value) {
        await createUserProfile(signedUser);
      }
    };

    const goToSignup = () => {
      router.replace({ path: '/login', query: { mode: 'signup' } });
    };

    const goToLogin = () => {
      router.replace({ path: '/login' });
    };


    watch(user, (currentUser) => {
      if (currentUser) {
        router.push('/');
      }
    });

    return { login, isSignup, goToSignup, goToLogin, baseUrl };
  },
};
</script>
