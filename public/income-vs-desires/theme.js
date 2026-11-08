/**
 * Tema. Aydınlık varsayılan: sistem karanlık olsa bile kullanıcı seçmedikçe
 * değişmez. Tercih localStorage'da tutulur.
 *
 * Bu dosya <head> içinde, senkron yüklenir; yoksa sayfa önce aydınlık çizilip
 * sonra karanlığa atlar. Düğme bağlama işi DOMContentLoaded'a bırakıldı.
 */
(function () {
  'use strict';

  const KEY = 'ivd-theme';
  const root = document.documentElement;

  const read = () => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  };

  const apply = (theme) => {
    if (theme === 'dark') root.dataset.theme = 'dark';
    else delete root.dataset.theme;
  };

  apply(read());

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.theme-toggle');
    if (!button) return;

    const sync = () => {
      const dark = root.dataset.theme === 'dark';
      // İngilizce sayfalar (site/en/) aynı dosyayı kullanıyor.
      const en = /^en\b/.test(root.lang);
      button.textContent = dark ? '☀' : '☾';
      button.setAttribute(
        'aria-label',
        en
          ? dark ? 'Switch to light theme' : 'Switch to dark theme'
          : dark ? 'Aydınlık görünüme geç' : 'Karanlık görünüme geç'
      );
      button.setAttribute('aria-pressed', String(dark));
    };

    button.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(next);
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // Depolama kapalıysa tercih sadece bu sekmede geçerli olur.
      }
      sync();
    });

    sync();
  });
})();
