<template>
  <div class="app-screen app-screen--glow">
    <div class="upgrade-card">
      <div class="upgrade-header">
        <p class="profile-kicker">Upgrade</p>
        <h1 class="profile-title">Desbloquear recurso</h1>
        <p class="profile-subtitle">Finalize o pagamento e envie o comprovativo para liberar o acesso.</p>
      </div>

      <div v-if="loading" class="status-text">Carregando dados do recurso...</div>
      <div v-else>
        <div class="upgrade-summary">
          <div>
            <span>Categoria</span>
            <strong>{{ category?.name || 'Plano Premium' }}</strong>
          </div>
          <div>
            <span>Subcategoria</span>
            <strong>{{ subcategory?.name || 'Acesso total' }}</strong>
          </div>
          <div>
            <span>Valor</span>
            <strong>{{ priceLabel }}</strong>
          </div>
        </div>

        <div class="upgrade-instructions">
          <h2>Instruções de pagamento</h2>
          <p v-if="isDefaultUpgrade" class="upgrade-note">
            Este plano dá acesso total ao usuário indefinidamente na plataforma, por tempo ilimitado.
          </p>
          <ol>
            <li>Faça um pagamento por referência.</li>
            <li>Use um terminal ATM, app Multicaixa Express ou o Internet Banking do seu banco.</li>
            <li>Escolha Pagamentos → Pagamentos por Referência.</li>
            <li>Entidade: <strong>00930</strong></li>
            <li>Referência: <strong>933788797</strong></li>
            <li>Valor: <strong>{{ priceLabel }}</strong></li>
          </ol>
          <p class="upgrade-note">
            Depois de pagar, clique em Continuar e envie a mensagem pré-definida no WhatsApp. Após enviar,
            mande o print ou foto do comprovativo. O acesso será liberado em alguns minutos (máximo 24h).
          </p>
        </div>

        <button class="button button-primary button-large button-full" @click="openWhatsApp">
          Continuar
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { doc, getDoc, getDocs, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../services/auth';

export default {
  name: 'UpgradeView',
  setup() {
    const route = useRoute();
    const { user } = useAuth();
    const loading = ref(true);
    const category = ref(null);
    const subcategory = ref(null);
    const isDefaultUpgrade = ref(false);
    const defaultPrice = 5000;

    const priceLabel = computed(() => {
      if (isDefaultUpgrade.value) return `AOA ${defaultPrice}`;
      if (!subcategory.value || typeof subcategory.value.price !== 'number') return 'AOA 0';
      return `AOA ${subcategory.value.price}`;
    });

    const loadResource = async () => {
      const feature = String(route.query.feature || '');
      const categoryHint = String(route.query.category || '');
      if (!feature) {
        isDefaultUpgrade.value = true;
        loading.value = false;
        return;
      }

      const catSnap = await getDoc(doc(db, 'catogories', feature));
      if (catSnap.exists()) {
        category.value = { id: catSnap.id, ...catSnap.data() };
        loading.value = false;
        return;
      }

      if (categoryHint) {
        const subSnap = await getDoc(doc(db, 'catogories', categoryHint, 'subcategories', feature));
        if (subSnap.exists()) {
          const catDoc = await getDoc(doc(db, 'catogories', categoryHint));
          if (catDoc.exists()) {
            category.value = { id: catDoc.id, ...catDoc.data() };
          }
          subcategory.value = { id: subSnap.id, ...subSnap.data() };
          loading.value = false;
          return;
        }
      }

      const allCats = await getDocs(collection(db, 'catogories'));
      for (const catDoc of allCats.docs) {
        const catId = catDoc.id;
        const subSnap = await getDoc(doc(db, 'catogories', catId, 'subcategories', feature));
        if (subSnap.exists()) {
          category.value = { id: catDoc.id, ...catDoc.data() };
          subcategory.value = { id: subSnap.id, ...subSnap.data() };
          break;
        }
      }

      loading.value = false;
    };

    const openWhatsApp = async () => {
      if (user.value?.email) {
        await addDoc(collection(db, 'requests'), {
          created_at: serverTimestamp(),
          feature_requested: isDefaultUpgrade.value
            ? 'premium'
            : `${category.value?.id || ''},${subcategory.value?.id || ''}`,
          status: 'pending',
          user_email: user.value.email
        });
      }
      const uid = user.value?.uid || 'desconhecido';
      const catId = category.value?.id || 'nao-definida';
      const subId = subcategory.value?.id || 'nao-definida';
      const message = isDefaultUpgrade.value
        ? `Olá! Concluí o pagamento do plano Premium. Chave de confirmação: ${uid}.`
        : `Olá! Concluí o pagamento do acesso. Chave de confirmação: ${uid}-${catId}-${subId}.`;
      const url = `https://wa.me/244933788797?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    };

    onMounted(loadResource);

    return { loading, category, subcategory, priceLabel, openWhatsApp, isDefaultUpgrade };
  }
};
</script>
