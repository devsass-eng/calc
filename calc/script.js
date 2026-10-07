const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const themeToggle = document.querySelector('.theme-toggle');

const state = {
  expression: '',
  currentValue: '0',
  justEvaluated: false,
};

function updateDisplay() {
  expressionEl.textContent = state.expression || '0';
  resultEl.textContent = state.currentValue || '0';
}

function isOperator(value) {
  return ['+', '-', '*', '/'].includes(value);
}

function sanitizeExpression(input) {
  return input
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/%/g, '/100');
}

function safeEvaluate(expression) {
  const sanitized = sanitizeExpression(expression);
  if (!/^[0-9+\-*/().\s]+$/.test(sanitized)) {
    throw new Error('Invalid input');
  }

  const fn = new Function(`"use strict"; return (${sanitized});`);
  const value = fn();

  if (!Number.isFinite(value)) {
    throw new Error('Invalid calculation');
  }

  return Number(value.toFixed(10)).toString();
}

function appendNumber(value) {
  if (state.justEvaluated) {
    state.expression = '';
    state.currentValue = '0';
    state.justEvaluated = false;
  }

  const lastChar = state.expression.slice(-1);
  if (value === '.' && lastChar === '.') {
    return;
  }

  if (value === '.' && /\d*\.\d*$/.test(state.expression) === false && !/\d$/.test(lastChar)) {
    state.expression += '0.';
  } else if (value !== '.') {
    state.expression += value;
  } else if (state.expression === '' || isOperator(lastChar)) {
    state.expression += '0.';
  } else {
    state.expression += value;
  }

  try {
    state.currentValue = safeEvaluate(state.expression);
  } catch {
    state.currentValue = 'Error';
  }

  updateDisplay();
}

function appendOperator(operator) {
  if (state.justEvaluated) {
    state.justEvaluated = false;
  }

  const lastChar = state.expression.slice(-1);
  if (state.expression === '' && operator === '-') {
    state.expression = '-';
    updateDisplay();
    return;
  }

  if (isOperator(lastChar)) {
    state.expression = state.expression.slice(0, -1) + operator;
    updateDisplay();
    return;
  }

  state.expression += operator;
  updateDisplay();
}

function handlePercent() {
  if (!state.expression) return;

  const lastNumber = state.expression.match(/-?\d*\.?\d+$/);
  if (!lastNumber) return;

  const numericValue = Number(lastNumber[0]);
  const replacement = String(numericValue / 100);
  state.expression = state.expression.slice(0, lastNumber.index) + replacement;
  state.currentValue = safeEvaluate(state.expression);
  updateDisplay();
}

function clearAll() {
  state.expression = '';
  state.currentValue = '0';
  state.justEvaluated = false;
  updateDisplay();
}

function deleteLast() {
  if (state.justEvaluated) {
    clearAll();
    return;
  }

  state.expression = state.expression.slice(0, -1);
  if (!state.expression) {
    state.currentValue = '0';
  } else {
    try {
      state.currentValue = safeEvaluate(state.expression);
    } catch {
      state.currentValue = 'Error';
    }
  }
  updateDisplay();
}

function evaluateExpression() {
  if (!state.expression) return;

  try {
    const result = safeEvaluate(state.expression);
    state.expression = result;
    state.currentValue = result;
    state.justEvaluated = true;
    updateDisplay();
  } catch {
    state.expression = 'Error';
    state.currentValue = 'Error';
    state.justEvaluated = true;
    updateDisplay();
  }
}

function handleButtonClick(event) {
  const button = event.target.closest('button');
  if (!button) return;

  const { value, action } = button.dataset;

  if (button.classList.contains('number')) {
    appendNumber(value);
    return;
  }

  if (button.classList.contains('operator')) {
    appendOperator(value);
    return;
  }

  switch (action) {
    case 'clear':
      clearAll();
      break;
    case 'delete':
      deleteLast();
      break;
    case 'percent':
      handlePercent();
      break;
    case 'equals':
      evaluateExpression();
      break;
    default:
      break;
  }
}

function handleKeydown(event) {
  const { key } = event;

  if (/^[0-9]$/.test(key)) {
    appendNumber(key);
    return;
  }

  if (['+', '-', '*', '/'].includes(key)) {
    appendOperator(key);
    return;
  }

  if (key === '.') {
    appendNumber('.');
    return;
  }

  if (key === 'Enter' || key === '=') {
    evaluateExpression();
    return;
  }

  if (key === 'Backspace') {
    deleteLast();
    return;
  }

  if (key === 'Escape') {
    clearAll();
  }
}

document.addEventListener('click', handleButtonClick);
document.addEventListener('keydown', handleKeydown);

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
});

updateDisplay();
