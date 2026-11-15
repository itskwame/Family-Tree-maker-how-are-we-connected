// server/media-handler.mjs
import { createClient } from "@supabase/supabase-js";

// scripts/image-policy.mjs
import sharp from "sharp";
var imagePolicy = Object.freeze({ inputBytes: 8 * 1024 * 1024, inputPixels: 25e6, edge: 1600, thumbnailEdge: 400, imageBytes: 45e4, thumbnailBytes: 5e4 });
async function optimizePhoto(source) {
  if (source.length > imagePolicy.inputBytes) throw Error("Photos must be under 8 MB");
  const decoder = sharp(source, { limitInputPixels: imagePolicy.inputPixels, animated: false, failOn: "warning" });
  const meta = await decoder.metadata();
  if (!["jpeg", "png", "webp"].includes(meta.format) || meta.pages > 1) throw Error("Use a still JPEG, PNG or WebP photograph");
  let image;
  for (const [edge, quality] of [[1600, 78], [1600, 68], [1280, 68], [1024, 58], [768, 55]]) {
    image = await decoder.clone().rotate().resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true }).webp({ quality }).toBuffer({ resolveWithObject: true });
    if (image.data.length <= imagePolicy.imageBytes) break;
  }
  let thumbnail;
  for (const quality of [70, 55, 40]) {
    thumbnail = await sharp(image.data).resize({ width: imagePolicy.thumbnailEdge, height: imagePolicy.thumbnailEdge, fit: "inside", withoutEnlargement: true }).webp({ quality }).toBuffer();
    if (thumbnail.length <= imagePolicy.thumbnailBytes) break;
  }
  if (image.data.length > imagePolicy.imageBytes || thumbnail.length > imagePolicy.thumbnailBytes) throw Error("This photograph is too detailed to fit the image limit. Try a smaller image.");
  return { image: image.data, thumbnail, width: image.info.width, height: image.info.height, bytes: image.data.length + thumbnail.length };
}

// server/media-handler.mjs
var transportLimit = 4e6;
var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function hostedMediaConfig(env) {
  if (env.FC_MEDIA_ENABLED !== "true") throw Error("Media service is disabled");
  const url = env.FC_SUPABASE_URL, origin = env.FC_APP_ORIGIN, key = env.FC_SUPABASE_ANON_KEY, secret = env.FC_SUPABASE_SERVICE_KEY;
  if (url !== "https://jmsntxwkaneluqgnzzim.supabase.co") throw Error("Unexpected project");
  const app = new URL(origin);
  if (app.protocol !== "https:" || app.origin !== origin || ["localhost", "127.0.0.1"].includes(app.hostname)) throw Error("Exact HTTPS app origin required");
  function role(k) {
    try {
      return JSON.parse(Buffer.from(k.split(".")[1], "base64url")).role;
    } catch {
      return "";
    }
  }
  if (!(key?.startsWith("sb_publishable_") || role(key) === "anon") || !(secret?.startsWith("sb_secret_") || role(secret) === "service_role")) throw Error("Server credentials required");
  return { url, origin, key, secret };
}
function createMediaHandler(config) {
  const admin = createClient(config.url, config.secret, { global: { fetch: config.fetch }, auth: { persistSession: false, autoRefreshToken: false } });
  let active = 0;
  return async (request) => {
    const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Vary": "Origin" };
    const reply = (status, error) => new Response(JSON.stringify(error), { status, headers: { ...headers, "Content-Type": "application/json" } });
    if (request.headers.get("origin") !== config.origin) return reply(403, { error: "Application origin required" });
    headers["Access-Control-Allow-Origin"] = config.origin;
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...headers, "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "POST" } });
    if (request.method !== "POST") return reply(405, { error: "POST required" });
    if (active >= 2) return reply(429, { error: "Uploads are busy. Please retry shortly." });
    active++;
    let asset, user, business;
    try {
      const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/)?.[1];
      if (!token) return reply(401, { error: "Sign in required" });
      user = createClient(config.url, config.key, { global: { fetch: config.fetch, headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
      const auth = await user.auth.getUser(token);
      if (auth.error || !auth.data.user) return reply(401, { error: "Sign in required" });
      const type = request.headers.get("content-type");
      if (!["image/jpeg", "image/png", "image/webp"].includes(type)) return reply(415, { error: "Use a still JPEG, PNG or WebP photograph" });
      if (Number(request.headers.get("content-length")) > transportLimit) return reply(413, { error: "Prepared photo exceeds the 4 MB upload limit" });
      const query = new URL(request.url).searchParams, targets = ["business", "post", "person"].filter((k) => query.has(k));
      if (targets.length !== 1 || !uuid.test(query.get(targets[0]))) return reply(400, { error: "One valid upload destination is required" });
      business = targets[0] === "business";
      const kind = query.get("kind") || "photo";
      if (business && !["logo", "photo"].includes(kind)) return reply(400, { error: "Invalid photograph kind" });
      const payload = business ? { id: query.get("business"), kind } : { [targets[0]]: query.get(targets[0]) };
      const reserved = await user.rpc(business ? "fc_business" : "fc_social", { action: "reserve_media", payload });
      if (reserved.error) {
        const message = reserved.error.message;
        if (/limit|storage|slow down|uploads are paused/i.test(message)) return reply(429, { error: message });
        return reply(403, { error: "Upload destination is not authorized" });
      }
      asset = reserved.data.id;
      const reader = request.body?.getReader();
      if (!reader) throw Error("Invalid image");
      const chunks = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > transportLimit) {
          await reader.cancel();
          throw Error("Prepared photo exceeds the 4 MB upload limit");
        }
        chunks.push(value);
      }
      const image = await optimizePhoto(Buffer.concat(chunks));
      for (const [name, data] of [["image", image.image], ["thumbnail", image.thumbnail]]) {
        const result = await admin.storage.from("family-private").upload(`${asset}/${name}.webp`, data, { contentType: "image/webp", cacheControl: "0", upsert: false });
        if (result.error) throw Error("Storage write failed");
      }
      const complete = await admin.rpc(business ? "fc_business_media_complete" : "fc_media_complete", { asset, w: image.width, h: image.height, size_bytes: image.bytes });
      if (complete.error) throw Error("Final authorization failed");
      return reply(200, { id: asset, width: image.width, height: image.height, bytes: image.bytes });
    } catch (error) {
      if (asset) {
        const removed = await admin.storage.from("family-private").remove([`${asset}/image.webp`, `${asset}/thumbnail.webp`]);
        if (!removed.error) await user.rpc(business ? "fc_business" : "fc_social", { action: "delete_media", payload: business ? { id: new URL(request.url).searchParams.get("business"), asset } : { id: asset } });
      }
      return reply(error.message.includes("4 MB") ? 413 : 400, { error: error.message.includes("4 MB") ? error.message : "Photo could not be saved. Use a smaller still image or retry." });
    } finally {
      active--;
    }
  };
}

// deployment/netlify/functions/upload.mjs
var handler;
var upload_default = async (request) => {
  try {
    handler ||= createMediaHandler(hostedMediaConfig(process.env));
  } catch {
    return new Response(JSON.stringify({ error: "Photo uploads are not configured" }), { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }
  return handler(request);
};
export {
  upload_default as default
};
