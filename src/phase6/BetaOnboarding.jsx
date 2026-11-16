import React from 'react';
import {rpc} from './client';
export function BetaOnboarding({status,busy,onComplete,run}) {
 if(!status?.approved)return <section className="card"><h1>{status?'Private beta approval required':'Checking private beta access…'}</h1><p>Your account is preserved. An operator must approve your access before you can join or create a family network.</p><button disabled={busy} onClick={()=>run(onComplete)}>Check approval again</button></section>;
 if(!status.can_found)return null;
 return <form className="card" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);run(async()=>{await rpc('fc_beta_start_network',{network_name:data.get('network'),first_name:data.get('first'),last_name:data.get('last'),confirm_self:data.get('confirm')==='on'});await onComplete()})}}>
  <h1>Start your approved family network</h1><p>You have one-time permission to create a new family network. Continuing makes you its first administrator and creates a new adult profile for you. It does not claim an existing person's profile.</p>
  <label>Family network name<input name="network" required maxLength={100}/></label>
  <label>Your first name<input name="first" required maxLength={60}/></label>
  <label>Your last name<input name="last" maxLength={60}/></label>
  <label className="check"><input name="confirm" type="checkbox" required/>I am an adult, these are my details, and I accept administrator responsibility for this new network.</label>
  <button className="primary" disabled={busy}>Create my network and become administrator</button>
 </form>;
}
