import fs from 'node:fs';
import {catalog} from '../src/catalog.mjs';
import {loadSchema} from '../src/game.mjs';
const [descriptor,output]=process.argv.slice(2);if(!descriptor||!output)throw Error('Usage: node scripts/catalog-schema.mjs <descriptor> <output.json>');
const fields=catalog(loadSchema(descriptor));fs.writeFileSync(output,JSON.stringify(fields,null,2)+'\n');console.log(`Wrote ${fields.length} catalog entries.`);
