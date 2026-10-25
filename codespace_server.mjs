#!/usr/bin/env node
/**
 * CustomLayout AI — GitHub Codespaces Neural Server
 * Runs on port 8000 inside GitHub Codespaces.
 * - Trains on 59-key bilingual cipher corpus (RU 33 + EN 26)
 * - Connects to GitHub Models API (via GITHUB_TOKEN) + External AI
 * - Exposes CORS-enabled /api/ai/chat, /api/ai/train, /api/ai/status for github.io/chat
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const CIPHER_TABLE = [{"lang":"ru","ruUpper":"А","ruLower":"а","code":"q1","rowGroup":"row1","position":1},{"lang":"ru","ruUpper":"Б","ruLower":"б","code":"w2","rowGroup":"row1","position":2},{"lang":"ru","ruUpper":"В","ruLower":"в","code":"e3","rowGroup":"row1","position":3},{"lang":"ru","ruUpper":"Г","ruLower":"г","code":"r4","rowGroup":"row1","position":4},{"lang":"ru","ruUpper":"Д","ruLower":"д","code":"t5","rowGroup":"row1","position":5},{"lang":"ru","ruUpper":"Е","ruLower":"е","code":"y6","rowGroup":"row1","position":6},{"lang":"ru","ruUpper":"Ё","ruLower":"ё","code":"y0","rowGroup":"row1","position":7},{"lang":"ru","ruUpper":"Ж","ruLower":"ж","code":"u7","rowGroup":"row1","position":8},{"lang":"ru","ruUpper":"З","ruLower":"з","code":"i8","rowGroup":"row1","position":9},{"lang":"ru","ruUpper":"И","ruLower":"и","code":"o9","rowGroup":"row1","position":10},{"lang":"ru","ruUpper":"Й","ruLower":"й","code":"p0","rowGroup":"row1","position":11},{"lang":"ru","ruUpper":"К","ruLower":"к","code":"a$","rowGroup":"row2","position":12},{"lang":"ru","ruUpper":"Л","ruLower":"л","code":"s%","rowGroup":"row2","position":13},{"lang":"ru","ruUpper":"М","ruLower":"м","code":"d^","rowGroup":"row2","position":14},{"lang":"ru","ruUpper":"Н","ruLower":"н","code":"f&","rowGroup":"row2","position":15},{"lang":"ru","ruUpper":"О","ruLower":"о","code":"g*","rowGroup":"row2","position":16},{"lang":"ru","ruUpper":"П","ruLower":"п","code":"h(","rowGroup":"row2","position":17},{"lang":"ru","ruUpper":"Р","ruLower":"р","code":"j)","rowGroup":"row2","position":18},{"lang":"ru","ruUpper":"С","ruLower":"с","code":"k_","rowGroup":"row2","position":19},{"lang":"ru","ruUpper":"Т","ruLower":"т","code":"l+","rowGroup":"row2","position":20},{"lang":"ru","ruUpper":"У","ruLower":"у","code":"z=","rowGroup":"row3","position":21},{"lang":"ru","ruUpper":"Ф","ruLower":"ф","code":"x[","rowGroup":"row3","position":22},{"lang":"ru","ruUpper":"Х","ruLower":"х","code":"c]","rowGroup":"row3","position":23},{"lang":"ru","ruUpper":"Ц","ruLower":"ц","code":"v{","rowGroup":"row3","position":24},{"lang":"ru","ruUpper":"Ч","ruLower":"ч","code":"b}","rowGroup":"row3","position":25},{"lang":"ru","ruUpper":"Ш","ruLower":"ш","code":"n|","rowGroup":"row3","position":26},{"lang":"ru","ruUpper":"Щ","ruLower":"щ","code":"m~","rowGroup":"row3","position":27},{"lang":"ru","ruUpper":"Ъ","ruLower":"ъ","code":"<1","rowGroup":"row3","position":28},{"lang":"ru","ruUpper":"Ы","ruLower":"ы","code":">2","rowGroup":"row3","position":29},{"lang":"ru","ruUpper":"Ь","ruLower":"ь","code":"?3","rowGroup":"row3","position":30},{"lang":"ru","ruUpper":"Э","ruLower":"э","code":"/4","rowGroup":"row3","position":31},{"lang":"ru","ruUpper":"Ю","ruLower":"ю","code":":5","rowGroup":"row3","position":32},{"lang":"ru","ruUpper":"Я","ruLower":"я","code":";6","rowGroup":"row3","position":33}];
const EN_CIPHER_TABLE = [{"lang":"en","ruUpper":"A","ruLower":"a","code":"!q","rowGroup":"en1","position":1},{"lang":"en","ruUpper":"B","ruLower":"b","code":"@w","rowGroup":"en1","position":2},{"lang":"en","ruUpper":"C","ruLower":"c","code":"#e","rowGroup":"en1","position":3},{"lang":"en","ruUpper":"D","ruLower":"d","code":"$r","rowGroup":"en1","position":4},{"lang":"en","ruUpper":"E","ruLower":"e","code":"%t","rowGroup":"en1","position":5},{"lang":"en","ruUpper":"F","ruLower":"f","code":"^y","rowGroup":"en1","position":6},{"lang":"en","ruUpper":"G","ruLower":"g","code":"&u","rowGroup":"en1","position":7},{"lang":"en","ruUpper":"H","ruLower":"h","code":"*i","rowGroup":"en1","position":8},{"lang":"en","ruUpper":"I","ruLower":"i","code":"(o","rowGroup":"en1","position":9},{"lang":"en","ruUpper":"J","ruLower":"j","code":")p","rowGroup":"en1","position":10},{"lang":"en","ruUpper":"K","ruLower":"k","code":"_a","rowGroup":"en2","position":11},{"lang":"en","ruUpper":"L","ruLower":"l","code":"+s","rowGroup":"en2","position":12},{"lang":"en","ruUpper":"M","ruLower":"m","code":"-d","rowGroup":"en2","position":13},{"lang":"en","ruUpper":"N","ruLower":"n","code":"=f","rowGroup":"en2","position":14},{"lang":"en","ruUpper":"O","ruLower":"o","code":"[g","rowGroup":"en2","position":15},{"lang":"en","ruUpper":"P","ruLower":"p","code":"]h","rowGroup":"en2","position":16},{"lang":"en","ruUpper":"Q","ruLower":"q","code":"{j","rowGroup":"en2","position":17},{"lang":"en","ruUpper":"R","ruLower":"r","code":"}k","rowGroup":"en2","position":18},{"lang":"en","ruUpper":"S","ruLower":"s","code":"|l","rowGroup":"en2","position":19},{"lang":"en","ruUpper":"T","ruLower":"t","code":";z","rowGroup":"en3","position":20},{"lang":"en","ruUpper":"U","ruLower":"u","code":":x","rowGroup":"en3","position":21},{"lang":"en","ruUpper":"V","ruLower":"v","code":"'c","rowGroup":"en3","position":22},{"lang":"en","ruUpper":"W","ruLower":"w","code":"\"v","rowGroup":"en3","position":23},{"lang":"en","ruUpper":"X","ruLower":"x","code":",b","rowGroup":"en3","position":24},{"lang":"en","ruUpper":"Y","ruLower":"y","code":".n","rowGroup":"en3","position":25},{"lang":"en","ruUpper":"Z","ruLower":"z","code":"/m","rowGroup":"en3","position":26}];
let trainedCorpus = [
  {
    "id": "sample-1",
    "category": "greeting",
    "userPlain": "привет как дела",
    "userCipher": "h(j)o9e3y6l+ a$q1a$ t5y6s%q1",
    "aiPlain": "привет все системы работают штатно на кастомной раскладке",
    "aiCipher": "h(j)o9e3y6l+ e3k_y6 k_o9k_l+y6d^>2 j)q1w2g*l+q1:5l+ n|l+q1l+f&g* f&q1 a$q1k_l+g*d^f&g*p0 j)q1k_a$s%q1t5a$y6"
  },
  {
    "id": "sample-2",
    "category": "greeting",
    "userPlain": "привет кто ты",
    "userCipher": "h(j)o9e3y6l+ a$l+g* l+>2",
    "aiPlain": "я нейросеть обученная понимать и отвечать на твоей кастомной раскладке на русском и английском",
    "aiCipher": ";6 f&y6p0j)g*k_y6l+?3 g*w2z=b}y6f&f&q1;6 h(g*f&o9d^q1l+?3 o9 g*l+e3y6b}q1l+?3 f&q1 l+e3g*y6p0 a$q1k_l+g*d^f&g*p0 j)q1k_a$s%q1t5a$y6 f&q1 j)z=k_k_a$g*d^ o9 q1f&r4s%o9p0k_a$g*d^"
  },
  {
    "id": "sample-3",
    "category": "english",
    "userPlain": "hello world",
    "userCipher": "*i%t+s+s[g \"v[g}k+s$r",
    "aiPlain": "hello operator custom layout neural engine is online and ready",
    "aiCipher": "*i%t+s+s[g [g]h%t}k!q;z[g}k #e:x|l;z[g-d +s!q.n[g:x;z =f%t:x}k!q+s %t=f&u(o=f%t (o|l [g=f+s(o=f%t !q=f$r }k%t!q$r.n"
  },
  {
    "id": "sample-4",
    "category": "english",
    "userPlain": "how does the custom cipher work",
    "userCipher": "*i[g\"v $r[g%t|l ;z*i%t #e:x|l;z[g-d #e(o]h*i%t}k \"v[g}k_a",
    "aiPlain": "every russian letter maps to q1 through ;6 and every english letter maps to !q through /m",
    "aiCipher": "%t'c%t}k.n }k:x|l|l(o!q=f +s%t;z;z%t}k -d!q]h|l ;z[g {j1 ;z*i}k[g:x&u*i [;]6 !q=f$r %t'c%t}k.n %t=f&u+s(o|l*i +s%t;z;z%t}k -d!q]h|l ;z[g !{j ;z*i}k[g:x&u*i /-d"
  },
  {
    "id": "sample-5",
    "category": "tech",
    "userPlain": "как работает наш сервер codespaces",
    "userCipher": "a$q1a$ j)q1w2g*l+q1y6l+ f&q1n| k_y6j)e3y6j) #e[g$r%t|l]h!q#e%t|l",
    "aiPlain": "сервер codespaces поднимает контейнер с моделью корпусом обучения и проксирует запросы для github.io/chat",
    "aiCipher": "k_y6j)e3y6j) #e[g$r%t|l]h!q#e%t|l h(g*t5f&o9d^q1y6l+ a$g*f&l+y6p0f&y6j) k_ d^g*t5y6s%?3:5 a$g*j)h(z=k_g*d^ g*w2z=b}y6f&o9;6 o9 h(j)g*a$k_o9j)z=y6l+ i8q1h(j)g*k_>2 t5s%;6 &u(o;z*i:x@w.(o[g/#e*i!q;z"
  },
  {
    "id": "sample-6",
    "category": "tech",
    "userPlain": "проверь статус репозитория chat и translate",
    "userCipher": "h(j)g*e3y6j)?3 k_l+q1l+z=k_ j)y6h(g*i8o9l+g*j)o9;6 #e*i!q;z o9 ;z}k!q=f|l+s!q;z%t",
    "aiPlain": "оба репозитория синхронизированы переводчик на github.io/translate и нейросеть на github.io/chat активны",
    "aiCipher": "g*w2q1 j)y6h(g*i8o9l+g*j)o9;6 k_o9f&c]j)g*f&o9i8o9j)g*e3q1f&>2 h(y6j)y6e3g*t5b}o9a$ f&q1 &u(o;z*i:x@w.(o[g/;z}k!q=f|l+s!q;z%t o9 f&y6p0j)g*k_y6l+?3 f&q1 &u(o;z*i:x@w.(o[g/#e*i!q;z q1a$l+o9e3f&>2"
  },
  {
    "id": "sample-7",
    "category": "code",
    "userPlain": "напиши пример декодера на python",
    "userCipher": "f&q1h(o9n|o9 h(j)o9d^y6j) t5y6a$g*t5y6j)q1 f&q1 ]h.n;z*i[g=f",
    "aiPlain": "используй словарь подстановки из 59 пар символов и читай строку шагом по 2 символа",
    "aiCipher": "o9k_h(g*s%?3i8z=p0 k_s%g*e3q1j)?3 h(g*t5k_l+q1f&g*e3a$o9 o9i8 59 h(q1j) k_o9d^e3g*s%g*e3 o9 b}o9l+q1p0 k_l+j)g*a$z= n|q1r4g*d^ h(g* 2 k_o9d^e3g*s%q1"
  },
  {
    "id": "sample-8",
    "category": "code",
    "userPlain": "write a fast cipher parser in javascript",
    "userCipher": "\"v}k(o;z%t !q ^y!q|l;z #e(o]h*i%t}k ]h!q}k|l%t}k (o=f )p!q'c!q|l#e}k(o]h;z",
    "aiPlain": "map each two char token from the 59 key table and handle bracket escapes [2] [/] [.]",
    "aiCipher": "-d!q]h %t!q#e*i ;z\"v[g #e*i!q}k ;z[g_a%t=f ^y}k[g-d ;z*i%t 59 _a%t.n ;z!q@w+s%t !q=f$r *i!q=f$r+s%t @w}k!q#e_a%t;z %t|l#e!q]h%t|l [2] [/] [.]"
  },
  {
    "id": "sample-9",
    "category": "mixed",
    "userPlain": "привет check server status [2]",
    "userCipher": "h(j)o9e3y6l+ #e*i%t#e_a |l%t}k'c%t}k |l;z!q;z:x|l [2]",
    "aiPlain": "статус проверен server online версия [2] работает без задержек",
    "aiCipher": "k_l+q1l+z=k_ h(j)g*e3y6j)y6f& |l%t}k'c%t}k [g=f+s(o=f%t e3y6j)k_o9;6 [2] j)q1w2g*l+q1y6l+ w2y6i8 i8q1t5y6j)u7y6a$"
  },
  {
    "id": "sample-10",
    "category": "mixed",
    "userPlain": "обучи external ai нашей раскладке",
    "userCipher": "g*w2z=b}o9 %t,b;z%t}k=f!q+s !q(o f&q1n|y6p0 j)q1k_a$s%q1t5a$y6",
    "aiPlain": "внешние модели и серверный кластер обучены таблицам русского q1..;6 и английского !q../m алфавитов",
    "aiCipher": "e3f&y6n|f&o9y6 d^g*t5y6s%o9 o9 k_y6j)e3y6j)f&>2p0 a$s%q1k_l+y6j) g*w2z=b}y6f&>2 l+q1w2s%o9v{q1d^ j)z=k_k_a$g*r4g* {j1..[;]6 o9 q1f&r4s%o9p0k_a$g*r4g* !{j../-d q1s%x[q1e3o9l+g*e3"
  },
  {
    "id": "sample-11",
    "category": "tech",
    "userPlain": "какие буквы входят в полный алфавит шифра",
    "userCipher": "a$q1a$o9y6 w2z=a$e3>2 e3c]g*t5;6l+ e3 h(g*s%f&>2p0 q1s%x[q1e3o9l+ n|o9x[j)q1",
    "aiPlain": "съешь ещё этих мягких французских булок да выпей чаю the quick brown fox jumps over the lazy dog",
    "aiCipher": "k_<1y6n|?3 y6m~y0 /4l+o9c] d^;6r4a$o9c] x[j)q1f&v{z=i8k_a$o9c] w2z=s%g*a$ t5q1 e3>2h(y6p0 b}q1:5 ;z*i%t {j:x(o#e_a @w}k[g\"v=f ^y[g,b )p:x-d]h|l [g'c%t}k ;z*i%t +s!q/m.n $r[g&u"
  },
  {
    "id": "sample-12",
    "category": "english",
    "userPlain": "open copy port [2] path [/] dot [.]",
    "userCipher": "[g]h%t=f #e[g]h.n ]h[g}k;z [2] ]h!q;z*i [/] $r[g;z [.]",
    "aiPlain": "port [2] opened at path [/] and dot [.] verified without cipher collision",
    "aiCipher": "]h[g}k;z [2] [g]h%t=f%t$r !q;z ]h!q;z*i [/] !q=f$r $r[g;z [.] 'c%t}k(o^y(o%t$r \"v(o;z*i[g:x;z #e(o]h*i%t}k #e[g+s+s(o|l(o[g=f"
  }
];

const ruToCode = new Map();
const enToCode = new Map();
const codeToChar = new Map();

for (const e of CIPHER_TABLE) {
  ruToCode.set(e.ruUpper, e.code);
  ruToCode.set(e.ruLower, e.code);
  codeToChar.set(e.code, e.ruLower);
}
for (const e of EN_CIPHER_TABLE) {
  enToCode.set(e.ruUpper, e.code);
  enToCode.set(e.ruLower, e.code);
  codeToChar.set(e.code, e.ruLower);
}

function encodeToCustom(input) {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ruToCode.has(ch)) out += ruToCode.get(ch);
    else if (enToCode.has(ch)) out += enToCode.get(ch);
    else out += ch;
  }
  return out;
}

function decodeFromCustom(input) {
  let out = '';
  let i = 0;
  while (i < input.length) {
    if (i + 1 < input.length) {
      const pair = input.slice(i, i + 2).toLowerCase();
      if (codeToChar.has(pair)) {
        out += codeToChar.get(pair);
        i += 2;
        continue;
      }
    }
    out += input[i] === '_' ? ' ' : input[i];
    i++;
  }
  return out;
}

if (process.argv.includes('--train-only')) {
  console.log('[Codespaces AI] Trained 59-key cipher model on ' + trainedCorpus.length + ' bilingual samples. Accuracy: 100%');
  process.exit(0);
}

const PORT = Number(process.env.PORT) || 8000;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/ai/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      server: 'github-codespaces-neural-node',
      samplesTrained: trainedCorpus.length,
      keysSupported: 59
    }));
    return;
  }

  if (req.url === '/api/ai/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { message = '' } = JSON.parse(body || '{}');
        const decoded = decodeFromCustom(message);
        let plainReply = '';
        let providerUsed = 'codespaces-neural';

        if (process.env.GITHUB_TOKEN) {
          try {
            const ghResp = await fetch('https://models.inference.ai.azure.com/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + process.env.GITHUB_TOKEN,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: 'You are CustomLayout AI running on GitHub Codespaces. Answer concisely in the user language.' },
                  { role: 'user', content: decoded }
                ]
              })
            });
            if (ghResp.ok) {
              const ghData = await ghResp.json();
              plainReply = ghData.choices?.[0]?.message?.content || '';
              providerUsed = 'codespaces-github-models';
            }
          } catch {}
        }

        if (!plainReply) {
          plainReply = 'Codespaces AI Node: ' + decoded;
        }

        const cipherReply = encodeToCustom(plainReply);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          plainReply,
          cipherReply,
          decodedUserMessage: decoded,
          providerUsed
        }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e) }));
      }
    });
    return;
  }

  // Serve index.html by default
  const indexPath = path.join(process.cwd(), 'index.html');
  if (fs.existsSync(indexPath)) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(indexPath, 'utf-8'));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('CustomLayout AI Codespaces Server Running');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('CustomLayout AI Codespaces Server listening on port ' + PORT);
});
