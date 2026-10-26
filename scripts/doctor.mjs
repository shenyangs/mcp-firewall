import { supportsNode, nodeRequirement } from './runtime.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
export async function diagnose(root = fileURLToPath(new URL('../', import.meta.url)), ports = true) {
 const results=[];
 const add=(ok,message)=>results.push({ok,message});
 add(supportsNode(process.versions.node),`当前 Node.js ${process.versions.node}；要求 ${nodeRequirement}`);
 const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'));
 const missing=Object.keys({...pkg.dependencies,...pkg.devDependencies}).filter(name=>!existsSync(join(root,'node_modules',name,'package.json')));
 add(!missing.length,missing.length?`缺少依赖：${missing.join('、')}。请运行 npm ci --cache .npm-cache 或 npm run setup。`:'项目依赖齐全');
 if(!missing.length){
  const cache=resolve(root,process.env.PLAYWRIGHT_BROWSERS_PATH||'.playwright-browsers');
  const manifest=JSON.parse(readFileSync(join(root,'node_modules/playwright-core/browsers.json'),'utf8'));
  const platform=process.platform==='win32'?'win':process.platform==='darwin'?'mac':'linux';
  const arch=process.arch==='arm64'?'arm64':'x64';
  const shell=manifest.browsers.find(b=>b.name==='chromium-headless-shell');
  const revision=shell.revisionOverrides?.[`${platform==='mac'?'mac':platform}${platform==='mac'&&arch==='arm64'?'-arm64':''}`]||shell.revision;
  const folder=platform==='win'?'chrome-headless-shell-win64':platform==='linux'?'chrome-headless-shell-linux64':`chrome-headless-shell-${platform}-${arch}`;
  const browser=process.env.PLAYWRIGHT_EXECUTABLE_PATH||join(cache,`chromium_headless_shell-${revision}`,folder,platform==='win'?'chrome-headless-shell.exe':'chrome-headless-shell');
  add(existsSync(browser),existsSync(browser)?'Chromium 可执行文件存在（实际启动由 E2E 验证）':'缺少 Chromium。请运行 npm run browsers:install，或设置 PLAYWRIGHT_EXECUTABLE_PATH 复用已有浏览器。');
  const ff=manifest.browsers.find(b=>b.name==='ffmpeg');
  const binary=platform==='mac'?'ffmpeg-mac':platform==='win'?'ffmpeg-win64.exe':'ffmpeg-linux';
  const ffpath=join(cache,`ffmpeg-${ff.revision}`,binary);
  add(existsSync(ffpath),existsSync(ffpath)?'录像组件 FFmpeg 已就绪':'缺少录像组件 FFmpeg。请运行 npm run browsers:install。');
 }
 if(ports)for(const port of [4205,5205])await new Promise(done=>{const s=createServer();s.once('error',()=>{add(false,`端口 ${port} 被占用或不可绑定；请停止占用进程后重试，不会自动结束其他程序。`);done();});s.listen(port,'127.0.0.1',()=>s.close(()=>{add(true,`端口 ${port} 可用（127.0.0.1）`);done();}));});
 return results;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const results=await diagnose();for(const r of results)console.log(`${r.ok?'通过':'待处理'}：${r.message}`);console.log('无需 API Key。启动：npm run dev；访问：http://127.0.0.1:4205');process.exitCode=results.every(r=>r.ok)?0:1;}catch{console.error('检查失败：请确认当前项目文件完整，然后运行 npm ci --cache .npm-cache。');process.exitCode=1;}
}
