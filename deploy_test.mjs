import { readFileSync } from 'fs';

const ACCOUNT_ID = '02a5ee785952a4e4b7b6da209e10c53d';
const SCRIPT_NAME = 'routetest';
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;

if (!TOKEN) {
  console.error('FATAL: CLOUDFLARE_API_TOKEN or CF_API_TOKEN env var required');
  process.exit(1);
}

const code = readFileSync('test_deploy.mjs', 'utf8');
const metadata = JSON.stringify({
  body_part: 'test_deploy.mjs',
  compatibility_date: '2026-06-17',
  compatibility_flags: ['nodejs_compat'],
  bindings: [],
});

const boundary = '----FormBoundary' + Date.now();
function encode(s) { return new TextEncoder().encode(s); }

const totalScriptBytes = [];

function addPart(name, filename, contentType, data) {
  const header = encode('--' + boundary + '\r\n');
  totalScriptBytes.push(header);
  const disp = encode('Content-Disposition: form-data; name="' + name + '"' + (filename ? '; filename="' + filename + '"' : '') + '\r\n');
  totalScriptBytes.push(disp);
  totalScriptBytes.push(encode('Content-Type: ' + contentType + '\r\n\r\n'));
  totalScriptBytes.push(encode(data));
  totalScriptBytes.push(encode('\r\n'));
}

addPart('metadata', null, 'application/json', metadata);
addPart('test_deploy.mjs', 'test_deploy.mjs', 'application/javascript', code);

totalScriptBytes.push(encode('--' + boundary + '--\r\n'));

const totalLength = totalScriptBytes.reduce((s, p) => s + p.byteLength, 0);
const body = new Uint8Array(totalLength);
let offset = 0;
for (const p of totalScriptBytes) {
  body.set(p, offset);
  offset += p.byteLength;
}

const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${SCRIPT_NAME}`;
const resp = await fetch(url, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + TOKEN,
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
  },
  body: body,
});

const result = await resp.json();
if (!result.success) {
  console.error('Upload failed:', JSON.stringify(result.errors));
  process.exit(1);
}
console.log('Deployed! Tag:', result.result.tag, 'Deployment:', result.result.deployment_id);
