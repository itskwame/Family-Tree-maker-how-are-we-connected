// CDP measurements include the outer preparation worker and ELK's nested worker.
// Samples are JS isolate heaps, not total browser/GPU memory or guaranteed peaks.
export async function workerHeaps(browser) {
  const session = await browser.newBrowserCDPSession(), samples = [];
  try {
    const { targetInfos } = await session.send('Target.getTargets');
    for (const target of targetInfos.filter(t => t.type === 'worker' && /layout\.worker|elk-worker/.test(t.url))) {
      let sessionId;
      try {
        ({ sessionId } = await session.send('Target.attachToTarget', { targetId: target.targetId, flatten: false }));
        const heap = await new Promise((resolve, reject) => {
          const timer = setTimeout(() => { session.off('Target.receivedMessageFromTarget', receive); reject(new Error('Worker snapshot timeout')); }, 2000);
          function receive(event) {
            if (event.sessionId !== sessionId) return;
            const message = JSON.parse(event.message);
            if (message.id !== 1) return;
            clearTimeout(timer); session.off('Target.receivedMessageFromTarget', receive);
            message.error ? reject(new Error(message.error.message)) : resolve(message.result);
          }
          session.on('Target.receivedMessageFromTarget', receive);
          session.send('Target.sendMessageToTarget', { sessionId, message: JSON.stringify({ id: 1, method: 'Runtime.getHeapUsage' }) }).catch(reject);
        });
        samples.push({ role: target.url.includes('elk-worker') ? 'ELK' : 'layout preparation', ...heap });
      } catch (error) { samples.push({ role: target.url.includes('elk-worker') ? 'ELK' : 'layout preparation', error: error.message }); }
      finally { if (sessionId) await session.send('Target.detachFromTarget', { sessionId }).catch(() => {}); }
    }
  } finally { await session.detach(); }
  return samples;
}
