const CACHE_NAME = 'arsquestion-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/audio.js',
  '/js/game.js',
  '/js/ui.js',
  '/img/logo.png',
  '/audios/win.ogg',
  '/audios/wrong.ogg',
  '/manifest.json',
  '/data/acentuacao_grafica.json',
  '/data/conceitos_narrativos.json',
  '/data/crase.json',
  '/data/formas_de_tratamento.json',
  '/data/morfologia.json',
  '/data/ortografia.json',
  '/data/pronominalizacao.json',
  '/data/regras_de_pontuacao.json',
  '/data/relacao_semantica.json',
  '/data/sintaxe_oracoes.json',
  '/data/sintaxe_termos_da_oracao.json',
  '/data/uso_do_imperativo.json',
  '/data/verbos_conjugacao.json',
  '/data/verbos.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
