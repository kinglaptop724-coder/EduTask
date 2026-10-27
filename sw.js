/* EduTask service worker
 * - เก็บไฟล์หน้าเว็บไว้ในเครื่อง เพื่อให้เปิดแอปได้เร็วและไม่ขึ้นหน้าว่างเมื่อสัญญาณหลุด
 * - ไม่แตะต้องการเรียก Apps Script (ข้อมูลงานต้องสดเสมอ)
 * - รับแจ้งเตือน (push) จาก Firebase Cloud Messaging แล้วแสดงบนมือถือ + ตั้งตัวเลขบนไอคอน
 * - เปลี่ยนเลข VERSION เมื่อต้องการบังคับให้เครื่องผู้ใช้ล้างแคชเก่า */
const VERSION = 'edutask-v4';
const SHELL = [
  './',
  'index.html',
  'config.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'icons/badge-96.png'
];
const CDN_HOSTS = ['cdn.tailwindcss.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // POST ไป Apps Script ผ่านตามปกติ
  const url = new URL(req.url);

  // ไม่แคช API ของ Google (Apps Script)
  if (/(^|\.)google\.com$|googleusercontent\.com$/.test(url.hostname)) return;

  // ไฟล์ของเว็บเอง: ลองเน็ตก่อน (ได้เวอร์ชันใหม่เสมอ) ถ้าไม่ได้ค่อยใช้ที่เก็บไว้
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
    );
    return;
  }

  // Tailwind / ฟอนต์: ใช้ที่เก็บไว้ก่อน แล้วอัปเดตเงียบ ๆ ด้านหลัง
  if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.match(req).then(hit => {
        const net = fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});

/* ===== แจ้งเตือน (push) =====
 * เซิร์ฟเวอร์ส่งเป็น data-only: {title, body, tag, badge, url}
 * - ถ้าแอปเปิดอยู่หน้าจอ → ส่งต่อให้หน้าเว็บแสดงเป็น toast + โหลดข้อมูลใหม่ (ไม่เด้งซ้ำ)
 * - ถ้าแอปปิด/อยู่เบื้องหลัง → แสดงแจ้งเตือนของระบบ */
self.addEventListener('push', e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (_) { p = { data: { body: e.data ? e.data.text() : '' } }; }
  const d = Object.assign({}, p.notification || {}, p.data || {});
  const n = parseInt(d.badge, 10);
  e.waitUntil((async () => {
    if (!isNaN(n) && self.navigator && 'setAppBadge' in self.navigator) {
      try { n > 0 ? await self.navigator.setAppBadge(n) : await self.navigator.clearAppBadge(); } catch (_) {}
    }
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const seen = wins.filter(c => c.visibilityState === 'visible');
    if (seen.length) { seen.forEach(c => c.postMessage({ type: 'push', data: d })); return; }
    await self.registration.showNotification(d.title || 'EduTask', {
      body: d.body || '',
      tag: d.tag || 'edutask',
      renotify: true,
      icon: 'icons/icon-192.png',
      badge: 'icons/badge-96.png',
      data: { url: d.url || './?go=my' }
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './?go=my';
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of wins) {
      if ('focus' in c) { await c.focus(); c.postMessage({ type: 'go', tab: 'my' }); return; }
    }
    await self.clients.openWindow(url);
  })());
});
