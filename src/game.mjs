import fs from 'node:fs';
import grpc from '@grpc/grpc-js';
import protobuf from 'protobufjs';
import 'protobufjs/ext/descriptor.js';

export const SERVICE = 'sc.game.telemetry.v1.GameTelemetryService';
export function loadSchema(path) {
  return protobuf.Root.fromDescriptor(fs.readFileSync(path));
}
export function codec(root, name) {
  const type = root.lookupType(`sc.game.telemetry.v1.${name}`);
  const booleanDefaults=(value,message)=>{
    if(!value||typeof value!=='object')return value;
    for(const field of message.fieldsArray){
      // Proto3 non-optional booleans omit false on the wire. The parent
      // message's presence is essential: never create an absent subsystem.
      if(field.type==='bool'&&!field.partOf&&!field.repeated&&!field.map&&!Object.hasOwn(value,field.name))value[field.name]=false;
      if(field.resolvedType instanceof protobuf.Type&&Object.hasOwn(value,field.name)){
        if(field.repeated)for(const item of value[field.name])booleanDefaults(item,field.resolvedType);
        else if(!field.map)booleanDefaults(value[field.name],field.resolvedType);
      }
    }return value;
  };
  return {
    serialize: value => Buffer.from(type.encode(type.fromObject(value)).finish()),
    // Do not synthesize default zeroes for omitted fields.
    deserialize: bytes => booleanDefaults(type.toObject(type.decode(bytes), {enums: String, longs: String}),type)
  };
}
export class Game {
  constructor(root, address = '127.0.0.1:2942') {
    this.root = root;
    this.address = address;
    this.client = new grpc.Client(address, grpc.credentials.createInsecure(), {
      'grpc.max_reconnect_backoff_ms': 3000
    });
  }
  supports(method) {return Boolean(this.root.lookupService(SERVICE).methods[method]);}
  call(method, value = {}) {
    if(!this.supports(method))return Promise.reject(Object.assign(new Error(`${method} is not supported by this game schema`),{code:grpc.status.UNIMPLEMENTED}));
    const req = codec(this.root, `${method}Request`);
    const res = codec(this.root, `${method}Response`);
    return new Promise((resolve, reject) => this.client.makeUnaryRequest(
      `/${SERVICE}/${method}`, req.serialize, res.deserialize, value,
      {deadline: Date.now() + 1500}, (err, result) => err ? reject(err) : resolve(result)));
  }
  stream(onFrame, onEnd) {
    const req = codec(this.root, 'TelemetryStreamRequest');
    const res = codec(this.root, 'TelemetryStreamResponse');
    const stream = this.client.makeServerStreamRequest(`/${SERVICE}/TelemetryStream`, req.serialize, res.deserialize, {});
    let ended = false;
    const finish = err => { if (!ended) { ended = true; onEnd(err); } };
    stream.on('data', onFrame);
    stream.on('error', finish);
    stream.on('end', () => finish(new Error('Telemetry stream ended')));
    return () => { ended = true; stream.cancel(); };
  }
  close() { this.client.close(); }
}
