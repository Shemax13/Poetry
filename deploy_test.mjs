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
  main_module: 'test_deploy.mjs',
  bindings: [],
});

const boundary = '----FormBoundary' + Date.now();
function encode(s) { return new TextEncoder().encode(s); }

const parts = [];
const totalScriptBytes = [];

function addPart(name, filename, contentType, data) {
  parts.push('--' + boundary);
  parts.push('Content-Disposition: form-data; name="' + name + '"' + (filename ? '; filename="' + filename + '"' : ''));
  parts.push('Content-Type: ' + contentType);
  parts.push('');
  parts.push(data);
}

addPart('metadata', null, 'application/json', metadata);
addPart('test_deploy.mjs', 'test_deploy.mjs', 'application/javascript+module', code);

const body = parts.join('\r\n') + '\r\n--' + boundary + '--\r\n';

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
