const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 4310);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const SPECTRA = [
  'vedomostne',
  'nazorove',
  'sebareflexivne',
  'vztahove',
  'mentalne',
  'emocne',
  'aktualne'
];

const QUESTIONS = {
  vedomostne: [
    'Dnes mám chuť spochybňovať vlastné názory.',
    'Nové informácie ma skôr zaujímajú než vyčerpávajú.',
    'Viem rozlíšiť fakt od dojmu.',
    'Keď niečomu nerozumiem, aktívne to dohľadám.',
    'Diskusiu beriem ako príležitosť zlepšiť pohľad.'
  ],
  nazorove: [
    'Dnes viem pokojne počuť opačný názor.',
    'Mám potrebu všetko rýchlo hodnotiť.',
    'Viem povedať "neviem" bez stresu.',
    'Moje postoje sú dnes pružné.',
    'Neberiem nesúhlas osobne.'
  ],
  sebareflexivne: [
    'Dnes viem pomenovať, čo cítim.',
    'Všimol(a) som si svoje obranné reakcie.',
    'Neutekám od nepríjemných tém o sebe.',
    'Viem uznať vlastnú chybu bez sebazhadzovania.',
    'Moje správanie je dnes v súlade s mojimi hodnotami.'
  ],
  vztahove: [
    'Dnes mám chuť byť dostupný(á) pre blízkych.',
    'Reagujem skôr trpezlivo než impulzívne.',
    'Viem povedať, čo potrebujem, bez útoku.',
    'Vážim si hranice iných ľudí.',
    'V komunikácii dnes hľadám porozumenie.'
  ],
  mentalne: [
    'Mám dnes mentálnu kapacitu na dôležité rozhodnutia.',
    'Myslenie je skôr jasné než rozbité do chaosu.',
    'Stres mi neberie schopnosť sústrediť sa.',
    'Viem si počas dňa vedome spomaliť.',
    'Moja myseľ je dnes viac stabilná než preťažená.'
  ],
  emocne: [
    'Dokážem si všimnúť zmenu nálady bez paniky.',
    'Nepríjemné emócie ma dnes neovládajú.',
    'Mám priestor na regeneráciu.',
    'Som dnes skôr vyrovnaný(á) ako rozladený(á).',
    'Viem bezpečne ventilovať napätie.'
  ],
  aktualne: [
    'Dnešné dianie ma nezahlcuje.',
    'Dokážem obmedziť doomscrolling.',
    'Mám zdravý odstup od informačného hluku.',
    'Reagujem na novinky bez extrémov.',
    'Viem si vybrať, čomu dnes venujem pozornosť.'
  ]
};

const STATUS_BANDS = [
  { max: 1.75, code: 'tmavy', label: 'Stiahnutý režim', color: '#5B2333', text: 'Dnes si skôr v obrane. Skús menej podnetov a viac stabilizácie.' },
  { max: 2.75, code: 'oranzovy', label: 'Opatrný režim', color: '#B86B00', text: 'Si funkčný(á), ale citlivý(á) na tlak. Pomôže jasná priorita.' },
  { max: 3.5, code: 'zeleny', label: 'Otvorený režim', color: '#1E7A42', text: 'Dnes zvládaš sociálne situácie stabilne a s nadhľadom.' },
  { max: 4.01, code: 'palec-plus', label: 'Vysoká pripravenosť', color: '#0B8F8F', text: 'Si vo veľmi dobrej kapacite pre ľudí aj rozhodnutia.' }
];

const state = {
  users: {
    demo: {
      id: 'demo',
      name: 'Demo používateľ',
      tier: 'free',
      gold: 90,
      streak: 0,
      lastDay: null,
      completedToday: [],
      unlockedToday: []
    }
  }
};

function daySeed(date) {
  return Number(date.toISOString().slice(0, 10).replace(/-/g, ''));
}

function dailyPool(date) {
  const seed = daySeed(date);
  const arr = [...SPECTRA];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = (seed + i * 31) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 5);
}

function resetDaily(user) {
  const today = new Date().toISOString().slice(0, 10);
  if (user.lastDay === today) return;

  if (user.lastDay) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    user.streak = user.lastDay === yesterday ? user.streak + 1 : 1;
  } else {
    user.streak = 1;
  }

  user.lastDay = today;
  user.completedToday = [];
  user.unlockedToday = [];
}

function allowedBase(user, pool) {
  if (user.tier === 'premium') return pool.slice(0, 4);
  return pool.slice(0, 1);
}

function computeStatus(scores) {
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return STATUS_BANDS.find((band) => avg <= band.max) || STATUS_BANDS[2];
}

function sendJson(res, code, data) {
  const payload = JSON.stringify(data);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(payload);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 2e6) {
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        return resolve(JSON.parse(data));
      } catch (err) {
        return reject(err);
      }
    });
  });
}

