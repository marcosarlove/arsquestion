<template>
  <div class="app-screen app-screen--glow">
    <div class="admin-card">
      <div class="admin-header">
        <div>
          <p class="profile-kicker">Admin</p>
          <h1 class="profile-title">Painel de dados</h1>
          <p class="profile-subtitle">Gerencie registros do sistema em tempo real.</p>
        </div>
        <button class="button button-secondary" @click="$router.push('/')">Voltar</button>
      </div>

      <div class="admin-toolbar">
        <label>
          Coleção
          <select v-model="selectedCollection" @change="handleCollectionChange">
            <option v-for="c in collections" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>
        <label v-if="isCategories">
          Nível
          <select v-model="categoryMode" @change="handleCollectionChange">
            <option value="categories">Categorias</option>
            <option value="subcategories">Subcategorias</option>
          </select>
        </label>
        <label v-if="isCategories && categoryMode === 'subcategories'">
          Categoria
          <select v-model="selectedCategoryId" @change="loadCollection">
            <option v-for="cat in categoriesList" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </label>
        <div class="admin-toolbar__actions">
          <button class="button button-ghost" @click="loadCollection">Atualizar</button>
          <button class="button button-primary" @click="addRow">Adicionar registro</button>
          <button class="button button-secondary" @click="importData" :disabled="importing">Importar dados</button>
        </div>
      </div>

      <div v-if="importStatus.active" class="admin-import">
        <h2 class="profile-section">Importação</h2>
        <div class="admin-import__grid">
          <div>
            <span>Arquivos</span>
            <strong>{{ importStatus.filesProcessed }} / {{ importStatus.totalFiles }}</strong>
          </div>
          <div>
            <span>Perguntas</span>
            <strong>{{ importStatus.questionsAdded }} adicionadas</strong>
          </div>
          <div>
            <span>Ignoradas</span>
            <strong>{{ importStatus.questionsSkipped }}</strong>
          </div>
          <div>
            <span>Categorias</span>
            <strong>{{ importStatus.categoriesAdded }}</strong>
          </div>
          <div>
            <span>Subcategorias</span>
            <strong>{{ importStatus.subcategoriesAdded }}</strong>
          </div>
        </div>
        <div class="admin-import__log" v-if="importStatus.logs.length">
          <p v-for="(log, idx) in importStatus.logs" :key="idx">{{ log }}</p>
        </div>
      </div>

      <div class="admin-table" v-if="fields.length">
        <div v-if="loading" class="status-text">Carregando...</div>
        <div v-else class="admin-table__scroll">
          <table class="admin-table__grid">
            <thead>
              <tr>
                <th v-for="field in fields" :key="field">{{ field }}</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.localKey">
                <td v-for="field in fields" :key="field" :class="`cell-${fieldTypes[field] || 'string'}`">
                  <template v-if="fieldTypes[field] === 'boolean'">
                    <input type="checkbox" v-model="row.localData[field]" />
                  </template>
                  <template v-else-if="fieldTypes[field] === 'map'">
                    <div class="subtable">
                      <div class="subtable__head">
                        <span>Chave</span>
                        <span>Valor</span>
                      </div>
                      <div
                        v-for="(entry, index) in row.mapEntries[field]"
                        :key="`${field}-${index}`"
                        class="subtable__row"
                      >
                        <input type="text" v-model="entry.key" disabled />
                        <input type="text" v-model="entry.value" />
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <input type="text" v-model="row.localData[field]" />
                  </template>
                </td>
                <td class="cell-actions">
                  <button class="button button-primary" @click="saveRow(row)">Salvar</button>
                  <button class="button button-danger" @click="removeRow(row)">Excluir</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="message" class="auth-alert">{{ message }}</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc as deleteDocFs,
  getDoc,
  Timestamp,
  query,
  where,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';

