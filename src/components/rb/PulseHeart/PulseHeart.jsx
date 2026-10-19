import { useEffect, useRef, useState } from 'react';

import './PulseHeart.css';

// GitHub'ın public REST API'si ziyaretçi adına yıldız atmaya izin vermez (PUT /user/starred
// yalnız kullanıcının kendi token'ıyla çalışır). Bu yüzden kalp: gerçek yıldız sayısını
// gösterir, tıklanınca repo sayfasını açar; yıldızı kullanıcı GitHub'da kendisi atar.
// Tarayıcıda artan sahte bir sayaç YOK.

const API = 'https://api.github.com/repos';
const TTL = 5 * 60 * 1000; // 5 dk: aynı sayfadaki/yeniden yüklemedeki kalpler API'yi tekrar çağırmasın
const STORE_PREFIX = 'pulse-heart:';
const PULSE_MS = 1100;

// Modül düzeyi önbellek: key -> { count: number|null, at: number, promise?: Promise }
const cache = new Map();

const readStore = key => {
  try {
    const raw = window.sessionStorage.getItem(STORE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    return typeof entry?.count === 'number' && Date.now() - entry.at < TTL ? entry : null;
  } catch {
    return null;
  }
};

const writeStore = (key, entry) => {
  try {
    window.sessionStorage.setItem(STORE_PREFIX + key, JSON.stringify(entry));
  } catch {
    /* gizli mod / kota: yalnız bellek önbelleği kullanılır */
  }
};

// Önbellekte taze değer varsa senkron döndürür (undefined = bilinmiyor).
const peekStars = key => {
  const hit = cache.get(key);
  if (hit && !hit.promise && Date.now() - hit.at < TTL) return hit.count;
  const stored = readStore(key);
  if (stored) {
    cache.set(key, stored);
    return stored.count;
  }
  return undefined;
};

// Aynı repo için eşzamanlı istekler tek bir fetch'i paylaşır.
function fetchStars(owner, repo) {
  const key = `${owner}/${repo}`.toLowerCase();
  const known = peekStars(key);
  if (known !== undefined) return Promise.resolve(known);
  const pending = cache.get(key)?.promise;
  if (pending) return pending;

  const promise = fetch(`${API}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
    headers: { Accept: 'application/vnd.github+json' }
  })
    .then(res => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
    .then(data => {
      const count = typeof data?.stargazers_count === 'number' ? data.stargazers_count : null;
      const entry = { count, at: Date.now() };
      cache.set(key, entry);
      if (count !== null) writeStore(key, entry);
      return count;
    })
    .catch(() => {
      // Hata da TTL boyunca bellekte tutulur ki rate limit dolmuşken tekrar tekrar denenmesin.
      cache.set(key, { count: null, at: Date.now() });
      return null;
    });

  cache.set(key, { count: null, at: 0, promise });
  return promise;
}

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const formatCount = n => n.toLocaleString('tr-TR');

const HEART =
  'M12 20.6s-7.4-4.5-9.5-9.1C1 8.2 3 4.2 6.8 4.2c2.2 0 3.6 1.2 5.2 3.1 1.6-1.9 3-3.1 5.2-3.1 3.8 0 5.8 4 4.3 7.3-2.1 4.6-9.5 9.1-9.5 9.1z';

export default function PulseHeart({
  repoOwner,
  repoName,
  size = 22,
  color = '#ff3b5c',
  disabledLabel = "Henüz GitHub'da değil",
  className = ''
}) {
  const enabled = Boolean(repoOwner && repoName);
  const key = enabled ? `${repoOwner}/${repoName}`.toLowerCase() : '';
  const repoUrl = enabled ? `https://github.com/${repoOwner}/${repoName}` : '';

  // count: undefined = yükleniyor, null = hata (gizli), number = gerçek değer
  const [result, setResult] = useState(() => ({ key, count: enabled ? peekStars(key) : null }));
  const [beat, setBeat] = useState(0); // her tıklamada artar: animasyonu baştan başlatır
  const [pulsing, setPulsing] = useState(false);
  const timer = useRef(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    fetchStars(repoOwner, repoName).then(count => {
      if (alive) setResult({ key, count });
    });
    return () => {
      alive = false;
    };
  }, [enabled, key, repoOwner, repoName]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Prop değişip yeni veri gelmediyse eski repo'nun sayısını gösterme.
  const count = !enabled ? null : result.key === key ? result.count : undefined;
  const loading = enabled && count === undefined;
  const hasCount = typeof count === 'number';

  const handleClick = () => {
    if (!enabled) return;
    if (!reducedMotion()) {
      window.clearTimeout(timer.current);
      setBeat(b => b + 1);
      setPulsing(true);
      timer.current = window.setTimeout(() => setPulsing(false), PULSE_MS);
    }
    // Kullanıcı jesti içinde senkron açılır; aksi halde açılır pencere engelleyicisine takılır.
    window.open(repoUrl, '_blank', 'noopener,noreferrer');
  };

  const label = enabled
    ? `${repoName} reposunu GitHub'da yıldızla${hasCount ? ` (şu an ${formatCount(count)} yıldız)` : ''}`
    : disabledLabel;

  return (
    <span
      className={`pulse-heart ${className}`.trim()}
      style={{ '--ph-size': `${size}px`, '--ph-color': color }}
      data-state={!enabled ? 'disabled' : loading ? 'loading' : hasCount ? 'ready' : 'nocount'}
    >
      <button
        type="button"
        className="pulse-heart__btn"
        onClick={handleClick}
        aria-disabled={!enabled}
        aria-label={label}
        title={enabled ? 'GitHub’da yıldızla' : undefined}
        data-pulsing={pulsing}
      >
        <span className="pulse-heart__icon" key={beat} aria-hidden="true">
          <span className="pulse-heart__ring" />
          <svg className="pulse-heart__svg" viewBox="0 0 24 24" width={size} height={size}>
            <path d={HEART} />
          </svg>
        </span>
        {loading && <span className="pulse-heart__skeleton" aria-hidden="true" />}
        {hasCount && <span className="pulse-heart__count">{formatCount(count)}</span>}
      </button>
      {!enabled && (
        <span className="pulse-heart__tip" role="tooltip">
          {disabledLabel}
        </span>
      )}
    </span>
  );
}
