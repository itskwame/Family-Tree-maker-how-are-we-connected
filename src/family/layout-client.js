// One cancellable worker per request. Termination stops obsolete ELK computation,
// rather than merely ignoring its eventual result. No synchronous fallback.
export function startLayout(graph, options = {}) {
  const started = performance.now();
  const stats = window.__layoutWorkerStats ||= { started: 0, completed: 0, cancelled: 0, failed: 0 };
  const events = window.__layoutEvents ||= [];
  events.push({ type: 'started', at: started, people: graph.people.length });
  stats.started++;
  const worker = new Worker(new URL('./layout.worker.js', import.meta.url), { type: 'module' });
  let settled = false, rejectPromise;
  const promise = new Promise((resolve, reject) => {
    rejectPromise = reject;
    worker.onmessage = ({ data }) => {
      if (settled) return;
      settled = true; worker.terminate();
      if (data.error) { stats.failed++; reject(new Error(data.error)); }
      else { stats.completed++; events.push({ type: 'completed', at: performance.now(), people: graph.people.length }); resolve({ ...data.layout, workerWallMs: performance.now() - started }); }
    };
    worker.onerror = event => { if (!settled) { settled = true; stats.failed++; worker.terminate(); reject(new Error(event.message)); } };
    worker.postMessage({ graph, options });
  });
  return { promise, cancel() {
    if (!settled) {
      settled = true; stats.cancelled++; events.push({ type: 'cancelled', at: performance.now(), people: graph.people.length }); worker.terminate();
      rejectPromise(new DOMException('Obsolete layout cancelled', 'AbortError'));
    }
  } };
}
