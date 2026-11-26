'use strict';

const source = window.PIXELAND_TIK_SOURCE;
const tikQuestions = source?.items || [];
const tikExtraBank = window.PIXELAND_TIK_EXTRA_SOURCE;
const otherQuestionBanks = window.PIXELAND_OTHER_SOURCES || {};
const arabicQuestionBank = window.PIXELAND_ARABIC_SOURCE;
let questions = tikQuestions;
let currentSubject = 'tik';
const views = ['home', 'roadmap', 'quiz', 'result'];
const CELEBRATE_MS = 2800;
const ROBOT_WALK_MS = 2000;
const PROGRESS_KEY = 'pixeland-progress-v1';
const PLAYER_KEY = 'pixeland-player-v1';
const player = { name: '' };
const state = { index: 0, correct: 0, answers: [], wrongAttempts: [], mapPosition: 0, mapTimer: null, answerTimer: null, soundOn: true, backgroundIndex: 0 };
const byId = (id) => document.getElementById(id);
const ui = {
  sound: byId('sound-toggle'), counter: byId('question-counter'), progress: byId('progress-fill'),
  stars: byId('star-count'), topic: byId('topic-label'), question: byId('question-text'),
  answers: byId('answer-area'), next: byId('next-button'), feedback: byId('feedback-text'),
  buddy: byId('buddy-message'), dots: byId('question-dots'), speak: byId('speak-button'),
  quizSubject: byId('quiz-subject-label'),
  mapSubject: byId('roadmap-subject'), mapCount: byId('roadmap-count'), mapStatus: byId('roadmap-status'),
  mapCheckpoints: byId('roadmap-checkpoints'), mapRobot: byId('roadmap-robot'), mapFinish: byId('roadmap-finish'),
  mapStart: byId('roadmap-start'), mapRestart: byId('roadmap-restart'), correctOverlay: byId('correct-overlay'),
  retryOverlay: byId('retry-overlay'), retryRobot: byId('retry-robot'),
  retryTitle: byId('retry-title'), retryHint: byId('retry-hint'),
  resultScore: byId('result-score'), resultDetail: byId('result-detail'), resultMessage: byId('result-message'),
  resultTitle: byId('result-title'), correctMessage: byId('correct-message'), greeting: byId('home-greeting'),
  welcome: byId('welcome-dialog'), welcomeForm: byId('welcome-form'), welcomeName: byId('welcome-name'),
  welcomeError: byId('welcome-error'), welcomeSound: byId('welcome-sound')
};
const backgroundTracks = [
  'assets/sound/back%201.flac',
  'assets/sound/back2.flac',
  'assets/sound/back3.flac'
];
const backgroundMusic = byId('background-music');
backgroundMusic.volume = .16;
let backgroundStarting = false;

// Progres disimpan di sessionStorage: bertahan saat halaman dimuat ulang, hilang saat tab ditutup.
function readStore() {
  try {
    const store = JSON.parse(window.sessionStorage.getItem(PROGRESS_KEY));
    if (store?.subjects) return store;
  } catch {}
  return { subjects: {} };
}

function writeStore(store) {
  try {
    window.sessionStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
  } catch {}
}

const bankSignature = (items) => items.map((item) => item.q).join('|');

function saveProgress(done = false) {
  const store = readStore();
  store.subjects[currentSubject] = {
    signature: bankSignature(getBank(currentSubject).items), deck: state.deck, done,
    index: state.index, mapPosition: state.mapPosition, correct: state.correct,
    answers: state.answers, wrongAttempts: state.wrongAttempts
  };
  writeStore(store);
}

function saveView(view) {
  const store = readStore();
  store.active = { subject: currentSubject, view };
  writeStore(store);
}

function loadProgress(subject, items) {
  const saved = readStore().subjects[subject];
  const valid = saved && saved.signature === bankSignature(items)
    && Number.isInteger(saved.index) && saved.index >= 0 && saved.index < items.length
    && Number.isInteger(saved.mapPosition) && saved.mapPosition >= 0 && saved.mapPosition <= items.length
    && Array.isArray(saved.answers) && Array.isArray(saved.wrongAttempts)
    && isValidDeck(saved.deck, items);
  return valid ? saved : null;
}

