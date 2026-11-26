import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run = promisify(execFile);
// IBM PC scan codes. Extended keys carry bit 8 for the native helper.
export const KEYS = Object.freeze({
  A:30,B:48,C:46,D:32,E:18,F:33,G:34,H:35,I:23,J:36,K:37,L:38,M:50,N:49,O:24,P:25,Q:16,R:19,S:31,T:20,U:22,V:47,W:17,X:45,Y:21,Z:44,
  '0':11,'1':2,'2':3,'3':4,'4':5,'5':6,'6':7,'7':8,'8':9,'9':10,
  SPACE:57,ENTER:28,TAB:15,ESC:1,BACKSPACE:14,UP:328,DOWN:336,LEFT:331,RIGHT:333,
  HOME:327,END:335,INSERT:338,DELETE:339,PAGEUP:329,PAGEDOWN:337,
  F1:59,F2:60,F3:61,F4:62,F5:63,F6:64,F7:65,F8:66,F9:67,F10:68,F11:87,F12:88
});
export function keyCodes(action) {
  if(typeof action!=='string'||!action.startsWith('key_'))throw Error('Invalid keyboard mapping');
  const parts=action.slice(4).split('_'), key=parts.pop();
  if(!Object.hasOwn(KEYS,key)||parts.length>3||new Set(parts).size!==parts.length||parts.some(p=>!['CTRL','ALT','SHIFT'].includes(p)))throw Error('Choose a supported key and modifiers');
  return [...parts.map(p=>({CTRL:29,ALT:56,SHIFT:42})[p]),KEYS[key]];
}
export class WindowsKeyboard {
  constructor(helper){this.helper=helper;}
  async press(action){
    const codes=keyCodes(action);
    let stdout;
    try{({stdout}=await run(this.helper,codes.map(String),{windowsHide:true,timeout:5000,maxBuffer:4096}));}
    catch(e){if(e.stderr?.trim()==='Focus Star Citizen before pressing a panel button')throw Object.assign(new Error('Focus Star Citizen before pressing a panel button'),{notSent:true});throw e;}
    if(stdout.trim()!=='SENT')throw Error('Keyboard helper did not acknowledge input');
    return {status:'TRIGGER_GAME_ACTION_STATUS_OK'};
  }
}
