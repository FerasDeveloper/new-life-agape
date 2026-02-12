// Default configuration
const defaultConfig = {
  game_title: 'لعبة الرقم السري',
  win_message: 'مبروك! لقد فزت!',
  lose_message: '😢 للأسف خسرت اللعبة!',
  background_color: '#1e1b4b',
  card_color: '#ffffff',
  text_color: '#1e1b4b',
  primary_btn_color: '#6366f1',
  secondary_btn_color: '#f59e0b'
};

let config = { ...defaultConfig };
const LOCAL_STORAGE_KEY = 'secretCode';
const CODE_LENGTH_KEY = 'secretCodeLength';
const ALLOWED_LENGTHS = [4, 5, 6, 8];
const DEFAULT_CODE_LENGTH = 6;

function getCodeLength() {
  const stored = localStorage.getItem(CODE_LENGTH_KEY);
  const n = parseInt(stored, 10);
  return ALLOWED_LENGTHS.includes(n) ? n : DEFAULT_CODE_LENGTH;
}

let codeLength = getCodeLength();
let storedData = [];
let secretCode = (() => {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY) || '123123';
  return normalizeSecretToLength(raw, codeLength);
})();

function normalizeSecretToLength(code, len) {
  const digits = code.replace(/[^0-9]/g, '');
  if (digits.length >= len) return digits.slice(0, len);
  return digits.padEnd(len, '0');
}

// Data SDK Handler
const dataHandler = {
  onDataChanged(data) {
    storedData = data;
    if (data.length > 0) {
      const latestCode = data[data.length - 1];
      if (latestCode.secret_code) {
        // Only apply SDK value if there's no value in localStorage
        if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
          secretCode = normalizeSecretToLength(String(latestCode.secret_code), codeLength);
          updateCurrentCodeDisplay();
        }
      }
    }
  }
};

// Initialize Data SDK
async function initDataSDK() {
  if (window.dataSdk) {
    const result = await window.dataSdk.init(dataHandler);
    if (!result.isOk) {
      console.error('Failed to initialize data SDK');
    }
  }
}

// Element SDK onConfigChange
async function onConfigChange(newConfig) {
  config = { ...defaultConfig, ...newConfig };

  const titleEl = document.getElementById('game-title');
  if (titleEl) titleEl.textContent = config.game_title || defaultConfig.game_title;

  const winTextEl = document.getElementById('win-text');
  if (winTextEl) winTextEl.textContent = config.win_message || defaultConfig.win_message;

  const loseTextEl = document.getElementById('lose-text');
  if (loseTextEl) loseTextEl.textContent = config.lose_message || defaultConfig.lose_message;
}

// Map to capabilities
function mapToCapabilities(config) {
  return {
    recolorables: [],
    borderables: [],
    fontEditable: undefined,
    fontSizeable: undefined
  };
}

// Map to edit panel values
function mapToEditPanelValues(config) {
  return new Map([
    ['game_title', config.game_title || defaultConfig.game_title],
    ['win_message', config.win_message || defaultConfig.win_message],
    ['lose_message', config.lose_message || defaultConfig.lose_message]
  ]);
}

// Initialize Element SDK
if (window.elementSdk) {
  window.elementSdk.init({
    defaultConfig,
    onConfigChange,
    mapToCapabilities,
    mapToEditPanelValues
  });
}

// DOM Elements
const mainPage = document.getElementById('main-page');
const settingsPage = document.getElementById('settings-page');
let codeInputs = [];
let newCodeInputs = [];
const verifyBtn = document.getElementById('verify-btn');
const retryBtn = document.getElementById('retry-btn');
const changeCodeBtn = document.getElementById('change-code-btn');
const saveCodeBtn = document.getElementById('save-code-btn');
const backBtn = document.getElementById('back-btn');
const errorMessage = document.getElementById('error-message');
const successModal = document.getElementById('success-modal');
const playAgainBtn = document.getElementById('play-again-btn');
const saveSuccess = document.getElementById('save-success');
const currentCodeDisplay = document.getElementById('current-code');
const codeLengthHint = document.getElementById('code-length-hint');
const oldCodeInput = document.getElementById('old-code-input');
const oldCodeError = document.getElementById('old-code-error');

function createCodeInputsIn(containerId, length) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  container.innerHTML = '';
  for (let i = 0; i < length; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 1;
    input.className = 'code-input';
    input.dataset.index = String(i);
    container.appendChild(input);
  }
  return container.querySelectorAll('.code-input');
}

function refreshAllCodeInputs() {
  codeInputs = createCodeInputsIn('code-inputs', codeLength);
  newCodeInputs = createCodeInputsIn('new-code-inputs', codeLength);
  setupInputNavigation(codeInputs);
  setupInputNavigation(newCodeInputs);
  if (codeLengthHint) codeLengthHint.textContent = `أدخل الرقم السري المكون من ${codeLength} أرقام`;
  if (oldCodeInput) oldCodeInput.maxLength = codeLength;
  updateCodeLengthButtons();
}

function updateCodeLengthButtons() {
  document.querySelectorAll('.code-length-btn').forEach((btn) => {
    const len = parseInt(btn.dataset.length, 10);
    btn.classList.toggle('border-indigo-600', len === codeLength);
    btn.classList.toggle('bg-indigo-100', len === codeLength);
    btn.classList.toggle('text-indigo-700', len === codeLength);
  });
}

// Update current code display
function updateCurrentCodeDisplay() {
  if (currentCodeDisplay) {
    currentCodeDisplay.textContent = secretCode;
  }
}