// Fisher-Yates: hasilkan salinan teracak.
function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Deck = urutan soal dan urutan pilihan. Pilihan ganda tetap di depan, isian di belakang.
function makeDeck(items) {
  const indexes = items.map((_, index) => index);
  const choices = indexes.filter((index) => items[index].type === 'mc');
  const others = indexes.filter((index) => items[index].type !== 'mc');
  return [...shuffle(choices), ...shuffle(others)].map((index) => ({
    item: index,
    order: items[index].options ? shuffle(items[index].options.map((_, option) => option)) : null
  }));
}

function isValidDeck(deck, items) {
  if (!Array.isArray(deck) || deck.length !== items.length) return false;
  if (new Set(deck.map((card) => card?.item)).size !== items.length) return false;
  return deck.every((card) => {
    const source = items[card?.item];
    if (!source) return false;
    if (!source.options) return true;
    return Array.isArray(card.order) && card.order.length === source.options.length
      && new Set(card.order).size === card.order.length
      && card.order.every((option) => Number.isInteger(option) && option >= 0 && option < source.options.length);
  });
}

// Bank asli tidak diubah; kunci jawaban mengikuti posisi pilihan yang baru.
function applyDeck(items, deck) {
  return deck.map(({ item, order }) => {
    const source = items[item];
    if (!order) return source;
    const question = { ...source, options: order.map((option) => source.options[option]), a: order.indexOf(source.a) };
    if (source.optionArabic) question.optionArabic = order.map((option) => source.optionArabic[option]);
    return question;
  });
}

function clearProgress(subject) {
  const store = readStore();
  delete store.subjects[subject];
  writeStore(store);
}

function go(name) {
  if (!views.includes(name)) return;
  if (name !== 'quiz' && state.answerTimer) {
    window.clearTimeout(state.answerTimer);
    state.answerTimer = null;
  }
  if (name !== 'roadmap' && state.mapTimer) {
    window.clearTimeout(state.mapTimer);
    state.mapTimer = null;
  }
  if (name !== 'quiz') ui.correctOverlay.hidden = true;
  stopVoice();
  saveView(name);
  document.querySelectorAll('[data-view-panel]').forEach((panel) => {
    const active = panel.dataset.viewPanel === name;
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
  });
  history.replaceState(null, '', `#${name}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const focusTarget = document.querySelector(`#view-${name} h1`);
  if (focusTarget) {
    focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
  }
}

function playSoundFile(path, volume = .5) {
  if (!state.soundOn) return;
  const audio = new Audio(path);
  audio.volume = volume;
  audio.play().catch(() => {});
}

function soundEffect(kind) {
  const sounds = {
    tap: ['assets/sound/mixkit-select-click-1109.wav', .42],
    achievement: ['assets/sound/mixkit-achievement-bell-600.wav', .72],
    losing: ['assets/sound/mixkit-losing-bleeps-2026.wav', .58]
  };
  if (sounds[kind]) playSoundFile(...sounds[kind]);
}

function startBackground() {
  if (!state.soundOn || !backgroundMusic.paused || backgroundStarting) return;
  if (!backgroundMusic.src) backgroundMusic.src = backgroundTracks[state.backgroundIndex];
  backgroundStarting = true;
  backgroundMusic.play().then(() => {
    backgroundStarting = false;
    if (!state.soundOn) {
      backgroundMusic.pause();
      return;
    }
    ui.sound.querySelector('.sound-label').textContent = 'Suara ON';
    ui.sound.setAttribute('aria-label', 'Suara aktif');
  }).catch(() => {
    backgroundStarting = false;
    if (!state.soundOn) return;
    ui.sound.querySelector('.sound-label').textContent = 'Sentuh untuk musik';
    ui.sound.setAttribute('aria-label', 'Sentuh halaman atau tombol untuk memulai musik');
  });
}

function pauseBackground() {
  backgroundMusic.pause();
}

backgroundMusic.addEventListener('ended', () => {
  state.backgroundIndex = (state.backgroundIndex + 1) % backgroundTracks.length;
  backgroundMusic.src = backgroundTracks[state.backgroundIndex];
  if (state.soundOn) backgroundMusic.play().catch(() => {});
});
backgroundMusic.addEventListener('error', () => {
  backgroundStarting = false;
  ui.sound.querySelector('.sound-label').textContent = 'Audio gagal';
  ui.sound.setAttribute('aria-label', 'File musik tidak dapat diputar');
});

// Try audible autoplay on load; if the browser blocks it, the first touch/key starts it.
document.addEventListener('pointerdown', startBackground, { capture: true, passive: true });
document.addEventListener('keydown', startBackground, { capture: true });

function loadPlayer() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(PLAYER_KEY));
    if (!saved) return;
    player.name = typeof saved.name === 'string' ? saved.name : '';
    state.soundOn = saved.soundOn !== false;
  } catch {}
}

