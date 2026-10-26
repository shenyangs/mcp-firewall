import { supportsNode, nodeRequirement } from './runtime.mjs';
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const browsersOnly=process.argv.includes('--browsers-only');
if(!supportsNode(process.versions.node)){console.error(`需要 ${nodeRequirement}，请先自行安装后重试。`);process.exit(1);}
mkdirSync(join(root,'.tmp'),{recursive:true});
const env={...process.env,npm_config_cache:join(root,'.npm-cache'),TMPDIR:join(root,'.tmp'),TMP:join(root,'.tmp'),TEMP:join(root,'.tmp'),PLAYWRIGHT_BROWSERS_PATH:join(root,'.playwright-browsers')};
function run(command,args){const r=spawnSync(command,args,{cwd:root,env,stdio:'inherit',shell:process.platform==='win32'&&command.endsWith('.cmd')});if(r.error||r.status!==0){console.error('安装未完成：请检查网络或文件权限后重试。已有浏览器可通过环境变量复用，详见 README。');process.exit(r.status||1);}}
if(!browsersOnly){console.log('正在按锁文件安装项目依赖（缓存仅在本项目内）…');run(process.platform==='win32'?'npm.cmd':'npm',['ci','--cache','.npm-cache']);}
console.log('正在安装项目内 Chromium 无头浏览器和录像组件，不安装系统软件…');
run(process.execPath,[join(root,'node_modules/playwright/cli.js'),'install','chromium','--only-shell']);
console.log('安装完成。运行 npm run doctor 检查，再运行 npm run dev。访问：http://127.0.0.1:4205');
