import {readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const dir='local/clean-audit/supabase';
if(existsSync(`${dir}/.temp/project-ref`))throw Error('Refusing linked clean-audit workspace');
mkdirSync(`${dir}/migrations`,{recursive:true});
let config=readFileSync('local/phase6/supabase/config.toml','utf8').replaceAll('\r\n','\n');
config=config.replace('familyconnect-phase6-isolated','familyconnect-clean-audit').replaceAll('5532','5632').replaceAll('54329','56329').replaceAll('54327','56327').replaceAll('8083','8183').replaceAll(':5176',':5186');
if(!config.includes('enabled = false\n# Specifies an ordered list of seed files')||!config.includes('sql_paths = []'))throw Error('Automatic seeding must be disabled');
writeFileSync(`${dir}/config.toml`,config);
const manifest=[];
for(const file of readdirSync('local/phase6/supabase/migrations').filter(f=>f.endsWith('.sql'))){const source=`local/phase6/supabase/migrations/${file}`,bytes=readFileSync(source);copyFileSync(source,`${dir}/migrations/${file}`);manifest.push({file,sha256:createHash('sha256').update(bytes).digest('hex')});}
mkdirSync('output/demo-audit',{recursive:true});writeFileSync('output/demo-audit/clean-migrations.json',JSON.stringify(manifest,null,2));
console.log('Prepared separate, seed-disabled clean-audit workspace. Existing databases unchanged.');
