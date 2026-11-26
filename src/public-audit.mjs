const placeholders=new Set(['public','default','user','username','your-user','runner','builder','build','example']);
export function privacyIssues(bytes,file){
 const issues=[];
 if(/^(?:validation|recordings|node_modules|vendor|release|tools)\//.test(file)||/(?:^|\/)\.env(?:\.|$)|\.log$|\.metadata\.json$/.test(file))issues.push('private/generated path');
 if(file.startsWith('licenses/'))return issues; // Preserve upstream legal attribution.
 let text=bytes.toString('utf8');
 if(file.endsWith('.hex')){
  const rows=text.trim().split(/\r?\n/);text+='\n'+Buffer.concat(rows.filter(r=>/^:[0-9A-Fa-f]+$/.test(r)&&r.slice(7,9)==='00').map(r=>Buffer.from(r.slice(9,-2),'hex'))).toString('utf8');
 }
 text=text.replaceAll('/build/home/','/build-root/');
 for(const match of text.matchAll(/\b[A-Za-z]:[\\/]Users[\\/]([^\\/\s"'<>;]+)/g))if(!placeholders.has(match[1].toLowerCase())&&!/^[%$]/.test(match[1]))issues.push('personal Windows home path');
 for(const match of text.matchAll(/\/(?:home|Users)\/([^/\s"'<>;]+)\//g))if(!placeholders.has(match[1].toLowerCase())&&!/^[%$]/.test(match[1]))issues.push('personal Unix home path');
 if(/-----BEGIN (?:[A-Z0-9]+ )?PRIVATE KEY-----/.test(text))issues.push('private key material');
 if(/\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b|\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b/.test(text))issues.push('provider credential pattern');
 let emailText=text;
 if(file==='package-lock.json'){try{const lock=JSON.parse(text);for(const p of Object.values(lock.packages??{}))delete p.deprecated;emailText=JSON.stringify(lock);}catch{}}
 for(const match of emailText.matchAll(/\b[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g))if(!/^(?:example\.(?:com|org|net)|users\.noreply\.github\.com)$|\.(?:invalid|test)$/i.test(match[1]))issues.push('email address requiring review');
 return [...new Set(issues)];
}