function serveStatic(req, res) {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const cleanPath = reqUrl.pathname === '/' ? '/index.html' : reqUrl.pathname;
  const target = path.join(PUBLIC_DIR, cleanPath);

  if (!target.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(target, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(target);
    const type = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8'
    }[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

async function handleApi(req, res) {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const user = state.users.demo;
  resetDaily(user);

  if (req.method === 'GET' && urlObj.pathname === '/api/bootstrap') {
    const pool = dailyPool(new Date());
    const base = allowedBase(user, pool);
    const unlocked = [...new Set([...base, ...user.unlockedToday])];

    return sendJson(res, 200, {
      user: {
        id: user.id,
        name: user.name,
        tier: user.tier,
        gold: user.gold,
        streak: user.streak
      },
      pool,
      unlocked,
      completedToday: user.completedToday
    });
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/tier') {
    const body = await parseBody(req);
    user.tier = body.tier === 'premium' ? 'premium' : 'free';
    return sendJson(res, 200, { ok: true, tier: user.tier });
  }

  if (req.method === 'GET' && urlObj.pathname.startsWith('/api/spectrum/')) {
    const spectrum = urlObj.pathname.split('/').pop();
    if (!QUESTIONS[spectrum]) return sendJson(res, 404, { error: 'Neznáme spektrum.' });

    const pool = dailyPool(new Date());
    const unlocked = [...new Set([...allowedBase(user, pool), ...user.unlockedToday])];
    if (!unlocked.includes(spectrum)) {
      return sendJson(res, 403, {
        error: 'Spektrum je zamknuté.',
        unlockCost: 40
      });
    }

    return sendJson(res, 200, { spectrum, questions: QUESTIONS[spectrum] });
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/unlock') {
    const body = await parseBody(req);
    const spectrum = body.spectrum;

    if (!SPECTRA.includes(spectrum)) return sendJson(res, 400, { error: 'Neplatné spektrum.' });
    if (user.unlockedToday.includes(spectrum)) return sendJson(res, 200, { ok: true, gold: user.gold });

    const pool = dailyPool(new Date());
    if (!pool.includes(spectrum)) return sendJson(res, 400, { error: 'Dnes toto spektrum nie je v pool-e.' });

    const cost = 40;
    if (user.gold < cost) return sendJson(res, 400, { error: 'Nedostatok gold.', missing: cost - user.gold });

    user.gold -= cost;
    user.unlockedToday.push(spectrum);
    return sendJson(res, 200, { ok: true, gold: user.gold, unlockedToday: user.unlockedToday });
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/submit') {
    const body = await parseBody(req);
    const { spectrum, answers } = body;

    if (!QUESTIONS[spectrum]) return sendJson(res, 400, { error: 'Neplatné spektrum.' });
    if (!Array.isArray(answers) || answers.length !== QUESTIONS[spectrum].length) {
      return sendJson(res, 400, { error: 'Odpovede musia mať správny počet.' });
    }

    const validated = answers.map((n) => Number(n));
    if (validated.some((n) => Number.isNaN(n) || n < 1 || n > 4)) {
      return sendJson(res, 400, { error: 'Odpovede musia byť v rozsahu 1-4.' });
    }

    const result = computeStatus(validated);
    if (!user.completedToday.includes(spectrum)) {
      user.completedToday.push(spectrum);
      user.gold += 20;
      if (user.streak > 0 && user.streak % 5 === 0) user.gold += 10;
    }

    return sendJson(res, 200, {
      spectrum,
      result,
      rewards: {
        completion: 20,
        streakBonus: user.streak > 0 && user.streak % 5 === 0 ? 10 : 0
      },
      gold: user.gold
    });
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/buy-gold') {
    const body = await parseBody(req);
    const packs = {
      mini: { gold: 220, eur: 1.99 },
      plus: { gold: 520, eur: 3.99 }
    };
    const pack = packs[body.pack];
    if (!pack) return sendJson(res, 400, { error: 'Neplatný balíček.' });

    user.gold += pack.gold;
    return sendJson(res, 200, { ok: true, pack, gold: user.gold });
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/social') {
    if (user.tier !== 'premium') {
      return sendJson(res, 403, { error: 'Sociálny prehľad je dostupný len v premium.' });
    }

    return sendJson(res, 200, {
      trend: 'Dnes je komunita skôr v opatrnom režime.',
      closest: 'Najbližší profil: "Stabilný connector"',
      friendsOnline: 6
    });
  }

  return sendJson(res, 404, { error: 'Route not found' });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/api/')) {
      await handleApi(req, res);
      return;
    }
    serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: 'Server error', detail: error.message });
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Standalone Social Status app running at http://localhost:${PORT}`);
});
