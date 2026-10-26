import {test,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
// The diagnostic function is dependency-free and can run before npm ci.
import {diagnose} from '../scripts/doctor.mjs';
test('缺依赖时给出中文修复命令，不崩溃、不要求 Key',async()=>{
 mkdirSync('.tmp',{recursive:true});const root=mkdtempSync(resolve('.tmp/doctor-'));
 try{writeFileSync(join(root,'package.json'),JSON.stringify({dependencies:{react:'19.3.1'}}));const result=await diagnose(root,false);expect(result.some((r:{ok:boolean;message:string})=>!r.ok&&r.message.includes('缺少依赖：react')&&r.message.includes('npm ci'))).toBe(true);}finally{rmSync(root,{recursive:true,force:true});}
});
