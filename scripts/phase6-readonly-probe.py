"""Probe the documented read-only API using the existing Supabase CLI credential.
Never prints or persists credentials; never invokes the general SQL endpoint.
"""
import ctypes
from ctypes import wintypes as w
import json
import os
import urllib.request
import urllib.error
import sys
from pathlib import Path

class Credential(ctypes.Structure):
    _fields_ = [('Flags',w.DWORD),('Type',w.DWORD),('TargetName',w.LPWSTR),
                ('Comment',w.LPWSTR),('LastWritten',w.FILETIME),
                ('CredentialBlobSize',w.DWORD),('CredentialBlob',ctypes.POINTER(ctypes.c_ubyte)),
                ('Persist',w.DWORD),('AttributeCount',w.DWORD),('Attributes',ctypes.c_void_p),
                ('TargetAlias',w.LPWSTR),('UserName',w.LPWSTR)]

def token():
    if os.environ.get('SUPABASE_ACCESS_TOKEN'):
        return os.environ['SUPABASE_ACCESS_TOKEN']
    api = ctypes.WinDLL('Advapi32.dll')
    api.CredReadW.argtypes = [w.LPCWSTR,w.DWORD,w.DWORD,ctypes.POINTER(ctypes.POINTER(Credential))]
    for name in ['Supabase CLI:supabase','Supabase CLI:access-token']:
        pointer = ctypes.POINTER(Credential)()
        if api.CredReadW(name,1,0,ctypes.byref(pointer)):
            try:
                return ctypes.string_at(pointer.contents.CredentialBlob,pointer.contents.CredentialBlobSize).decode('utf-8')
            finally:
                api.CredFree(pointer)
    raise SystemExit('Existing CLI credential unavailable. No credential was changed.')

if '--counts' in sys.argv:
    authorization='Bearer '+token()
    counts={}
    for relation in ['public.families','public.family_memberships','public.invites','auth.users','auth.identities','storage.buckets','storage.objects']:
        # Fixed allowlist; no row values leave the database. Disable silent RLS filtering.
        query="SET LOCAL row_security = off; SELECT count(*) AS record_count FROM "+relation
        request=urllib.request.Request('https://api.supabase.com/v1/projects/jmsntxwkaneluqgnzzim/database/query/read-only',data=json.dumps({'query':query}).encode(),headers={'Authorization':authorization,'Content-Type':'application/json'},method='POST')
        try:
            with urllib.request.urlopen(request,timeout=45) as response:
                counts[relation]={'status':response.status,'result':json.load(response)}
        except urllib.error.HTTPError as error:
            counts[relation]={'status':error.code,'result':'Count unavailable; no permissions changed'}
        except urllib.error.URLError:
            counts[relation]={'result':'Network unavailable'}
    destination=Path('output/phase6/private/hosted-record-counts.json')
    destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_text(json.dumps(counts,indent=2),encoding='utf-8')
    print(json.dumps(counts))
    raise SystemExit(0)

if '--config' in sys.argv:
    collected = {}
    authorization = 'Bearer '+token()
    for label,path in [('auth','config/auth'),('storage','config/storage'),('buckets','storage/buckets'),('migrations','database/migrations')]:
        request=urllib.request.Request('https://api.supabase.com/v1/projects/jmsntxwkaneluqgnzzim/'+path,headers={'Authorization':authorization},method='GET')
        try:
            with urllib.request.urlopen(request,timeout=45) as response:
                body=json.load(response)
            if label=='auth':
                allowed={'site_url','uri_allow_list','disable_signup','mailer_autoconfirm','mailer_secure_email_change_enabled','password_min_length','password_required_characters','security_captcha_enabled','security_refresh_token_rotation_enabled','security_manual_linking_enabled','sms_autoconfirm','jwt_exp','sessions_timebox','sessions_inactivity_timeout'}
                body={k:v for k,v in body.items() if k in allowed or (k.startswith('external_') and k.endswith('_enabled')) or (k.startswith('mfa_') and k.endswith('_enabled'))}
            elif label=='buckets':
                body=[{k:v for k,v in b.items() if k in {'name','public','file_size_limit','allowed_mime_types'}} for b in body]
            collected[label]={'status':200,'configuration':body}
        except urllib.error.HTTPError as error:
            collected[label]={'status':error.code,'message':'Read-only configuration request rejected'}
        except urllib.error.URLError:
            collected[label]={'message':'Network connection failed'}
    destination=Path('output/phase6/private/hosted-service-config.json')
    destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_text(json.dumps(collected,indent=2),encoding='utf-8')
    print(json.dumps(collected))
    raise SystemExit(0)

query = "SELECT current_user AS inspection_role, current_setting('transaction_read_only') AS transaction_read_only, (SELECT count(*) FROM pg_catalog.pg_class) AS visible_catalog_relations, (SELECT count(*) FROM information_schema.tables) AS visible_information_schema_tables"
if '--schema' in sys.argv:
    query = Path(__file__).with_name('phase6-schema-inspection.sql').read_text(encoding='utf-8')
request = urllib.request.Request(
    'https://api.supabase.com/v1/projects/jmsntxwkaneluqgnzzim/database/query/read-only',
    data=json.dumps({'query':query}).encode(),
    headers={'Authorization':'Bearer '+token(),'Content-Type':'application/json'},method='POST')
try:
    with urllib.request.urlopen(request,timeout=45) as response:
        result = json.load(response)
        if '--schema' in sys.argv:
            destination=Path('output/phase6/private/hosted-schema-audit.json')
            destination.parent.mkdir(parents=True,exist_ok=True)
            destination.write_text(json.dumps(result,indent=2),encoding='utf-8')
            audit=result[0]['schema_audit']
            print(json.dumps({'status':response.status,'saved':str(destination),'counts':{k:len(v) for k,v in audit.items() if isinstance(v,list)}}))
        else:
            print(json.dumps({'status':response.status,'probe':result}))
except urllib.error.HTTPError as error:
    # Probe contains no secrets or personal records; whitelist only diagnostic fields.
    try:
        body=json.loads(error.read())
        print(json.dumps({'status':error.code,'message':body.get('message',body.get('error','Request rejected'))}))
    except Exception:
        print(json.dumps({'status':error.code,'message':'Request rejected'}))
except urllib.error.URLError:
    raise SystemExit('Read-only API network connection failed.')
