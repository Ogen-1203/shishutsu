// 支出記録 Service Worker
// 画面ファイルを端末に保存しておき、起動を速くする（データはいつもサーバーから取る）。
// 画面を更新したら、下の VERSION の数字を1つ上げてください。
const VERSION = 'v8';
const CACHE = 'shishutsu-' + VERSION;
const FILES = ['./', 'index.html', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Apps Script（データ）や他サイトへの通信は、保存せずそのまま通す
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // 画面（HTML）は「まずネットから、つながらなければ保存分」→ GitHubの更新がすぐ反映される
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); return res; })
        .catch(() => caches.match('index.html'))
    );
    return;
  }
  // アイコンなどは保存分を優先
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