// Nama hanya disimpan di tab ini (sessionStorage) dan tidak dikirim ke mana pun.
function savePlayer() {
  try {
    window.sessionStorage.setItem(PLAYER_KEY, JSON.stringify({ name: player.name, soundOn: state.soundOn }));
  } catch {}
}

const greet = (text) => (player.name ? `${text}, ${player.name}!` : `${text}!`);

function renderPlayerName() {
  ui.greeting.textContent = player.name ? `Halo, ${player.name}! Yuk, coba satu per satu.` : 'Santai saja, coba satu per satu.';
}

function renderSound() {
  const label = state.soundOn ? 'Suara ON' : 'Suara OFF';
  ui.sound.setAttribute('aria-pressed', String(state.soundOn));
  ui.sound.setAttribute('aria-label', state.soundOn ? 'Suara aktif' : 'Suara mati');
  ui.sound.querySelector('.sound-label').textContent = label;
  ui.welcomeSound.setAttribute('aria-pressed', String(state.soundOn));
  ui.welcomeSound.textContent = `${state.soundOn ? '🔊' : '🔇'} ${label}`;
}

function setSound(on) {
  state.soundOn = on;
  renderSound();
  savePlayer();
  if (on) {
    startBackground();
    return;
  }
  backgroundMusic.autoplay = false;
  pauseBackground();
  stopVoice();
}

function openWelcome() {
  document.documentElement.classList.add('is-locked');
  ui.welcome.showModal();
}

