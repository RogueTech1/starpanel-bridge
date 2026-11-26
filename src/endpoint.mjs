export function localEndpoint(port=2942){
 if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Use a local API port from 1024 through 65535');
 return `127.0.0.1:${port}`;
}
