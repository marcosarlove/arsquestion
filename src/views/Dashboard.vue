<template>
  <div class="app-screen app-screen--glow">
    <div class="coming-card">
      <p class="profile-kicker">Em breve</p>
      <h1 class="profile-title">Essa página ganhará vida em breve</h1>
      <p class="profile-subtitle">
        Por enquanto, descubra outros recursos e acompanhe as novidades.
      </p>
      <div class="cta-row">
        <button class="button button-primary" @click="$router.push('/')">Voltar para a inicial</button>
        <button class="button button-secondary" @click="$router.push('/profile')">Ver perfil</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardView',
};
</script>