function stopVoice() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function speakCurrentQuestion() {
  if (!state.soundOn || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    ui.buddy.textContent = 'Suara baca belum tersedia di browser ini.';
    return;
  }
  const question = questions[state.index];
  let text = `Soal ${state.index + 1}. ${question.speak || question.q}`;
  if (question.type === 'mc') {
    text += `. Pilihan A. ${question.options[0]}. Pilihan B. ${question.options[1]}. Pilihan C. ${question.options[2]}.`;
  } else {
    text += '. Jawab bersama pendampingmu.';
  }
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ').replace(/\s+/g, ' ').trim();
  stopVoice();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const indonesianVoice = voices.find((voice) => voice.lang.toLowerCase() === 'id-id')
    || voices.find((voice) => voice.lang.toLowerCase().startsWith('id'));
  utterance.lang = indonesianVoice?.lang || 'id-ID';
  if (indonesianVoice) utterance.voice = indonesianVoice;
  utterance.rate = .86;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function renderDots() {
  ui.dots.innerHTML = questions.map((_, index) => {
    const classes = ['question-dot'];
    if (index < state.index) classes.push('done');
    if (index === state.index) classes.push('current');
    return `<span class="${classes.join(' ')}" aria-hidden="true"></span>`;
  }).join('');
}

function getRoadPoints() {
  const path = byId('roadmap-route-path');
  const length = path.getTotalLength();
  const finalQuestionFraction = .94;
  return questions.map((_, index) => {
    const fraction = questions.length === 1 ? 0 : (index / (questions.length - 1)) * finalQuestionFraction;
    return path.getPointAtLength(length * fraction);
  });
}

function setMapRobotPosition(fromPoint, toPoint, animate, final = false) {
  ui.mapRobot.src = final ? 'assets/images/roadmap/robot-celebrate.png' : 'assets/images/roadmap/robot-run.png';
  ui.mapRobot.style.transition = 'none';
  ui.mapRobot.style.left = `${(fromPoint.x / 1000) * 100}%`;
  ui.mapRobot.style.top = `${(fromPoint.y / 565) * 100}%`;
  ui.mapRobot.classList.toggle('is-running', animate && !final);
  ui.mapRobot.classList.toggle('is-celebrating', final);
  if (!animate) return;

  // Paksa browser menghitung posisi awal sebelum transisi ke posisi tujuan.
  void ui.mapRobot.offsetWidth;
  ui.mapRobot.style.transition = `left ${ROBOT_WALK_MS}ms ease-in-out, top ${ROBOT_WALK_MS}ms ease-in-out`;
  ui.mapRobot.style.left = `${(toPoint.x / 1000) * 100}%`;
  ui.mapRobot.style.top = `${(toPoint.y / 565) * 100}%`;
}

function showMapButton(label) {
  ui.mapStart.innerHTML = `${label} <span aria-hidden="true">→</span>`;
  ui.mapStart.hidden = false;
  ui.mapStart.disabled = false;
  // Di layar pendek tombol berada di bawah peta; gulir secukupnya agar terlihat.
  ui.mapStart.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function renderRoadmap({ position = state.mapPosition, from = position, animate = false, final = false, status = '' } = {}) {
  const path = byId('roadmap-route-path');
  const routeLength = path.getTotalLength();
  const finishPoint = path.getPointAtLength(routeLength);
  const points = getRoadPoints();
  const targetPoint = final ? finishPoint : (points[Math.min(position, points.length - 1)] || finishPoint);
  const fromPoint = from >= points.length ? finishPoint : (points[from] || points[0]);

  ui.mapSubject.textContent = ui.quizSubject.textContent;
  ui.mapCount.textContent = `${questions.length} soal • ${questions.length} titik`;
  ui.mapStatus.textContent = status;
  ui.mapStart.hidden = true;
  ui.mapStart.disabled = true;
  ui.mapRestart.hidden = true;
  ui.mapFinish.style.left = `${(finishPoint.x / 1000) * 100}%`;
  ui.mapFinish.style.top = `${(finishPoint.y / 565) * 100}%`;
  ui.mapCheckpoints.replaceChildren();
  points.forEach((point, index) => {
    const marker = document.createElement('span');
    marker.className = 'roadmap-checkpoint';
    if (index < position || final) marker.classList.add('is-complete');
    if (!final && index === position) marker.classList.add('is-current');
    marker.style.left = `${(point.x / 1000) * 100}%`;
    marker.style.top = `${(point.y / 565) * 100}%`;
    marker.textContent = String(index + 1);
    ui.mapCheckpoints.append(marker);
  });
  setMapRobotPosition(fromPoint, targetPoint, animate, final);
}

function renderQuestion() {
  const question = questions[state.index];
  if (!question) return;
  ui.counter.textContent = `${state.index + 1} / ${questions.length}`;
  ui.progress.style.width = `${((state.index + 1) / questions.length) * 100}%`;
  ui.stars.textContent = String(state.correct);
  ui.topic.textContent = question.topic.toLocaleUpperCase('id-ID');
  ui.question.replaceChildren();
  if (question.arabic) {
    const arabic = document.createElement('span');
    arabic.className = 'question-arabic';
    arabic.lang = 'ar';
    arabic.dir = 'rtl';
    arabic.textContent = question.arabic;
    const translation = document.createElement('span');
    translation.className = 'question-translation';
    translation.textContent = question.q;
    ui.question.append(arabic, translation);
  } else {
    ui.question.textContent = question.q;
  }
  ui.feedback.textContent = '';
  ui.feedback.classList.remove('is-wrong');
  ui.answers.className = 'answer-area';
  ui.answers.innerHTML = '';
  ui.retryOverlay.hidden = true;
  ui.retryOverlay.classList.remove('is-falling', 'is-peeking');
  ui.correctOverlay.hidden = true;
  ui.next.disabled = true;
  ui.next.hidden = false;
  ui.next.innerHTML = state.index === questions.length - 1 ? 'Selesai <span aria-hidden="true">✦</span>' : 'Berikutnya <span aria-hidden="true">→</span>';
  ui.buddy.textContent = greet(state.index % 4 === 3 ? 'Wah, makin hebat' : 'Kamu pasti bisa');
  if (question.type === 'mc') renderChoices(question);
  else renderFillIn(question);
  renderDots();
}

function renderChoices(question) {
  const labels = ['A', 'B', 'C'];
  question.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-option';
    button.dataset.choice = String(index);
    button.innerHTML = `<span class="option-letter">${labels[index]}</span><span class="option-text"></span>`;
    const optionText = button.querySelector('.option-text');
    optionText.textContent = option;
    if (question.optionArabic?.[index]) {
      optionText.lang = 'ar';
      optionText.dir = 'rtl';
      optionText.classList.add('is-arabic');
    }
    button.addEventListener('click', () => chooseAnswer(index, question));
    ui.answers.append(button);
  });
}

