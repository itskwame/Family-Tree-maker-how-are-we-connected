-- Metadata only. Run through the Management API /database/query/read-only endpoint.
-- Dashboard alternative: BEGIN READ ONLY; run this SELECT; ROLLBACK.
-- Definitions may contain application secrets in poorly designed functions: keep output private.
WITH target_schemas AS (
  SELECT oid, nspname FROM pg_catalog.pg_namespace
  WHERE nspname NOT IN ('pg_catalog','information_schema')
    AND nspname NOT LIKE 'pg_toast%' AND nspname NOT LIKE 'pg_temp%'
), relations AS (
  SELECT c.*, n.nspname FROM pg_catalog.pg_class c JOIN target_schemas n ON n.oid=c.relnamespace
)
SELECT pg_catalog.jsonb_build_object(
 'inspection', pg_catalog.jsonb_build_object('role',current_user,'read_only',current_setting('transaction_read_only'),'version',version(),'captured_at',current_timestamp),
 'schemas', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT n.nspname,pg_catalog.pg_get_userbyid(p.nspowner) owner,p.nspacl::text acl FROM target_schemas n JOIN pg_catalog.pg_namespace p ON p.oid=n.oid) x),
 'tables', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT nspname schema,relname name,relkind kind,pg_catalog.pg_get_userbyid(relowner) owner,relrowsecurity rls_enabled,relforcerowsecurity rls_forced,relacl::text acl FROM relations WHERE relkind IN ('r','p','v','m','f')) x),
 'columns', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT c.nspname schema,c.relname table_name,a.attnum ordinal,a.attname name,pg_catalog.format_type(a.atttypid,a.atttypmod) type,a.attnotnull not_null,a.attidentity identity,a.attgenerated generated,a.attacl::text acl,pg_catalog.pg_get_expr(d.adbin,d.adrelid) default_expression FROM relations c JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE c.relkind IN ('r','p','v','m','f') AND a.attnum>0 AND NOT a.attisdropped) x),
 'constraints', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT n.nspname schema,c.relname table_name,k.conname name,k.contype type,k.convalidated validated,k.condeferrable deferrable,k.condeferred deferred,pg_catalog.pg_get_constraintdef(k.oid,true) definition FROM pg_catalog.pg_constraint k JOIN target_schemas n ON n.oid=k.connamespace LEFT JOIN pg_catalog.pg_class c ON c.oid=k.conrelid) x),
 'foreign_keys', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT c.nspname schema,c.relname table_name,k.conname name,rn.nspname referenced_schema,r.relname referenced_table,k.conkey source_column_numbers,k.confkey target_column_numbers,pg_catalog.pg_get_constraintdef(k.oid,true) definition FROM pg_catalog.pg_constraint k JOIN relations c ON c.oid=k.conrelid JOIN pg_catalog.pg_class r ON r.oid=k.confrelid JOIN pg_catalog.pg_namespace rn ON rn.oid=r.relnamespace WHERE k.contype='f') x),
 'indexes', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT c.nspname schema,c.relname table_name,i.indisunique unique_index,i.indisprimary primary_index,i.indisvalid valid,i.indisready ready,pg_catalog.pg_get_indexdef(i.indexrelid) definition FROM pg_catalog.pg_index i JOIN relations c ON c.oid=i.indrelid) x),
 'policies', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT * FROM pg_catalog.pg_policies WHERE schemaname IN (SELECT nspname FROM target_schemas)) x),
 'triggers', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT c.nspname schema,c.relname table_name,t.tgname name,t.tgenabled enabled,t.tgisinternal internal,pg_catalog.pg_get_triggerdef(t.oid,true) definition FROM pg_catalog.pg_trigger t JOIN relations c ON c.oid=t.tgrelid) x),
 'functions', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT n.nspname schema,p.proname name,pg_catalog.pg_get_function_identity_arguments(p.oid) arguments,pg_catalog.pg_get_userbyid(p.proowner) owner,p.prosecdef security_definer,p.proconfig configuration,p.proacl::text acl,pg_catalog.pg_get_functiondef(p.oid) definition FROM pg_catalog.pg_proc p JOIN target_schemas n ON n.oid=p.pronamespace WHERE p.prokind IN ('f','p')) x),
 'views', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT nspname schema,relname name,reloptions options,pg_catalog.pg_get_viewdef(oid,true) definition FROM relations WHERE relkind IN ('v','m')) x),
 'roles', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls FROM pg_catalog.pg_roles) x),
 'role_memberships', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT pg_catalog.pg_get_userbyid(roleid) granted_role,pg_catalog.pg_get_userbyid(member) member,admin_option FROM pg_catalog.pg_auth_members) x),
 'default_grants', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT pg_catalog.pg_get_userbyid(d.defaclrole) owner,n.nspname schema,d.defaclobjtype object_type,d.defaclacl::text acl FROM pg_catalog.pg_default_acl d LEFT JOIN pg_catalog.pg_namespace n ON n.oid=d.defaclnamespace) x),
 'table_grants_visible_to_inspector', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT * FROM information_schema.table_privileges WHERE table_schema IN (SELECT nspname FROM target_schemas)) x),
 'sequence_grants', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT nspname schema,relname name,relacl::text acl FROM relations WHERE relkind='S') x),
 'database_grants', (SELECT pg_catalog.jsonb_agg(pg_catalog.to_jsonb(x)) FROM (SELECT datname,datacl::text acl FROM pg_catalog.pg_database WHERE datname=current_database()) x)
) AS schema_audit;
