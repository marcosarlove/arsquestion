<!-- src/views/StartScreen.vue -->
<template>
  <div class="app-screen app-screen--scroll app-screen--glow" ref="page">
    <div class="hero fade-in">
      <div class="hero-logo">
        <img :src="`${baseUrl}img/logo.png`" alt="Logo do ARSQuestion" />
        <div class="hero-mark">ARS<span>Question</span></div>
      </div>
      <div class="badge-row">
        <span class="badge">Quiz Multidisciplinar</span>
        <span class="badge">Aprendizado Ativo</span>
        <span class="badge">Personalizável</span>
      </div>
      <h1 class="hero-title">Bem-vindo ao ARSQuestion.</h1>
      <p class="hero-kicker">Criado por Marcos Arlove</p>
      <p class="hero-subtitle">
        Um app de estudo criado por Marcos Arlove para estudantes de todas as áreas. Ele organiza o
        conhecimento em perguntas e respostas, cria trilhas de prática e transforma o seu repositório em uma
        rotina contínua de aprendizagem.
      </p>
      <div class="hero-actions">
        <button @click="goToLogin" class="button button-primary button-large">Iniciar sessão</button>
        <button @click="goToSignup" class="button button-ghost button-large">Criar conta</button>
      </div>
    </div>

    <div class="hero-visual fade-in delay-1">
      <img :src="`${baseUrl}img/hero.svg`" alt="Visual do fluxo de aprendizado" />
    </div>

    <div class="highlight-card fade-in delay-2">
      <div class="highlight-title">Um repositório infinito de aprendizado</div>
      <div class="highlight-text">
        O quiz é tão versátil que pode incluir qualquer quantidade de áreas do conhecimento. Conforme seu
        acervo cresce, o app continua organizado, rápido e com foco no que realmente importa: você praticar
        com constância.
      </div>
      <div class="metric-row">
        <div class="metric">
          <div class="metric-value">100%</div>
          <div class="metric-label">Foco no estudante</div>
        </div>
        <div class="metric">
          <div class="metric-value">Multiárea</div>
          <div class="metric-label">Qualquer disciplina</div>
        </div>
        <div class="metric">
          <div class="metric-value">24/7</div>
          <div class="metric-label">Ritmo constante</div>
        </div>
      </div>
    </div>

    <div class="section fade-in delay-2">
      <h2 class="section-title">Como funciona</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <div class="step-title">Construa seu repositório</div>
            <div class="section-text">Adicione conteúdo e organize por áreas ou objetivos.</div>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <div class="step-title">Pratique com ritmo</div>
            <div class="section-text">O fluxo de perguntas mantém a consistência diária.</div>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <div class="step-title">Aprenda com feedback</div>
            <div class="section-text">Respostas rápidas, clareza e foco no que precisa melhorar.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section fade-in delay-3">
      <h2 class="section-title">O que torna o ARSQuestion diferente</h2>
      <div class="section-grid">
        <div class="feature-card">
          <div class="feature-title">Aprendizado ativo</div>
          <div class="feature-text">Você aprende resolvendo, não só consumindo conteúdo.</div>
        </div>
        <div class="feature-card">
          <div class="feature-title">Versatilidade real</div>
          <div class="feature-text">Qualquer área do conhecimento cabe aqui sem perder organização.</div>
        </div>
        <div class="feature-card">
          <div class="feature-title">Clareza na evolução</div>
          <div class="feature-text">O fluxo ajuda a identificar lacunas e priorizar estudo.</div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="cta-card fade-in delay-3">
      <h2 class="section-title">Pronto para começar?</h2>
      <p class="section-text">
        Entre agora para continuar onde parou ou crie uma conta e comece sua jornada de estudo.
      </p>
      <div class="cta-row">
        <button @click="goToLogin" class="button button-primary button-large">Iniciar sessão</button>
        <button @click="goToSignup" class="button button-secondary button-large">Criar conta</button>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'StartScreen',
  setup() {
    const router = useRouter();
    const page = ref(null);
    const baseUrl = process.env.BASE_URL || '/';

    const goToLogin = () => {
      router.push('/login');
    };

    const goToSignup = () => {
      router.push({ path: '/login', query: { mode: 'signup' } });
    };

    onMounted(() => {
      window.scrollTo(0, 0);
    });

    return { goToLogin, goToSignup, baseUrl, page };
  }
};
</script>
