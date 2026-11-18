begin read only;
set local search_path = pg_catalog;
select jsonb_build_object(
 'version',current_setting('server_version'),
 'schemas',(select jsonb_agg(jsonb_build_object('name',nspname,'owner',pg_get_userbyid(nspowner),'acl',coalesce(nspacl,acldefault('n',nspowner))::text) order by nspname) from pg_namespace where nspname not like 'pg_%' and nspname<>'information_schema'),
 'constraints',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'name',k.conname,'definition',pg_get_constraintdef(k.oid)) order by n.nspname,c.relname,k.conname) from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname not like 'pg_%'),
 'indexes',(select jsonb_agg(to_jsonb(i) order by schemaname,tablename,indexname) from pg_indexes i where schemaname not like 'pg_%'),
 'triggers',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'name',t.tgname,'enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid)) order by n.nspname,c.relname,t.tgname) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname not like 'pg_%'),
 'sequences',(select jsonb_agg(to_jsonb(s) order by schemaname,sequencename) from pg_sequences s where schemaname not like 'pg_%'),
 'memberships',(select jsonb_agg(jsonb_build_object('role',pg_get_userbyid(roleid),'member',pg_get_userbyid(member),'grantor',pg_get_userbyid(grantor),'admin',admin_option,'inherit',inherit_option,'set',set_option) order by roleid,member,grantor) from pg_auth_members),
 'tables',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'owner',pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'acl',coalesce(c.relacl,acldefault('r',c.relowner))::text) order by n.nspname,c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind in('r','p') and n.nspname not in ('pg_catalog','information_schema') and n.nspname not like 'pg_toast%'),
 'columns',(select jsonb_agg(jsonb_build_object('schema',table_schema,'table',table_name,'column',column_name,'ordinal',ordinal_position,'type',data_type,'nullable',is_nullable,'default',column_default) order by table_schema,table_name,ordinal_position) from information_schema.columns where table_schema not in('pg_catalog','information_schema')),
 'policies',(select jsonb_agg(to_jsonb(p) order by schemaname,tablename,policyname) from pg_policies p),
 'functions',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'args',pg_get_function_identity_arguments(p.oid),'definition',pg_get_functiondef(p.oid),'owner',pg_get_userbyid(p.proowner),'acl',coalesce(p.proacl,acldefault('f',p.proowner))::text) order by n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('public','auth','storage','vault') and p.prokind<>'a'),
 'roles',(select jsonb_agg(to_jsonb(r) order by rolname) from pg_roles r),
 'default_grants',(select jsonb_agg(jsonb_build_object('owner',pg_get_userbyid(d.defaclrole),'schema',n.nspname,'kind',d.defaclobjtype,'acl',d.defaclacl::text) order by n.nspname,d.defaclobjtype) from pg_default_acl d left join pg_namespace n on n.oid=d.defaclnamespace),
 'extensions',(select jsonb_agg(jsonb_build_object('name',extname,'version',extversion) order by extname) from pg_extension),
 'publication_tables',(select jsonb_agg(to_jsonb(p) order by pubname,schemaname,tablename) from pg_publication_tables p),
 'auth_users',(select count(*) from auth.users),
 'auth_identities',(select count(*) from auth.identities),
 'auth_fingerprint',(select md5(coalesce((select jsonb_agg(to_jsonb(u) order by id)::text from auth.users u),'')||coalesce((select jsonb_agg(to_jsonb(i) order by id)::text from auth.identities i),''))),
 'storage_buckets',(select jsonb_agg(to_jsonb(b) order by id) from storage.buckets b),
 'storage_object_count',(select count(*) from storage.objects)
);
commit;
