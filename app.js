'use strict';

const source = window.PIXELAND_TIK_SOURCE;
const tikQuestions = source?.items || [];
const otherQuestionBanks = window.PIXELAND_OTHER_SOURCES || {};
let questions = tikQuestions;
let currentSubject = 'tik';
const views = ['home', 'roadmap', 'quiz', 'result'];
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
  mapStart: byId('roadmap-start'), retryOverlay: byId('retry-overlay'), retryRobot: byId('retry-robot'),
  retryTitle: byId('retry-title'), retryHint: byId('retry-hint'),
  resultScore: byId('result-score'), resultDetail: byId('result-detail'), resultMessage: byId('result-message')
};
const backgroundTracks = [
  'assets/sound/back%201.flac',
  'assets/sound/back2.flac',
  'assets/sound/back3.flac'
];
const backgroundMusic = byId('background-music');
backgroundMusic.volume = .16;
let backgroundStarting = false;

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
  stopVoice();
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
    ui.sound.querySelector('.sound-label').textContent = 'Suara ON';
    ui.sound.setAttribute('aria-label', 'Suara aktif');
  }).catch(() => {
    backgroundStarting = false;
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

function stopVoice() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function speakCurrentQuestion() {
  if (!state.soundOn || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    ui.buddy.textContent = 'Suara baca belum tersedia di browser ini.';
    return;
  }
  const question = questions[state.index];
  let text = `Soal ${state.index + 1}. ${question.q}`;
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

  void ui.mapRobot.offsetWidth;
  requestAnimationFrame(() => {
    ui.mapRobot.style.transition = 'left 1.15s cubic-bezier(.2,.72,.3,1), top 1.15s cubic-bezier(.2,.72,.3,1)';
    ui.mapRobot.style.left = `${(toPoint.x / 1000) * 100}%`;
    ui.mapRobot.style.top = `${(toPoint.y / 565) * 100}%`;
  });
}

function renderRoadmap({ position = state.mapPosition, from = position, animate = false, final = false, showStart = false, status = '' } = {}) {
  const path = byId('roadmap-route-path');
  const routeLength = path.getTotalLength();
  const finishPoint = path.getPointAtLength(routeLength);
  const points = getRoadPoints();
  const targetPoint = final ? finishPoint : (points[Math.min(position, points.length - 1)] || finishPoint);
  const fromPoint = from >= points.length ? finishPoint : (points[from] || points[0]);

  ui.mapSubject.textContent = ui.quizSubject.textContent;
  ui.mapCount.textContent = `${questions.length} soal • ${questions.length} titik`;
  ui.mapStatus.textContent = status;
  ui.mapStart.hidden = !showStart;
  ui.mapStart.disabled = !showStart;
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
  ui.question.textContent = question.q;
  ui.feedback.textContent = '';
  ui.feedback.classList.remove('is-wrong');
  ui.answers.className = 'answer-area';
  ui.answers.innerHTML = '';
  ui.retryOverlay.hidden = true;
  ui.retryOverlay.classList.remove('is-falling', 'is-peeking');
  ui.next.disabled = true;
  ui.next.hidden = false;
  ui.next.innerHTML = state.index === questions.length - 1 ? 'Selesai <span aria-hidden="true">✦</span>' : 'Berikutnya <span aria-hidden="true">→</span>';
  ui.buddy.textContent = state.index % 4 === 3 ? 'Wah, makin hebat!' : 'Kamu pasti bisa!';
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
    button.querySelector('.option-text').textContent = option;
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
  const completedQuestion = state.index;
  state.answerTimer = window.setTimeout(() => {
    if (state.index !== completedQuestion) return;
    state.answerTimer = null;
    nextQuestion();
  }, 1100);
}

function showRetry(choice, question) {
  const buttons = [...ui.answers.querySelectorAll('.answer-option')];
  const wrongButton = buttons[choice];
  const attempt = (state.wrongAttempts[state.index] || 0) + 1;
  state.wrongAttempts[state.index] = attempt;
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
  });
  sampleButton.addEventListener('click', () => {
    sample.classList.toggle('is-visible');
    sampleButton.textContent = sample.classList.contains('is-visible') ? 'Sembunyikan contoh' : 'Lihat contoh';
  });
  form.append(input, sampleButton);
  ui.answers.append(form, sample);
}