function chooseAnswer(choice, question) {
  if (state.answers[state.index]?.correct) return;
  const correct = choice === question.a;
  if (!correct) {
    showRetry(choice, question);
    return;
  }

  state.answers[state.index] = { correct: true, type: 'mc' };
  state.correct += 1;
  ui.feedback.textContent = 'Betul! Hebat sekali! Robot siap melaju!';
  ui.feedback.classList.remove('is-wrong');
  ui.buddy.textContent = 'Yeay, jawabanmu tepat!';
  [...ui.answers.querySelectorAll('.answer-option')].forEach((button, index) => {
    button.disabled = true;
    if (index === question.a) button.classList.add('correct');
  });
  ui.stars.textContent = String(state.correct);
  ui.next.disabled = false;
  ui.next.textContent = state.index === questions.length - 1 ? 'Ke gerbang! →' : 'Laju ke titik berikutnya →';
  saveProgress();
  ui.correctMessage.textContent = `${greet('Hebat')} Robot siap melaju!`;
  ui.correctOverlay.hidden = false;
  const completedQuestion = state.index;
  state.answerTimer = window.setTimeout(() => {
    if (state.index !== completedQuestion) return;
    state.answerTimer = null;
    nextQuestion();
  }, CELEBRATE_MS);
}

function showRetry(choice, question) {
  const buttons = [...ui.answers.querySelectorAll('.answer-option')];
  const wrongButton = buttons[choice];
  const attempt = (state.wrongAttempts[state.index] || 0) + 1;
  state.wrongAttempts[state.index] = attempt;
  saveProgress();
  buttons.forEach((button) => { button.disabled = true; });
  wrongButton?.classList.add('wrong');

  const hint = attempt >= 2 ? (question.hint || question.why || question.tip || 'Dengarkan soalnya sekali lagi.') : '';
  ui.retryRobot.src = 'assets/images/roadmap/robot-fall.png';
  ui.retryTitle.textContent = 'Ups! Coba lagi!';
  ui.retryHint.textContent = hint ? `Petunjuk: ${hint}` : 'Robot terpeleset ke lubang kecil. Pilih lagi, ya!';
  ui.retryOverlay.hidden = false;
  ui.retryOverlay.classList.remove('is-peeking');
  ui.retryOverlay.classList.add('is-falling');
  ui.feedback.textContent = attempt >= 2 ? 'Ada petunjuk untukmu.' : 'Coba pilih jawaban yang lain.';
  ui.feedback.classList.add('is-wrong');
  ui.buddy.textContent = 'Tidak apa-apa, kita coba lagi!';

  const questionIndex = state.index;
  window.setTimeout(() => {
    if (state.index !== questionIndex) return;
    ui.retryRobot.src = 'assets/images/roadmap/robot-retry.png';
    ui.retryOverlay.classList.remove('is-falling');
    ui.retryOverlay.classList.add('is-peeking');
  }, 420);
  window.setTimeout(() => {
    if (state.index !== questionIndex) return;
    ui.retryOverlay.hidden = true;
    buttons.forEach((button) => {
      button.disabled = false;
      button.classList.remove('wrong');
    });
    ui.feedback.textContent = hint ? `Petunjuk: ${hint}` : 'Coba pilih jawaban yang lain, ya.';
  }, 1500);
}

