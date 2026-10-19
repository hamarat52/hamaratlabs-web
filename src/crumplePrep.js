/* Buruşma yollarını önceden, Web Worker'da hazırlar. PaperCrumple bir kâğıdı açarken
   paperPathStore'da yolunu bulursa ağır fizik hesabını atlar; böylece "buruştur" anında
   sayfa donmaz. Worker kurulamazsa iş, eskisi gibi PaperCrumple'ın içinde yapılır. */
import { buildSheet, paperPathStore } from './components/rb/PaperCrumple/paperPath';

let worker = null; // null: henüz kurulmadı, false: kullanılamıyor
const jobs = new Map(); // key -> { key, options, promise, resolve }
const queue = [];
let busy = null;

function finishJob(key) {
  const job = jobs.get(key);
  jobs.delete(key);
  job?.resolve();
}

function getWorker() {
  if (worker !== null) return worker;
  try {
    worker = new Worker(new URL('./components/rb/PaperCrumple/paperPath.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = e => {
      const { key, samples, creased, error } = e.data;
      if (!error) paperPathStore.set(key, { samples, creased });
      busy = null;
      finishJob(key);
      pump();
    };
    worker.onerror = () => {
      worker = false;
      busy = null;
      for (const key of [...jobs.keys()]) finishJob(key);
      queue.length = 0;
    };
  } catch {
    worker = false;
  }
  return worker;
}

function pump() {
  if (busy || !queue.length) return;
  const w = getWorker();
  if (!w) {
    for (const job of queue.splice(0)) finishJob(job.key);
    return;
  }
  busy = queue.shift();
  w.postMessage({ key: busy.key, options: busy.options });
}

const keyOf = options => buildSheet(options).key;

const seedOf = text => {
  let h = 7;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return (Math.abs(h) % 997) + 3;
};

// Fikir panosundaki bir notun kâğıt ayarları: önceden hazırlama ile buruşturma aynı anahtarı üretsin.
export const noteCrumpleOptions = (key, w, h) => ({
  width: w,
  height: h,
  detail: 56,
  seed: seedOf(key),
  foldCount: 7,
  foldSharpness: 0.7,
  wrinkleDepth: 0.8
});

export const hasPaperPath = options => paperPathStore.has(keyOf(options));

// urgent: kullanıcı bu nota yöneldi (üstüne geldi, tuttu, buruşturdu): sıranın başına al.
export function preparePaper(options, urgent = false) {
  const key = keyOf(options);
  if (paperPathStore.has(key)) return Promise.resolve();
  let job = jobs.get(key);
  if (!job) {
    job = { key, options };
    job.promise = new Promise(resolve => (job.resolve = resolve));
    jobs.set(key, job);
    queue.push(job);
  }
  if (urgent) {
    const i = queue.indexOf(job);
    if (i > 0) queue.unshift(...queue.splice(i, 1));
  }
  pump();
  return job.promise;
}
