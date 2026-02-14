let bootstrap = null;
let currentSpectrum = null;

const userMeta = document.getElementById('user-meta');
const poolEl = document.getElementById('pool');
const questionCard = document.getElementById('question-card');
const resultCard = document.getElementById('result-card');
const formEl = document.getElementById('question-form');
const spectrumTitle = document.getElementById('spectrum-title');
const resultEl = document.getElementById('result');
const socialOutput = document.getElementById('social-output');

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'API error');
  return data;
}

function renderMeta() {
  userMeta.innerHTML = `
    <p><strong>${bootstrap.user.name}</strong></p>
    <p>Tier: ${bootstrap.user.tier} | Gold: ${bootstrap.user.gold} | Streak: ${bootstrap.user.streak}</p>
  `;
}

function renderPool() {
  poolEl.innerHTML = '';
  bootstrap.pool.forEach((spectrum) => {
    const unlocked = bootstrap.unlocked.includes(spectrum);
    const done = bootstrap.completedToday.includes(spectrum);

    const item = document.createElement('div');
    item.className = 'spectrum-item';

    const left = document.createElement('div');
    left.textContent = `${spectrum} ${done ? '✅' : ''}`;

    const right = document.createElement('div');
    const action = document.createElement('button');
    action.textContent = unlocked ? 'Otvoriť' : 'Odomknúť za 40 gold';
    action.onclick = async () => {
      try {
        if (!unlocked) {
          await api('/api/unlock', {
            method: 'POST',
            body: JSON.stringify({ spectrum })
          });
          await load();
        }
        await openSpectrum(spectrum);
      } catch (error) {
        alert(error.message);
      }
    };

    right.appendChild(action);
    item.append(left, right);
    poolEl.appendChild(item);
  });
}

async function openSpectrum(spectrum) {
  const payload = await api(`/api/spectrum/${spectrum}`);
  currentSpectrum = spectrum;
  questionCard.hidden = false;
  spectrumTitle.textContent = `Spektrum: ${payload.spectrum}`;
  formEl.innerHTML = '';

  payload.questions.forEach((question, idx) => {
    const wrapper = document.createElement('label');
    wrapper.textContent = `${idx + 1}. ${question}`;
    const select = document.createElement('select');
    select.name = `q-${idx}`;
    [1, 2, 3, 4].forEach((v) => {
      const option = document.createElement('option');
      option.value = String(v);
      option.textContent = `${v} / 4`;
      if (v === 3) option.selected = true;
      select.appendChild(option);
    });
    wrapper.appendChild(select);
    formEl.appendChild(wrapper);
  });
}

async function load() {
  bootstrap = await api('/api/bootstrap');
  renderMeta();
  renderPool();
}

document.getElementById('submit-btn').onclick = async () => {
  try {
    const answers = [...formEl.querySelectorAll('select')].map((el) => Number(el.value));
    const result = await api('/api/submit', {
      method: 'POST',
      body: JSON.stringify({ spectrum: currentSpectrum, answers })
    });

    resultCard.hidden = false;
    resultEl.innerHTML = `
      <p><strong>${result.result.label}</strong></p>
      <p>${result.result.text}</p>
      <p>Farba statusu: <span style="color:${result.result.color}">${result.result.code}</span></p>
      <p>Odmena: +${result.rewards.completion} gold</p>
      <p>Aktuálny gold: ${result.gold}</p>
    `;
    await load();
  } catch (error) {
    alert(error.message);
  }
};

document.querySelectorAll('.tier-btn').forEach((btn) => {
  btn.onclick = async () => {
    try {
      await api('/api/tier', {
        method: 'POST',
        body: JSON.stringify({ tier: btn.dataset.tier })
      });
      await load();
    } catch (error) {
      alert(error.message);
    }
  };
});

document.querySelectorAll('.buy-btn').forEach((btn) => {
  btn.onclick = async () => {
    try {
      const buy = await api('/api/buy-gold', {
        method: 'POST',
        body: JSON.stringify({ pack: btn.dataset.pack })
      });
      alert(`Dokúpené: ${buy.pack.gold} gold. Aktuálne: ${buy.gold}`);
      await load();
    } catch (error) {
      alert(error.message);
    }
  };
});

document.getElementById('social-btn').onclick = async () => {
  try {
    const payload = await api('/api/social');
    socialOutput.textContent = JSON.stringify(payload, null, 2);
  } catch (error) {
    socialOutput.textContent = error.message;
  }
};

load().catch((error) => {
  alert(error.message);
});