function renderFillIn(question) {
  ui.answers.classList.add('fill-area');
  const form = document.createElement('div');
  form.className = 'fill-form';
  const input = document.createElement('input');
  input.className = 'fill-input';
  input.type = 'text';
  input.maxLength = 80;
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Jawaban singkat');
  input.placeholder = 'Tulis jawabanmu…';
  const sampleButton = document.createElement('button');
  sampleButton.type = 'button';
  sampleButton.className = 'fill-submit';
  sampleButton.textContent = 'Lihat contoh';
  const sample = document.createElement('div');
  sample.className = 'sample-answer';
  sample.setAttribute('aria-live', 'polite');
  sample.textContent = `Contoh jawaban: ${question.sample}. ${question.tip || ''}`;
  input.addEventListener('input', () => {
    const hasText = input.value.trim().length > 0;
    ui.next.disabled = !hasText;
    if (hasText) state.answers[state.index] = { correct: null, type: 'fill', value: input.value.trim() };
    else delete state.answers[state.index];
    saveProgress();
  });
  sampleButton.addEventListener('click', () => {
    sample.classList.toggle('is-visible');
    sampleButton.textContent = sample.classList.contains('is-visible') ? 'Sembunyikan contoh' : 'Lihat contoh';
  });
  form.append(input, sampleButton);
  ui.answers.append(form, sample);
  const savedValue = state.answers[state.index]?.value;
  if (savedValue) {
    input.value = savedValue;
    ui.next.disabled = false;
  }
}

function finish({ silent = false } = {}) {
  const mcTotal = questions.filter((item) => item.type === 'mc').length;
  const fillDone = state.answers.filter((answer) => answer?.type === 'fill').length;
  const score = mcTotal ? Math.round((state.correct / mcTotal) * 100) : 0;
  ui.resultTitle.textContent = `${greet('Hebat')} Kamu sudah mencoba.`;
  ui.resultScore.textContent = String(score);
  ui.resultDetail.textContent = `${state.correct} dari ${mcTotal} pilihan ganda tepat`;
  ui.resultMessage.textContent = `${fillDone} soal isian sudah kamu coba. Ajak pendamping melihat contoh jawaban.`;
  if (!silent && score > 80) soundEffect('achievement');
  else if (!silent && score < 80) soundEffect('losing');
  go('result');
  saveProgress(true);
}

function getBank(subject) {
  if (subject === 'tik') return { title: 'TIK', items: tikQuestions };
  if (subject === 'tik-extra') return tikExtraBank;
  if (subject === 'arabic') return arabicQuestionBank;
  return otherQuestionBanks[subject];
}

function openSubject(subject, saved) {
  const bank = getBank(subject);
  currentSubject = subject;
  state.deck = saved?.deck ?? makeDeck(bank.items);
  questions = applyDeck(bank.items, state.deck);
  ui.quizSubject.textContent = bank.title.replace('Pendidikan ', '').replace(' (SBDP)', '').toLocaleUpperCase('id-ID');
  byId('view-quiz').classList.toggle('is-subject-other', !subject.startsWith('tik'));
  state.index = saved?.index ?? 0;
  state.correct = saved?.correct ?? 0;
  state.answers = saved ? [...saved.answers] : [];
  state.wrongAttempts = saved ? saved.wrongAttempts.map((count) => count || 0) : Array(questions.length).fill(0);
  state.mapPosition = saved?.mapPosition ?? 0;
  // Jawaban sudah benar tetapi halaman ditutup saat perayaan: robot dianggap sudah maju.
  const answer = state.answers[state.index];
  if (answer?.type === 'mc' && answer.correct && state.mapPosition === state.index) state.mapPosition += 1;
}

function showSavedRoadmap() {
  const position = state.mapPosition;
  const final = position >= questions.length;
  const started = position > 0;
  let status = 'Robot siap berangkat! Ayo lewati semua titik.';
  if (final) status = 'Progresmu tersimpan. Robot sudah di gerbang!';
  else if (started) status = `Progresmu tersimpan. Robot ada di titik ${position + 1}.`;
  go('roadmap');
  renderRoadmap({ position, from: position, final, status });
  showMapButton(final ? 'Lihat hasil' : started ? 'Lanjut' : 'Mulai Petualangan');
  ui.mapRestart.hidden = !started;
  saveProgress();
}

function startPractice(subject = 'tik') {
  const bank = getBank(subject);
  if (!bank?.items?.length) {
    ui.buddy.textContent = 'Bank soal belum dapat dibuka.';
    return;
  }
  const saved = loadProgress(subject, bank.items);
  // Lanjutkan hanya bila sudah ada jawaban; selain itu acak ulang.
  const started = saved && !saved.done
    && (saved.mapPosition > 0 || saved.answers.some(Boolean) || saved.wrongAttempts.some(Boolean));
  openSubject(subject, started ? saved : null);
  showSavedRoadmap();
}

