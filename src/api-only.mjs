export const isApiAction=value=>typeof value==='string'&&/^[a-zA-Z0-9_]{1,80}$/.test(value)&&!/^key_/i.test(value);
export function assertApiAction(value){if(!isApiAction(value))throw Error('Use a game API action name. Keyboard emulation mappings are not supported.');}
export function apiOnlyConfig(original){
 const config=structuredClone(original),disabled=new Set();config.buttons??={};config.switches??={};
 for(const [alias,action]of Object.entries(config.buttons))if(!isApiAction(action)){delete config.buttons[alias];disabled.add(alias);}
 for(const [alias,rule]of Object.entries(config.switches))if(!isApiAction(rule.onAction)||!isApiAction(rule.offAction)||disabled.has(alias)){delete config.switches[alias];delete config.buttons[alias];disabled.add(alias);}
 for(const [name,alias]of Object.entries(config.legacyInputs??{}))if(disabled.has(alias))delete config.legacyInputs[name];
 return {config,disabled:[...disabled]};
}