// Setup input navigation
function setupInputNavigation(inputs) {
  inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const value = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = value;

      if (value && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        inputs[index - 1].focus();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData
        .getData('text')
        .replace(/[^0-9]/g, '')
        .slice(0, inputs.length);
      const chars = pastedData.split('');
      inputs.forEach((inp, i) => {
        inp.value = chars[i] || '';
      });
    });
  });
}

// Code inputs are created in refreshAllCodeInputs() after DOM is ready

// Get code from inputs
function getCodeFromInputs(inputs) {
  return Array.from(inputs).map(input => input.value).join('');
}

// Clear inputs
function clearInputs(inputs) {
  inputs.forEach(input => {
    input.value = '';
    input.classList.remove('error', 'success');
  });
}

// Create confetti
function createConfetti() {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}%;
      top: -10px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
      animation-delay: ${Math.random() * 0.5}s;
    `;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 4000);
  }
}

// Verify code
verifyBtn.addEventListener('click', () => {
  const enteredCode = getCodeFromInputs(codeInputs);

  if (enteredCode.length !== codeLength) {
    codeInputs.forEach(input => input.classList.add('error'));
    setTimeout(() => codeInputs.forEach(input => input.classList.remove('error')), 500);
    return;
  }

  if (enteredCode === secretCode) {
    codeInputs.forEach(input => input.classList.add('success'));
    createConfetti();
    successModal.classList.remove('hidden');
  } else {
    codeInputs.forEach(input => input.classList.add('error'));
    errorMessage.classList.remove('hidden');
    verifyBtn.classList.add('hidden');
    retryBtn.classList.remove('hidden');
  }
});

// Retry
retryBtn.addEventListener('click', () => {
  clearInputs(codeInputs);
  errorMessage.classList.add('hidden');
  verifyBtn.classList.remove('hidden');
  retryBtn.classList.add('hidden');
  codeInputs[0].focus();
});

// Play again
playAgainBtn.addEventListener('click', () => {
  successModal.classList.add('hidden');
  clearInputs(codeInputs);
  codeInputs[0].focus();
});

// Navigate to settings
changeCodeBtn.addEventListener('click', () => {
  mainPage.classList.add('hidden');
  settingsPage.classList.remove('hidden');

  clearInputs(newCodeInputs);
  if (oldCodeInput) oldCodeInput.value = '';
  if (oldCodeError) oldCodeError.classList.add('hidden');

  saveSuccess.classList.add('hidden');
  updateCurrentCodeDisplay();
  if (oldCodeInput) oldCodeInput.focus();
});

// Back to main
backBtn.addEventListener('click', () => {
  settingsPage.classList.add('hidden');
  mainPage.classList.remove('hidden');
  clearInputs(codeInputs);
  errorMessage.classList.add('hidden');
  verifyBtn.classList.remove('hidden');
  retryBtn.classList.add('hidden');
});

// Save new code (with old code verification)
saveCodeBtn.addEventListener('click', async () => {
  const oldCode = oldCodeInput ? oldCodeInput.value.trim() : '';
  const newCode = getCodeFromInputs(newCodeInputs);

  // Check old code
  if (oldCode !== secretCode) {
    if (oldCodeError) oldCodeError.classList.remove('hidden');
    if (oldCodeInput) oldCodeInput.classList.add('error');

    setTimeout(() => {
      if (oldCodeInput) oldCodeInput.classList.remove('error');
    }, 600);

    return;
  }

  if (oldCodeError) oldCodeError.classList.add('hidden');

  // Validate new code
  if (newCode.length !== codeLength) {
    newCodeInputs.forEach(input => input.classList.add('error'));
    setTimeout(() => newCodeInputs.forEach(input => input.classList.remove('error')), 500);
    return;
  }

  saveCodeBtn.disabled = true;
  saveCodeBtn.textContent = '⏳ جاري الحفظ...';

  if (window.dataSdk) {
    for (const record of storedData) {
      await window.dataSdk.delete(record);
    }

    const result = await window.dataSdk.create({ secret_code: newCode });

    if (result.isOk) {
      secretCode = newCode;
      // persist to localStorage so future checks prefer it
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, newCode);
      } catch (e) {
        console.warn('Could not write secret to localStorage', e);
      }
      saveSuccess.classList.remove('hidden');
      newCodeInputs.forEach(input => input.classList.add('success'));
      updateCurrentCodeDisplay();

      setTimeout(() => {
        newCodeInputs.forEach(input => input.classList.remove('success'));
      }, 1000);
    }
  } else {
    secretCode = newCode;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newCode);
    } catch (e) {
      console.warn('Could not write secret to localStorage', e);
    }
    saveSuccess.classList.remove('hidden');
    updateCurrentCodeDisplay();
  }

  saveCodeBtn.disabled = false;
  saveCodeBtn.textContent = '💾 حفظ';
});

// Code length selector
document.querySelectorAll('.code-length-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const newLen = parseInt(btn.dataset.length, 10);
    if (newLen === codeLength || !ALLOWED_LENGTHS.includes(newLen)) return;
    codeLength = newLen;
    try {
      localStorage.setItem(CODE_LENGTH_KEY, String(codeLength));
    } catch (e) {
      console.warn('Could not save code length to localStorage', e);
    }
    secretCode = normalizeSecretToLength(secretCode, codeLength);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, secretCode);
    } catch (e) {
      console.warn('Could not write secret to localStorage', e);
    }
    refreshAllCodeInputs();
    updateCurrentCodeDisplay();
    clearInputs(newCodeInputs);
    if (oldCodeInput) oldCodeInput.value = '';
    if (oldCodeError) oldCodeError.classList.add('hidden');
  });
});

// Initialize
initDataSDK();
refreshAllCodeInputs();
updateCurrentCodeDisplay();
if (codeInputs.length > 0) codeInputs[0].focus();