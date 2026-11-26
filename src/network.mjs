import net from 'node:net';
import {timingSafeEqual} from 'node:crypto';
import {Lines} from './panel.mjs';

export class NetworkPanels {
  constructor(bridge, {token, port = 2943, host = '0.0.0.0'}) {
    Object.assign(this, {bridge, token, port, host}); this.clients = new Set(); this.listening = false;
    this.publish = packet => {
      for (const c of this.clients) if (c.authenticated) this.send(c, {...packet,
        values: Object.fromEntries(Object.entries(packet.values).filter(([key]) => c.fields.includes(key)))});
    };
  }
  async start() {
    if (typeof this.token !== 'string' || this.token.length < 32) throw Error('Network token must be at least 32 characters');
    this.server = net.createServer(socket => this.accept(socket));
    this.server.on('error', err => {this.listening = false; this.bridge.log(`IP panels: ${err.message}`);});
    await new Promise((resolve, reject) => {
      const fail = err => reject(err); this.server.once('error', fail);
      this.server.listen(this.port, this.host, () => {this.server.removeListener('error', fail); this.listening = true; resolve();});
    });
    this.port = this.server.address().port;
    this.bridge.on('telemetry', this.publish);
    this.bridge.log(`IP panels enabled on TCP port ${this.port}`);
  }
  accept(socket) {
    if (this.clients.size >= 8) return socket.destroy();
    socket.setNoDelay(true); socket.setKeepAlive(true, 5000);
    const c = {socket, authenticated: false, name: 'IP panel', fields: [], count: 0, window: Date.now()};
    this.clients.add(c);
    c.timeout = setTimeout(() => socket.destroy(), 5000);
    socket.on('error', () => {});
    socket.on('close', () => {clearTimeout(c.timeout); this.clients.delete(c);});
    const lines = new Lines(line => {
      if (Date.now() - c.window > 1000) {c.count = 0; c.window = Date.now();}
      if (++c.count > 20) return socket.destroy();
      let cmd;
      try {cmd = JSON.parse(line);} catch {return socket.destroy();}
      if (!cmd || typeof cmd !== 'object' || Array.isArray(cmd)) return socket.destroy();
      if (!c.authenticated) {
        if (cmd.v !== 1 || cmd.type !== 'subscribe' || typeof cmd.token !== 'string' || cmd.token.length !== this.token.length || Buffer.byteLength(cmd.token) !== Buffer.byteLength(this.token) ||
          !timingSafeEqual(Buffer.from(cmd.token), Buffer.from(this.token))) return socket.destroy();
        c.authenticated = true; clearTimeout(c.timeout);
      }
      if (cmd.v === 1 && cmd.type === 'subscribe') {
        if (!Array.isArray(cmd.fields) || cmd.fields.length > 32) return socket.destroy();
        c.fields = cmd.fields.filter(key => typeof key === 'string' && Object.hasOwn(this.bridge.panel.config.fields, key));
        c.name = typeof cmd.name === 'string' ? cmd.name.slice(0, 48) : 'IP panel';
        this.send(c, {v: 1, type: 'subscribed', fields: c.fields});
      } else void this.bridge.panel.command(cmd).then(ack => this.send(c, ack));
    });
    socket.on('data', data => lines.feed(data));
  }
  send(c, packet) {
    if (c.socket.destroyed) return;
    // Disconnect a slow reader rather than retaining an unbounded stream of old data.
    if (c.socket.writableLength > 16384) return c.socket.destroy();
    c.socket.write(JSON.stringify(packet) + '\n');
  }
  status() {
    return {listening: this.listening, port: this.port,
      clients: [...this.clients].filter(c => c.authenticated).map(c => ({name: c.name, address: c.socket.remoteAddress, fields: c.fields}))};
  }
  stop() {
    this.listening = false; this.bridge.off('telemetry', this.publish);
    for (const c of this.clients) {clearTimeout(c.timeout); c.socket.destroy();}
    this.clients.clear(); this.server?.close();
  }
}
