// Build-time flags are not URL parameters or localStorage preferences.
export const environment=typeof __FAMILYCONNECT_ENV__==='string'?__FAMILYCONNECT_ENV__:'unconfigured';
export const demoEnabled=typeof __FAMILYCONNECT_DEMO__!=='undefined'&&__FAMILYCONNECT_DEMO__===true&&typeof location!=='undefined'&&['localhost','127.0.0.1'].includes(location.hostname);
export const releaseConfig=typeof __FAMILYCONNECT_CONFIG__!=='undefined'?__FAMILYCONNECT_CONFIG__:null;
export function allowedPortrait(photo,allowDemo=demoEnabled){
 if(!photo)return null;
 if(!allowDemo&&(/family-portraits|pexels|unsplash|pravatar|randomuser|picsum/i.test(photo)))return null;
 return photo;
}
