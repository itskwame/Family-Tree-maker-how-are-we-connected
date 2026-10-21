import React,{useState,useEffect} from 'react';
import {db} from './client';
export function EmailLinkAuth({onBack}){
 const [email,setEmail]=useState(''),[busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState(''),[cooldown,setCooldown]=useState(0);
 useEffect(()=>{if(!cooldown)return;const timer=setTimeout(()=>setCooldown(c=>c-1),1000);return()=>clearTimeout(timer)},[cooldown]);
 const submit=async e=>{e.preventDefault();if(busy||cooldown)return;setBusy(true);setError('');try{
  const {error}=await db.auth.signInWithOtp({email:email.trim(),options:{shouldCreateUser:true,emailRedirectTo:location.origin+'/phase6.html'}});
  if(error)throw error;setSent(true);setCooldown(60);
 }catch{setError('We couldn’t request a link. Check your email address and try again shortly.')}finally{setBusy(false)}};
 return <form className="card auth" onSubmit={submit}><p className="step">CONFIRM YOUR EMAIL</p><h2>Continue without a password</h2><p>We’ll email you a secure sign-in link. New here? The link can also verify your new account.</p><label>Email address<input type="email" autoComplete="email" required value={email} onChange={e=>{setEmail(e.target.value);setSent(false)}}/></label><button className="primary" disabled={busy||cooldown>0}>{busy?'Requesting link…':cooldown?`Request again in ${cooldown}s`:'Email me a sign-in link'}</button>{sent&&<p role="status">Check your local email inbox. Open the sign-in link in this tab, or return to this invitation tab after verifying. No family profile is claimed until you confirm your invitation.</p>}{error&&<p role="alert">{error}</p>}<button type="button" className="text" onClick={onBack}>Use a password instead</button><p className="small">Use the email on your invitation. Email verification does not replace independent identity approval.</p></form>;
}
