// Buruşma yolunu (createPaperPath) ana iş parçacığını dondurmadan hesaplar.
import { computePaperPath } from './paperPath';

self.onmessage = e => {
  const { key, options } = e.data;
  try {
    const { path } = computePaperPath(options);
    const transfer = [...path.samples.map(s => s.buffer), path.creased.buffer];
    self.postMessage({ key, samples: path.samples, creased: path.creased }, transfer);
  } catch (error) {
    self.postMessage({ key, error: String(error) });
  }
};