function finish() {
  const mcTotal = questions.filter((item) => item.type === 'mc').length;
  const fillDone = state.answers.filter((answer) => answer?.type === 'fill').length;
  const score = mcTotal ? Math.round((state.correct / mcTotal) * 100) : 0;
  ui.resultScore.textContent = String(score);
  ui.resultDetail.textContent = `${state.correct} dari ${mcTotal} pilihan ganda tepat`;
  ui.resultMessage.textContent = `${fillDone} soal isian sudah kamu coba. Ajak pendamping melihat contoh jawaban.`;
  if (score > 80) soundEffect('achievement');
  else if (score < 80) soundEffect('losing');
  go('result');
}

function startPractice(subject = 'tik') {
  const bank = subject === 'tik'
    ? { title: 'TIK', items: tikQuestions }
    : otherQuestionBanks[subject];
  if (!bank?.items?.length) {
    ui.buddy.textContent = 'Bank soal belum dapat dibuka.';
    return;
  }
  currentSubject = subject;
  questions = bank.items;
  ui.quizSubject.textContent = bank.title.replace('Pendidikan ', '').replace(' (SBDP)', '').toLocaleUpperCase('id-ID');
  byId('view-quiz').classList.toggle('is-subject-other', subject !== 'tik');
  state.index = 0;
  state.correct = 0;
  state.answers = [];
  state.wrongAttempts = Array(questions.length).fill(0);
  state.mapPosition = 0;
  renderRoadmap({ position: 0, from: 0, showStart: true, status: 'Robot siap berangkat! Ayo lewati semua titik.' });
  go('roadmap');
}

function beginJourney() {
  ui.mapStart.disabled = true;
  ui.mapStart.hidden = true;
  state.index = 0;
  renderQuestion();
  go('quiz');
}

function nextQuestion() {
  if (ui.next.disabled) return;
  if (state.answerTimer) {
    window.clearTimeout(state.answerTimer);
    state.answerTimer = null;
  }
  ui.next.disabled = true;
  stopVoice();
  const from = state.mapPosition;
  const target = state.index + 1;
  const final = target >= questions.length;
  state.mapPosition = target;
  ui.mapStart.hidden = true;
  renderRoadmap({
    position: target,
    from,
    animate: true,
    final,
    status: final ? 'Robot menuju gerbang sekolah!' : `Robot melaju ke titik ${target + 1}!`
  });
  go('roadmap');
  state.mapTimer = window.setTimeout(() => {
    state.mapTimer = null;
    if (final) {
      finish();
      return;
    }
    state.index = target;
    renderQuestion();
    go('quiz');
  }, 1400);
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
  if (action === 'restart') startPractice(currentSubject);
  if (action === 'exit') go('home');
  if (action === 'credits') byId('credits-dialog').showModal();
  if (action === 'close-credits') byId('credits-dialog').close();
});

ui.next.addEventListener('click', nextQuestion);
ui.speak.addEventListener('click', speakCurrentQuestion);
ui.sound.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  ui.sound.setAttribute('aria-pressed', String(state.soundOn));
  ui.sound.setAttribute('aria-label', state.soundOn ? 'Suara aktif' : 'Suara mati');
  ui.sound.querySelector('.sound-label').textContent = state.soundOn ? 'Suara ON' : 'Suara OFF';
  if (!state.soundOn) {
    pauseBackground();
    stopVoice();
  } else startBackground();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseBackground();
  else startBackground();
});
window.addEventListener('hashchange', () => {
  const name = location.hash.slice(1);
  if (views.includes(name)) go(name);
});

startBackground();

