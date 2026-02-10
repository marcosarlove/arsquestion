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
          class="auth-tab button-hero"
          :class="{ 'auth-tab--active': !isSignup }"
          @click="goToLogin"
          type="button"
        >
          Iniciar sessão
        </button>
        <button
          class="auth-tab button-hero"
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
        <p v-if="authMessage" class="auth-alert">{{ authMessage }}</p>

        <button
          @click="login"
          type="button"
          class="button button-google button-full button-large"
        >
          <span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-2 2.9l3.2 2.5c1.9-1.8 3-4.4 3-7.4 0-.6-.1-1.1-.2-1.6H12z"/>
              <path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.7-2.5l-3.2-2.5c-.9.6-2.1 1-3.5 1-2.7 0-4.9-1.8-5.7-4.2H2.9v2.6C4.6 19.5 8.1 22 12 22z"/>
              <path fill="#4A90E2" d="M6.3 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.6H2.9C2.3 8.9 2 10.4 2 12s.3 3.1.9 4.4l3.4-2.6z"/>
              <path fill="#FBBC05" d="M12 6.8c1.5 0 2.8.5 3.8 1.5l2.9-2.9C17 3.7 14.7 2.6 12 2.6 8.1 2.6 4.6 5.1 2.9 7.6l3.4 2.6C7.1 8.6 9.3 6.8 12 6.8z"/>
            </svg>
            {{ isSignup ? 'Criar conta com Google' : 'Entrar com Google' }}
          </span>
        </button>

      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue';
import { useAuth } from '../services/auth';
import { useRouter, useRoute } from 'vue-router';

export default {
  name: 'LoginView',
  setup() {
    const { user, signInWithGoogle, createUserProfile, userProfileExists, logout } = useAuth();
    const router = useRouter();
    const route = useRoute();
    const baseUrl = process.env.BASE_URL || '/';
    const authMessage = ref('');
    const authPending = ref(false);

    const isSignup = computed(() => route.query.mode === 'signup');

    const login = async () => {
      authMessage.value = '';
      authPending.value = true;
      const signedUser = await signInWithGoogle();
      if (!signedUser) {
        authPending.value = false;
        return;
      }
      const exists = await userProfileExists(signedUser.uid);
      if (isSignup.value) {
        if (exists) {
          authMessage.value = 'Conta existente, faça login.';
          await logout();
          authPending.value = false;
          return;
        }
        await createUserProfile(signedUser);
      } else if (!exists) {
        authMessage.value = 'Conta inexistente, crie sua conta primeiro.';
        await logout();
        authPending.value = false;
        return;
      }
      authPending.value = false;
      router.push('/');
    };

    const goToSignup = () => {
      router.push({ path: '/login', query: { mode: 'signup' } });
    };

    const goToLogin = () => {
      router.push({ path: '/login', query: {} });
    };


    watch(user, (currentUser) => {
      if (currentUser && !authPending.value && !authMessage.value) {
        router.push('/');
      }
    });

    return { login, isSignup, goToSignup, goToLogin, baseUrl, authMessage, authPending };
  },
};
</script>