function beginJourney() {
  ui.mapStart.disabled = true;
  ui.mapStart.hidden = true;
  if (state.mapPosition >= questions.length) {
    finish();
    return;
  }
  state.index = state.mapPosition;
  renderQuestion();
  go('quiz');
  saveProgress();
}

function nextQuestion() {
  if (ui.next.disabled) return;
  if (state.answerTimer) {
    window.clearTimeout(state.answerTimer);
    state.answerTimer = null;
  }
  ui.next.disabled = true;
  const from = state.mapPosition;
  const target = state.index + 1;
  const final = target >= questions.length;
  state.mapPosition = target;
  // Peta ditampilkan dulu agar perpindahan robot benar-benar teranimasi.
  go('roadmap');
  saveProgress();
  renderRoadmap({
    position: target,
    from,
    animate: true,
    final,
    status: final ? 'Robot menuju gerbang sekolah!' : `Robot berjalan ke titik ${target + 1}…`
  });
  state.mapTimer = window.setTimeout(() => {
    state.mapTimer = null;
    ui.mapRobot.classList.remove('is-running');
    ui.mapStatus.textContent = final ? 'Robot sampai di gerbang sekolah!' : `Robot sampai di titik ${target + 1}. Tekan Lanjut, ya!`;
    showMapButton(final ? 'Lihat hasil' : 'Lanjut');
  }, ROBOT_WALK_MS);
}

function restoreSession() {
  const { active } = readStore();
  if (!active || active.view === 'home') return;
  const bank = getBank(active.subject);
  if (!bank?.items?.length) return;
  const saved = loadProgress(active.subject, bank.items);
  if (!saved) return;
  if (saved.done) {
    if (active.view !== 'result') return;
    openSubject(active.subject, saved);
    finish({ silent: true });
    return;
  }
  openSubject(active.subject, saved);
  if (active.view === 'quiz' && state.mapPosition === state.index) {
    renderQuestion();
    go('quiz');
  } else showSavedRoadmap();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (state.soundOn) {
    soundEffect('tap');
    startBackground();
  }
}, true);

document.addEventListener('click', (event) => {
  const control = event.target.closest('[data-view], [data-action]');
  if (!control) return;
  if (control.dataset.view) {
    event.preventDefault();
    go(control.dataset.view);
    return;
  }
  const action = control.dataset.action;
  if (action === 'start-subject') startPractice(control.dataset.subject);
  if (action === 'begin-journey') beginJourney();
  if (action === 'restart') {
    clearProgress(currentSubject);
    startPractice(currentSubject);
  }
  if (action === 'exit') go('home');
  if (action === 'credits') byId('credits-dialog').showModal();
  if (action === 'close-credits') byId('credits-dialog').close();
});

ui.next.addEventListener('click', nextQuestion);
ui.speak.addEventListener('click', speakCurrentQuestion);
ui.sound.addEventListener('click', () => setSound(!state.soundOn));
ui.welcomeSound.addEventListener('click', () => setSound(!state.soundOn));
ui.welcomeName.addEventListener('input', () => { ui.welcomeError.textContent = ''; });
ui.welcomeForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = ui.welcomeName.value.replace(/\s+/g, ' ').trim();
  if (!name) {
    ui.welcomeError.textContent = 'Tulis namamu dulu, ya!';
    ui.welcomeName.focus();
    return;
  }
  player.name = name;
  savePlayer();
  renderPlayerName();
  ui.welcome.close();
  startBackground();
});
// Popup tidak boleh ditutup (misalnya dengan Esc) sebelum nama diisi.
ui.welcome.addEventListener('cancel', (event) => event.preventDefault());
ui.welcome.addEventListener('close', () => {
  if (!player.name) openWelcome();
  else document.documentElement.classList.remove('is-locked');
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseBackground();
  else startBackground();
});
window.addEventListener('hashchange', () => {
  const name = location.hash.slice(1);
  if (views.includes(name)) go(name);
});

loadPlayer();
renderSound();
renderPlayerName();
if (!state.soundOn) {
  backgroundMusic.autoplay = false;
  pauseBackground();
}
restoreSession();
if (!player.name) openWelcome();
startBackground();

