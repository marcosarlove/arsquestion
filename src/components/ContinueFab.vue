<template>
  <div v-if="visible" class="continue-fab">
    <button class="button button-primary button-hero" @click="continueGame">
      Continuar jogo
    </button>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../services/auth';

export default {
  name: 'ContinueFab',
  setup() {
    const router = useRouter();
    const { user } = useAuth();
    const hasGame = ref(false);

    const checkGame = () => {
      hasGame.value = !!localStorage.getItem('ars_gameState');
    };

    const visible = computed(() => {
      const path = router.currentRoute.value.path;
      const blocked = path === '/game' || path.startsWith('/quiz') || path === '/end';
      return !!user.value && hasGame.value && !blocked;
    });

    const continueGame = () => {
      router.push('/game');
    };

    const handler = () => checkGame();

    onMounted(() => {
      checkGame();
      window.addEventListener('ars_game_state_changed', handler);
      window.addEventListener('storage', handler);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('ars_game_state_changed', handler);
      window.removeEventListener('storage', handler);
    });

    return { visible, continueGame };
  }
};
</script>
