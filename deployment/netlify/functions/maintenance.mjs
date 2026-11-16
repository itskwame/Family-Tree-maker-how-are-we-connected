import {createClient} from '@supabase/supabase-js';
import {hostedMediaConfig} from '../../../server/media-handler.mjs';
import {maintainPrivateMedia} from '../../../server/media-maintenance.mjs';

// Inactive candidate directory. Activation requires explicit hosted approval.
export const config = {schedule: '0 * * * *'};
export default async () => {
  if (process.env.FC_MAINTENANCE_ENABLED !== 'true') return new Response(null, {status: 204});
  const cfg = hostedMediaConfig(process.env);
  const admin = createClient(cfg.url, cfg.secret, {auth: {persistSession: false, autoRefreshToken: false}});
  await maintainPrivateMedia(admin);
  return new Response(null, {status: 204});
};
