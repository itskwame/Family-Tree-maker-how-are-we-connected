import ELK from 'elkjs/lib/elk-api.js';
import { layoutFamily } from './layout.js';
// Use ELK's supported browser-worker API. The bundled Node/fake-worker entry
// cannot be constructed inside a WorkerGlobalScope.
let engineWorker;
const elk = new ELK({ workerFactory: () => {
  engineWorker = new Worker(new URL('../../node_modules/elkjs/lib/elk-worker.min.js', import.meta.url), { type: 'module' });
  return engineWorker;
} });
self.onmessage = async event => {
  try {
    const layout = await layoutFamily(event.data.graph, elk, event.data.options);
    engineWorker.terminate();
    self.postMessage({ layout });
  } catch (error) { engineWorker.terminate(); self.postMessage({ error: error.message }); }
};
