<template>
  <div class="app-screen app-screen--glow">
    <div class="profile-card">
      <div class="profile-header">
        <div>
          <p class="profile-kicker">Perfil</p>
          <h1 class="profile-title">Suas informações</h1>
          <p class="profile-subtitle">Gerencie apenas o seu nome. Email e dados do sistema são fixos.</p>
        </div>
        <button class="button button-secondary" @click="handleLogout">Sair</button>
      </div>

      <div v-if="loading" class="status-text">Carregando perfil...</div>
      <div v-else class="profile-grid">
        <div class="profile-panel">
          <h2 class="profile-section">Dados principais</h2>
          <div class="profile-field">
            <label>Nome</label>
            <input v-model="name" type="text" placeholder="Seu nome" />
          </div>
          <div class="profile-field">
            <label>Email</label>
            <p>{{ profile.email || '—' }}</p>
          </div>
          <div class="profile-field">
            <label>Criado em</label>
            <p>{{ createdAtText }}</p>
          </div>
          <div class="profile-field">
            <label>Conta de</label>
            <p>{{ roleLabel }}</p>
          </div>
            <div class="profile-field">
              <label>Nível</label>
              <div class="profile-level">
                <span>{{ levelLabel }}</span>
                <button
                  v-if="levelLabel !== 'Premium'"
                  class="button button-ghost button-small"
                  type="button"
                  @click="goToUpgrade"
                >
                  Upgrade
                </button>
              </div>
            </div>
          <button class="button button-primary" @click="saveName" :disabled="saving">
            {{ saving ? 'Salvando...' : 'Salvar alterações' }}
          </button>
        </div>

        <div class="profile-panel profile-panel--accent">
          <h2 class="profile-section">Resumo de progresso</h2>
          <div class="profile-stats">
            <div class="profile-stat">
              <span class="profile-stat__value">{{ profile.stats?.completed_quizzes ?? 0 }}</span>
              <span class="profile-stat__label">Quizzes concluídos</span>
            </div>
            <div class="profile-stat">
              <span class="profile-stat__value">{{ profile.stats?.total_points ?? 0 }}</span>
              <span class="profile-stat__label">Pontos totais</span>
            </div>
          </div>
          <p class="profile-note">Este painel acompanha sua evolução e será ampliado em breve.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../services/auth';

export default {
  name: 'ProfileView',
  setup() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const loading = ref(true);
    const saving = ref(false);
    const profile = ref({});
    const name = ref('');

    const createdAtText = computed(() => {
      const created = profile.value.created_at;
      if (!created) return '—';
      try {
        const date = created.toDate ? created.toDate() : new Date(created);
        return date.toLocaleString('pt-PT');
      } catch {
        return '—';
      }
    });

    const roleLabel = computed(() => {
      const role = (profile.value.role || 'student').toLowerCase();
      return role === 'admin' ? 'Administrador' : 'Estudante';
    });

    const levelLabel = computed(() => {
      return profile.value.is_premium ? 'Premium' : 'Básico';
    });

    const loadProfile = async () => {
      if (!user.value) return;
      const snap = await getDoc(doc(db, 'users', user.value.uid));
      if (snap.exists()) {
        profile.value = snap.data();
        name.value = snap.data().name || '';
      }
      loading.value = false;
    };

    const saveName = async () => {
      if (!user.value) return;
      saving.value = true;
      await updateDoc(doc(db, 'users', user.value.uid), { name: name.value });
      profile.value = { ...profile.value, name: name.value };
      saving.value = false;
    };

    const handleLogout = async () => {
      await logout();
      router.push('/login');
    };

    const goToUpgrade = () => {
      router.push('/upgrade');
    };

    onMounted(loadProfile);

    return { loading, saving, profile, name, createdAtText, roleLabel, levelLabel, saveName, handleLogout, goToUpgrade };
  }
};
</script>
