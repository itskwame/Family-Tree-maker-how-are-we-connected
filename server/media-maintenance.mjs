// Called by an approved operator/scheduler, never by a browser endpoint.
export async function maintainPrivateMedia(admin) {
  const result = await admin.rpc('fc_social_maintenance');
  if (result.error) throw Error('Media maintenance RPC failed');
  const paths = result.data;
  if (!Array.isArray(paths) || paths.length > 500 || paths.some(p => typeof p !== 'string' || !p || p.includes('..'))) throw Error('Invalid cleanup manifest');
  if (!paths.length) return {removed: 0};
  const removed = await admin.storage.from('family-private').remove(paths);
  if (removed.error) throw Error('Private object cleanup failed; retry required');
  return {removed: paths.length};
}
