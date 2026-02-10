import { createRouter, createWebHistory } from 'vue-router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css'; // Importa o CSS do NProgress
import StartScreen from '../views/StartScreen.vue';
import GameScreen from '../views/GameScreen.vue';
import EndScreen from '../views/EndScreen.vue';
import LoginView from '../views/LoginView.vue';
import { useAuth } from '../services/auth';

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
    path: '/end',
    name: 'EndScreen',
    component: EndScreen,
    props: true,
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

  if (requiresAuth && !authUser.value) {
    next('/login');
  } else {
    next();
  }
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