export default {
  name: 'AdminView',
  setup() {
    const collections = ref([]);
    const selectedCollection = ref('');
    const categoryMode = ref('categories');
    const categoriesList = ref([]);
    const selectedCategoryId = ref('');
    const rows = ref([]);
    const fields = ref([]);
    const fieldTypes = ref({});
    const loading = ref(false);
    const message = ref('');
    const isCategories = ref(false);
    const importing = ref(false);
    const importStatus = ref({
      active: false,
      totalFiles: 0,
      filesProcessed: 0,
      categoriesAdded: 0,
      subcategoriesAdded: 0,
      questionsAdded: 0,
      questionsSkipped: 0,
      logs: []
    });

    const dataFiles = [
      'acentuacao_grafica.json',
      'formas_de_tratamento.json',
      'pronominalizacao.json',
      'sintaxe_oracoes.json',
      'verbos.json',
      'verbos_conjugacao.json',
      'conceitos_narrativos.json',
      'morfologia.json',
      'regras_de_pontuacao.json',
      'sintaxe_termos_da_oracao.json',
      'crase.json',
      'ortografia.json',
      'relacao_semantica.json',
      'uso_do_imperativo.json'
    ];

    const loadCollections = async () => {
      const fallback = ['users', 'requests', 'quizzes', 'catogories', 'progress', 'notifications'];
      try {
        const metaSnap = await getDoc(doc(db, 'admin', 'meta'));
        if (metaSnap.exists() && Array.isArray(metaSnap.data().collections)) {
          collections.value = metaSnap.data().collections;
        } else {
          collections.value = fallback;
        }
      } catch {
        collections.value = fallback;
      }
      selectedCollection.value = collections.value[0] || '';
    };

    const loadCategoriesList = async () => {
      const snap = await getDocs(collection(db, 'catogories'));
      categoriesList.value = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name || d.id
      }));
      if (!selectedCategoryId.value && categoriesList.value.length) {
        selectedCategoryId.value = categoriesList.value[0].id;
      }
    };

    const buildFields = (docs) => {
      const set = new Set();
      const types = {};
      docs.forEach((d) => {
        Object.keys(d.data).forEach((key) => set.add(key));
      });
      fields.value = Array.from(set);
      docs.forEach((d) => {
        fields.value.forEach((field) => {
          const value = d.data[field];
          if (value && typeof value.toDate === 'function') {
            types[field] = 'timestamp';
          } else if (typeof value === 'boolean') {
            types[field] = 'boolean';
          } else if (typeof value === 'number') {
            types[field] = 'number';
          } else if (value && typeof value === 'object') {
            types[field] = 'map';
          } else {
            types[field] = 'string';
          }
        });
      });
      fieldTypes.value = types;
    };

    const normalizeValue = (value) => {
      if (value === undefined || value === null) return '';
      if (value && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
      }
      if (typeof value === 'object' && !Array.isArray(value)) {
        return value;
      }
      return value;
    };

    const buildMapEntries = (mapValue) => {
      if (!mapValue || typeof mapValue !== 'object') return [];
      return Object.entries(mapValue).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        allowKeyEdit: false
      }));
    };

    const getCollectionRef = () => {
      if (selectedCollection.value === 'catogories' && categoryMode.value === 'subcategories') {
        if (!selectedCategoryId.value) return null;
        return collection(db, 'catogories', selectedCategoryId.value, 'subcategories');
      }
      return collection(db, selectedCollection.value);
    };

    const getDocRef = (id) => {
      if (selectedCollection.value === 'catogories' && categoryMode.value === 'subcategories') {
        return doc(db, 'catogories', selectedCategoryId.value, 'subcategories', id);
      }
      return doc(db, selectedCollection.value, id);
    };

    const loadCollection = async () => {
      if (!selectedCollection.value) return;
      loading.value = true;
      message.value = '';
      const ref = getCollectionRef();
      if (!ref) {
        loading.value = false;
        return;
      }
      const snap = await getDocs(ref);
      const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
      buildFields(docs);
      rows.value = docs.map((d, index) => {
        const localData = {};
        const mapEntries = {};
        fields.value.forEach((field) => {
          localData[field] = normalizeValue(d.data[field]);
          if (fieldTypes.value[field] === 'map') {
            mapEntries[field] = buildMapEntries(localData[field]);
          }
        });
        return { id: d.id, localData, mapEntries, localKey: `${d.id}-${index}` };
      });
      loading.value = false;
    };

    const addRow = () => {
      const localData = {};
      const mapEntries = {};
      fields.value.forEach((field) => {
        localData[field] = '';
        if (fieldTypes.value[field] === 'map') {
          mapEntries[field] = [];
        }
      });
      rows.value.unshift({ id: null, localData, mapEntries, localKey: `new-${Date.now()}` });
    };

    const parseMapCellValue = (value) => {
      if (value === undefined || value === null) return '';
      const trimmed = String(value).trim();
      if (!trimmed) return '';
      if (trimmed === 'true') return true;
      if (trimmed === 'false') return false;
      if (!Number.isNaN(Number(trimmed)) && trimmed !== '') return Number(trimmed);
      try {
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          return JSON.parse(trimmed);
        }
      } catch {
        return trimmed;
      }
      return trimmed;
    };

    const parseValue = (value, field) => {
      const type = fieldTypes.value[field] || 'string';
      if (type === 'boolean') return !!value;
      if (type === 'number') return value === '' ? null : Number(value);
      if (type === 'timestamp') {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return Timestamp.fromDate(date);
      }
      if (type === 'map') return value || {};
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      if (!trimmed) return '';
      try {
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          return JSON.parse(trimmed);
        }
      } catch {
        return value;
      }
      return value;
    };

    const saveRow = async (row) => {
      message.value = '';
      const mapPayloads = {};
      if (row.mapEntries) {
        Object.keys(row.mapEntries).forEach((field) => {
          const entries = row.mapEntries[field] || [];
          const obj = {};
          entries.forEach((entry) => {
            if (!entry.key) return;
            obj[entry.key] = parseMapCellValue(entry.value);
          });
          mapPayloads[field] = obj;
        });
      }
      const payload = {};
      fields.value.forEach((field) => {
        if (fieldTypes.value[field] === 'map') {
          payload[field] = mapPayloads[field] || {};
        } else {
          payload[field] = parseValue(row.localData[field], field);
        }
      });
      if (row.id) {
        await setDoc(getDocRef(row.id), payload, { merge: true });
      } else {
        const ref = getCollectionRef();
        if (!ref) return;
        const created = await addDoc(ref, payload);
        row.id = created.id;
      }
      await loadCollection();
      message.value = 'Registro salvo com sucesso.';
    };

    const removeRow = async (row) => {
      if (!row.id) {
        rows.value = rows.value.filter((r) => r.localKey !== row.localKey);
        return;
      }
      await deleteDocFs(getDocRef(row.id));
      await loadCollection();
    };

    const handleCollectionChange = async () => {
      isCategories.value = selectedCollection.value === 'catogories';
      if (isCategories.value) {
        await loadCategoriesList();
      }
      await loadCollection();
    };

    const slugify = (value) => {
      return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
    };

    const findCategoryByName = async (name) => {
      const q = query(collection(db, 'catogories'), where('name', '==', name), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, data: docSnap.data() };
      }
      return null;
    };

    const findSubcategoryByName = async (categoryId, name) => {
      const q = query(
        collection(db, 'catogories', categoryId, 'subcategories'),
        where('name', '==', name),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, data: docSnap.data() };
      }
      return null;
    };

    const questionExists = async (categoryId, subcategoryId, questionText) => {
      const q = query(
        collection(db, 'quizzes'),
        where('category_id', '==', categoryId),
        where('subcategory_id', '==', subcategoryId),
        where('question', '==', questionText),
        limit(1)
      );
      const snap = await getDocs(q);
      return !snap.empty;
    };

    const importData = async () => {
      if (importing.value) return;
      importing.value = true;
      importStatus.value = {
        active: true,
        totalFiles: dataFiles.length,
        filesProcessed: 0,
        categoriesAdded: 0,
        subcategoriesAdded: 0,
        questionsAdded: 0,
        questionsSkipped: 0,
        logs: []
      };

      for (const file of dataFiles) {
        try {
          const response = await fetch(`/data/${file}`);
          const payload = await response.json();
          const categoryName = payload.category;
          const subcategoryName = payload.subcategory;

          let categoryDoc = await findCategoryByName(categoryName);
          if (!categoryDoc) {
            const created = await addDoc(collection(db, 'catogories'), {
              name: categoryName,
              icon: slugify(categoryName),
              is_active: true
            });
            categoryDoc = { id: created.id };
            importStatus.value.categoriesAdded += 1;
            importStatus.value.logs.push(`Categoria criada: ${categoryName}`);
          }

          let subcategoryDoc = await findSubcategoryByName(categoryDoc.id, subcategoryName);
          if (!subcategoryDoc) {
            const created = await addDoc(collection(db, 'catogories', categoryDoc.id, 'subcategories'), {
              name: subcategoryName,
              icon: slugify(subcategoryName),
              is_active: true
            });
            subcategoryDoc = { id: created.id };
            importStatus.value.subcategoriesAdded += 1;
            importStatus.value.logs.push(`Subcategoria criada: ${subcategoryName}`);
          }

          for (const question of payload.questions || []) {
            const exists = await questionExists(categoryDoc.id, subcategoryDoc.id, question.question);
            if (exists) {
              importStatus.value.questionsSkipped += 1;
              continue;
            }
            const correct = question.options[question.correctAnswerIndex];
            const wrongs = question.options.filter((_, idx) => idx !== question.correctAnswerIndex);
            await addDoc(collection(db, 'quizzes'), {
              category_id: categoryDoc.id,
              subcategory_id: subcategoryDoc.id,
              question: question.question,
              dificulty: question.difficulty || 'easy',
              hint: question.hint || '',
              hint_corret: question.hintCorrect || '',
              hint_wromg: question.hintWrong || '',
              options: {
                corret: correct || '',
                wrong1: wrongs[0] || '',
                wrong2: wrongs[1] || '',
                wrong3: wrongs[2] || ''
              }
            });
            importStatus.value.questionsAdded += 1;
          }

          importStatus.value.filesProcessed += 1;
        } catch (error) {
          importStatus.value.logs.push(`Erro em ${file}`);
          importStatus.value.filesProcessed += 1;
        }
      }

      importing.value = false;
      await handleCollectionChange();
    };

    onMounted(async () => {
      await loadCollections();
      await handleCollectionChange();
    });

    return {
      collections,
      selectedCollection,
      rows,
      fields,
      fieldTypes,
      loading,
      message,
      loadCollection,
      handleCollectionChange,
      addRow,
      saveRow,
      removeRow,
      categoryMode,
      categoriesList,
      selectedCategoryId,
      isCategories,
      importing,
      importStatus,
      importData
    };
  }
};
</script>
