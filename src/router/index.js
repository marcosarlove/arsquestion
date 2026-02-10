import { createRouter, createWebHistory } from 'vue-router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css'; // Importa o CSS do NProgress
import StartScreen from '../views/StartScreen.vue';
import GameScreen from '../views/GameScreen.vue';
import EndScreen from '../views/EndScreen.vue';
import LoginView from '../views/LoginView.vue';
import Dashboard from '../views/Dashboard.vue';
import ProfileView from '../views/ProfileView.vue';
import AdminView from '../views/AdminView.vue';
import ComingSoonView from '../views/ComingSoon.vue';
import QuizCategories from '../views/QuizCategories.vue';
import QuizSubcategories from '../views/QuizSubcategories.vue';
import UpgradeView from '../views/UpgradeView.vue';
import { useAuth } from '../services/auth';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/',
    name: 'StartScreen',
    component: StartScreen,
  },
  {
    path: '/game',
    name: 'GameScreen',
    component: GameScreen,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/quiz',
    name: 'QuizCategories',
    component: QuizCategories,
    meta: { requiresAuth: true }
  },
  {
    path: '/quiz/:categoryId',
    name: 'QuizSubcategories',
    component: QuizSubcategories,
    meta: { requiresAuth: true }
  },
  {
    path: '/upgrade',
    name: 'Upgrade',
    component: UpgradeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/aulas',
    name: 'Lessons',
    component: ComingSoonView,
    meta: { requiresAuth: true }
  },
  {
    path: '/estatisticas',
    name: 'Stats',
    component: ComingSoonView,
    meta: { requiresAuth: true }
  },
  {
    path: '/end',
    name: 'EndScreen',
    component: EndScreen,
    props: (route) => ({
      result: route.query.result || route.params.result,
      score: Number(route.query.score || route.params.score || 0)
    }),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Configuração do NProgress
NProgress.configure({ showSpinner: false });

router.beforeEach(async (to, from, next) => {
  NProgress.start();
  const { user: authUser, authReadyPromise } = useAuth();
  await authReadyPromise;
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);

  if (to.path === '/login' && authUser.value) {
    next('/');
    return;
  }

  if (requiresAuth && !authUser.value) {
    next('/login');
    return;
  }

  if (requiresAdmin) {
    const snap = await getDoc(doc(db, 'users', authUser.value.uid));
    const role = snap.exists() ? (snap.data().role || 'student') : 'student';
    if (role !== 'admin') {
      next('/');
      return;
    }
  }

  next();
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
