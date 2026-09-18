"use strict";

// ===== 설정 =====
const CATEGORIES = ["한국사", "세계지리", "과학", "예술과 문화"];
const QUESTIONS_PER_ROUND = 10;

// 모드별 규칙. 동작 코드는 모드 이름이 아니라 이 값들을 읽습니다.
const MODES = {
  practice: {
    label: "연습",
    description: "시간 제한과 감점 없이 풉니다. 틀린 문제만 다시 풀 수 있습니다.",
    timeLimit: null,
    hint: false,
    ranked: false,
    retryWrong: true,
  },
  speed: {
    label: "스피드",
    description: "문항마다 15초 안에 답합니다. 시간이 지나면 오답입니다.",
    timeLimit: 15,
    hint: false,
    ranked: true,
    retryWrong: false,
  },
  hint: {
    label: "힌트",
    description: "힌트로 오답 2개를 지울 수 있습니다. 힌트를 쓰고 맞히면 0.5점입니다.",
    timeLimit: null,
    hint: true,
    ranked: true,
    retryWrong: false,
  },
};

const STORAGE_KEY = "quiz.scores";
const TOP_N = 5;
const RANKED_MODES = Object.keys(MODES).filter((key) => MODES[key].ranked);

// ===== 계산 함수 =====
// 화면과 상관없는 함수들입니다. 콘솔에서 바로 불러 확인할 수 있습니다.

function isFilled(value) {
  return typeof value === "string" && value.trim() !== "";
}

// Fisher–Yates. 원본은 바꾸지 않고 새 배열을 돌려줍니다.
function shuffle(items, random = Math.random) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function validateQuestions(questions) {
  if (!Array.isArray(questions)) return ["QUESTIONS가 배열이 아닙니다."];
  const errors = [];
  const ids = new Set();
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));

  questions.forEach((q, i) => {
    const where = `${i + 1}번째 문항(${q && isFilled(q.id) ? q.id : "id 없음"})`;
    if (!q || typeof q !== "object") {
      errors.push(`${where}: 객체가 아닙니다.`);
      return;
    }
    if (!isFilled(q.id)) errors.push(`${where}: id가 비어 있습니다.`);
    else if (ids.has(q.id)) errors.push(`${where}: id가 겹칩니다.`);
    else ids.add(q.id);

    if (CATEGORIES.includes(q.category)) counts[q.category] += 1;
    else errors.push(`${where}: 카테고리 "${q.category}"는 쓸 수 없습니다.`);

    for (const key of ["question", "answer", "explanation"]) {
      if (!isFilled(q[key])) errors.push(`${where}: ${key}가 비어 있습니다.`);
    }
    if (!q.source || !isFilled(q.source.title) || !isFilled(q.source.url)) {
      errors.push(`${where}: 출처(source.title, source.url)가 비어 있습니다.`);
    }

    if (!Array.isArray(q.choices) || q.choices.length !== 4) {
      errors.push(`${where}: 보기가 4개가 아닙니다.`);
    } else {
      if (!q.choices.every(isFilled)) errors.push(`${where}: 빈 보기가 있습니다.`);
      if (new Set(q.choices).size !== 4) errors.push(`${where}: 겹치는 보기가 있습니다.`);
      if (q.choices.filter((choice) => choice === q.answer).length !== 1) {
        errors.push(`${where}: 정답이 보기 안에 정확히 한 번 있지 않습니다.`);
      }
    }
  });

  for (const category of CATEGORIES) {
    if (counts[category] !== QUESTIONS_PER_ROUND) {
      errors.push(`${category}: 문항이 ${counts[category]}개입니다(${QUESTIONS_PER_ROUND}개여야 함).`);
    }
  }
  return errors;
}

// 한 판에 쓸 문항: 카테고리로 거르고, 문항 순서와 보기 순서를 섞은 복사본.
function buildRound(category, questions, random = Math.random) {
  return shuffle(questions.filter((q) => q.category === category), random)
    .map((q) => ({ ...q, choices: shuffle(q.choices, random) }));
}

// chosen이 null이면 시간 초과입니다.
function gradeAnswer(question, chosen, hintUsed = false) {
  const correct = chosen === question.answer;
  return {
    questionId: question.id,
    chosen,
    correct,
    timedOut: chosen === null,
    hintUsed,
    points: correct ? (hintUsed ? 0.5 : 1) : 0,
  };
}

function scoreRound(records) {
  return records.reduce((sum, record) => sum + record.points, 0);
}

function formatScore(score) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

// 시작 시각과의 차이로 계산하므로 탭을 떠났다 와도 어긋나지 않습니다.
function remainingSeconds(startedAt, now, limit) {
  return Math.max(0, limit - Math.floor((now - startedAt) / 1000));
}

// 오답 3개 중 2개를 무작위로 고릅니다.
function pickHintRemovals(question, random = Math.random) {
  return shuffle(question.choices.filter((choice) => choice !== question.answer), random).slice(0, 2);
}

// 점수 높은 순 → 힌트 적은 순 → 먼저 세운 기록 순.
function compareScores(a, b) {
  return b.score - a.score || a.hintsUsed - b.hintsUsed || a.date.localeCompare(b.date);
}

function isValidScore(entry) {
  return Boolean(entry)
    && typeof entry === "object"
    && CATEGORIES.includes(entry.category)
    && RANKED_MODES.includes(entry.mode)
    && Number.isFinite(entry.score)
    && Number.isInteger(entry.hintsUsed)
    && entry.hintsUsed >= 0
    && typeof entry.date === "string"
    && !Number.isNaN(Date.parse(entry.date));
}

// localStorage에서 읽은 문자열을 기록 배열로 바꿉니다. 깨진 값은 버립니다.
function parseScores(raw) {
  if (raw === null) return [];
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  return Array.isArray(data) ? data.filter(isValidScore) : [];
}

function topScores(scores, category, mode) {
  return scores
    .filter((s) => s.category === category && s.mode === mode)
    .sort(compareScores)
    .slice(0, TOP_N);
}

// 새 기록을 더하고, 카테고리와 모드 조합마다 상위 5개만 남깁니다.
function addScore(scores, entry) {
  const all = [...scores, entry];
  const kept = [];
  for (const category of CATEGORIES) {
    for (const mode of RANKED_MODES) kept.push(...topScores(all, category, mode));
  }
  return kept;
}

function rankOf(scores, entry) {
  const index = topScores(scores, entry.category, entry.mode).indexOf(entry);
  return index === -1 ? null : index + 1;
}

// 사용자 컴퓨터의 시간대 기준 날짜(YYYY-MM-DD).
function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ===== 저장소 =====
// 저장이 막힌 브라우저(시크릿 창, 저장소 차단 등)에서는 예외가 날 수 있어 모두 try/catch로 감쌉니다.

function loadScores() {
  try {
    return { ok: true, scores: parseScores(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return { ok: false, scores: [] };
  }
}

function saveScores(scores) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    return true;
  } catch {
    return false;
  }
}

function clearScores() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

// ===== 상태 =====
const state = {
  screen: "start", // start | question | result | error
  errors: [],
  category: CATEGORIES[0],
  mode: "practice", // MODES의 키
  round: [], // 이번 판 문항(섞은 복사본)
  index: 0, // 지금 풀고 있는 문항 번호(0부터)
  records: [], // records[i]가 있으면 i번 문항은 답을 고른 상태
  timerStartedAt: null,
  timerId: null,
  removed: [], // 힌트로 지운 보기
  lastSave: null, // 방금 끝난 판의 저장 결과 { ok, rank }. 저장 대상이 아니면 null
  boardCategory: CATEGORIES[0], // 순위표에서 보고 있는 카테고리
};

// ===== DOM 도우미 =====
// el("button", { class: "primary", onclick: fn }, "글자") 처럼 씁니다.
// 글자는 텍스트 노드로 들어가므로 HTML로 해석되지 않습니다.
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "class") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : String(child));
  }
  return node;
}

// ===== 동작 =====
function startRound() {
  beginRound(buildRound(state.category, QUESTIONS));
}

function beginRound(round) {
  state.round = round;
  state.index = 0;
  state.records = [];
  state.lastSave = null;
  state.screen = "question";
  showQuestion();
}

// 새 문항을 화면에 올릴 때마다 부릅니다.
function showQuestion() {
  state.removed = [];
  startTimer();
  render();
}

function useHint() {
  if (state.records[state.index] || state.removed.length > 0) return;
  state.removed = pickHintRemovals(state.round[state.index]);
  render();
}

function startTimer() {
  stopTimer();
  const limit = MODES[state.mode].timeLimit;
  if (limit === null) return;
  state.timerStartedAt = Date.now();
  state.timerId = setInterval(tick, 200);
}

function stopTimer() {
  if (state.timerId !== null) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

// 화면 전체를 다시 그리지 않고 남은 시간 글자만 바꿉니다.
function tick() {
  const left = remainingSeconds(state.timerStartedAt, Date.now(), MODES[state.mode].timeLimit);
  const label = document.getElementById("timer");
  if (label) label.textContent = `남은 시간 ${left}초`;
  if (left === 0) answer(null);
}

function answer(choice) {
  if (state.records[state.index]) return; // 이미 답한 문항
  stopTimer();
  state.records[state.index] = gradeAnswer(state.round[state.index], choice, state.removed.length > 0);
  render();
}

function next() {
  if (state.index < state.round.length - 1) {
    state.index += 1;
    showQuestion();
  } else {
    finishRound();
  }
}

// 10문제를 모두 푼 판만 여기로 옵니다. 도중에 그만둔 판은 저장하지 않습니다.
function finishRound() {
  state.screen = "result";
  state.lastSave = MODES[state.mode].ranked ? recordScore() : null;
  render();
}

function recordScore() {
  const entry = {
    category: state.category,
    mode: state.mode,
    score: scoreRound(state.records),
    hintsUsed: state.records.filter((r) => r.hintUsed).length,
    date: new Date().toISOString(),
  };
  const loaded = loadScores();
  if (!loaded.ok) return { ok: false, rank: null };
  const scores = addScore(loaded.scores, entry);
  if (!saveScores(scores)) return { ok: false, rank: null };
  return { ok: true, rank: rankOf(scores, entry) };
}

function goHome() {
  stopTimer();
  state.screen = "start";
  render();
}

function retryWrong() {
  const wrong = state.round.filter((q, i) => !state.records[i].correct);
  beginRound(buildRound(state.category, wrong));
}

function openLeaderboard() {
  state.screen = "leaderboard";
  render();
}

function clearAllScores() {
  if (!window.confirm("모든 기록을 지울까요? 되돌릴 수 없습니다.")) return;
  if (!clearScores()) window.alert("기록을 지울 수 없습니다.");
  render();
}

// ===== 화면 =====
function renderStart() {
  return el("section", { class: "screen start" },
    el("h1", {}, "상식 퀴즈"),
    el("p", { class: "lead" }, "카테고리와 모드를 고르고 시작하세요. 한 판은 10문제입니다."),
    el("fieldset", { class: "options" },
      el("legend", {}, "카테고리"),
      CATEGORIES.map((category) => el("label", { class: "option" },
        el("input", {
          type: "radio",
          name: "category",
          value: category,
          checked: category === state.category,
          onchange: () => { state.category = category; },
        }),
        el("span", {}, category)))),
    el("fieldset", { class: "options" },
      el("legend", {}, "모드"),
      Object.entries(MODES).map(([key, mode]) => el("label", { class: "option" },
        el("input", {
          type: "radio",
          name: "mode",
          value: key,
          checked: key === state.mode,
          onchange: () => { state.mode = key; },
        }),
        el("span", {},
          el("strong", {}, mode.label),
          el("span", { class: "option-desc" }, mode.description))))),
    el("div", { class: "actions" },
      el("button", { type: "button", class: "primary", "data-focus": "", onclick: startRound }, "시작"),
      el("button", { type: "button", onclick: openLeaderboard }, "순위표")));
}

function renderQuestion() {
  const q = state.round[state.index];
  const record = state.records[state.index];
  const isLast = state.index === state.round.length - 1;
  return el("section", { class: "screen question" },
    el("div", { class: "topbar" },
      el("span", { class: "progress" }, `${state.index + 1} / ${state.round.length}`),
      el("span", {}, `${state.category} · ${MODES[state.mode].label}`),
      el("button", { type: "button", class: "link", onclick: goHome }, "처음으로")),
    el("h2", { class: "question-text" }, q.question),
    renderModeTools(q, record),
    el("div", { class: "choices" }, q.choices.map((choice, index) => renderChoice(q, choice, index, record))),
    record ? renderFeedback(q, record, isLast) : null);
}

// 모드별 도구: 스피드 모드의 타이머, 힌트 모드의 힌트 버튼.
function renderModeTools(q, record) {
  const mode = MODES[state.mode];
  if (mode.timeLimit !== null && !record) {
    const left = remainingSeconds(state.timerStartedAt, Date.now(), mode.timeLimit);
    return el("p", { id: "timer", class: "timer", role: "timer" }, `남은 시간 ${left}초`);
  }
  if (mode.hint) {
    const used = state.removed.length > 0;
    return el("button", {
      type: "button",
      class: "hint-button",
      disabled: used || Boolean(record),
      onclick: useHint,
    }, used ? "힌트 사용함 (맞히면 0.5점)" : "힌트: 오답 2개 지우기 (맞히면 0.5점)");
  }
  return null;
}

function renderChoice(q, choice, index, record) {
  const removed = state.removed.includes(choice);
  let className = "choice";
  let mark = "";
  if (record && choice === q.answer) {
    className += " correct";
    mark = "✔ ";
  } else if (record && choice === record.chosen) {
    className += " wrong";
    mark = "✘ ";
  } else if (removed) {
    className += " removed";
  }
  const props = { type: "button", class: className, disabled: Boolean(record) || removed, onclick: () => answer(choice) };
  // 답하기 전에는 누를 수 있는 첫 보기에 포커스를 둡니다.
  const firstEnabled = q.choices.find((c) => !state.removed.includes(c));
  if (!record && choice === firstEnabled) props["data-focus"] = "";
  return el("button", props, mark, choice);
}

function renderFeedback(q, record, isLast) {
  let verdict = record.correct ? "정답입니다" : "오답입니다";
  if (record.timedOut) verdict = "시간 초과";
  return el("div", { class: `feedback ${record.correct ? "is-correct" : "is-wrong"}` },
    el("p", { class: "verdict" }, verdict),
    el("p", { class: "explanation" }, q.explanation),
    el("p", { class: "source" }, "출처: ",
      el("a", { href: q.source.url, target: "_blank", rel: "noopener noreferrer" }, q.source.title)),
    el("button", { type: "button", class: "primary", "data-focus": "", onclick: next }, isLast ? "결과 보기" : "다음"));
}

function renderResult() {
  const mode = MODES[state.mode];
  const score = scoreRound(state.records);
  const wrong = state.round.filter((q, i) => !state.records[i].correct);
  const hintsUsed = state.records.filter((r) => r.hintUsed).length;
  return el("section", { class: "screen result" },
    el("h1", {}, `${state.category} · ${mode.label} 결과`),
    el("p", { class: "score" }, `${formatScore(score)} / ${state.round.length}`),
    mode.hint ? el("p", { class: "lead" }, `힌트 ${hintsUsed}번 사용`) : null,
    renderSaveNotice(),
    wrong.length === 0
      ? el("p", {}, "모두 맞혔습니다!")
      : el("div", {},
        el("h3", {}, `틀린 문제 ${wrong.length}개`),
        el("ol", { class: "wrong-list" }, wrong.map((q) => el("li", {},
          el("p", { class: "wrong-q" }, q.question),
          el("p", {}, "정답: ", el("strong", {}, q.answer)),
          el("p", { class: "explanation" }, q.explanation))))),
    el("div", { class: "actions" },
      mode.retryWrong && wrong.length > 0
        ? el("button", { type: "button", onclick: retryWrong }, "틀린 문제 다시 풀기")
        : null,
      el("button", { type: "button", class: "primary", "data-focus": "", onclick: startRound }, "다시 하기"),
      el("button", { type: "button", onclick: goHome }, "처음으로")));
}

function renderSaveNotice() {
  const save = state.lastSave;
  if (save === null) return null;
  if (!save.ok) return el("p", { class: "notice notice-error" }, "기록을 저장할 수 없습니다");
  if (save.rank !== null) return el("p", { class: "notice notice-new" }, `새 기록! ${save.rank}위`);
  return null;
}

function renderLeaderboard() {
  const { ok, scores } = loadScores();
  return el("section", { class: "screen leaderboard" },
    el("div", { class: "topbar" },
      el("h1", {}, "순위표"),
      el("button", { type: "button", class: "link", onclick: goHome }, "처음으로")),
    el("p", { class: "lead" }, "스피드·힌트 모드로 끝낸 판의 상위 5개 기록입니다. 연습 모드는 기록하지 않습니다."),
    el("div", { class: "tabs" },
      CATEGORIES.map((category) => el("button", {
        type: "button",
        class: "tab",
        "aria-pressed": String(category === state.boardCategory),
        onclick: () => { state.boardCategory = category; render(); },
      }, category))),
    ok
      ? el("div", { class: "boards" }, RANKED_MODES.map((mode) => renderBoard(scores, state.boardCategory, mode)))
      : el("p", { class: "notice notice-error" }, "기록을 저장할 수 없습니다"),
    ok
      ? el("div", { class: "actions" },
        el("button", { type: "button", onclick: clearAllScores }, "기록 모두 지우기"))
      : null);
}

function renderBoard(scores, category, mode) {
  const rows = topScores(scores, category, mode);
  const showHints = MODES[mode].hint;
  return el("section", { class: "board" },
    el("h3", {}, `${MODES[mode].label} 모드`),
    rows.length === 0
      ? el("p", { class: "empty" }, "아직 기록이 없습니다")
      : el("table", {},
        el("thead", {}, el("tr", {},
          el("th", { scope: "col" }, "순위"),
          el("th", { scope: "col" }, "점수"),
          showHints ? el("th", { scope: "col" }, "힌트") : null,
          el("th", { scope: "col" }, "날짜"))),
        el("tbody", {}, rows.map((row, i) => el("tr", {},
          el("td", {}, `${i + 1}위`),
          el("td", {}, `${formatScore(row.score)} / ${QUESTIONS_PER_ROUND}`),
          showHints ? el("td", {}, `${row.hintsUsed}번`) : null,
          el("td", {}, formatDate(row.date)))))));
}

function renderError() {
  return el("section", { class: "screen error" },
    el("h1", {}, "문항 자료에 오류가 있습니다"),
    el("p", {}, "questions.js를 고친 뒤 새로고침하세요."),
    el("ul", {}, state.errors.map((message) => el("li", {}, message))));
}

const SCREENS = {
  start: renderStart,
  question: renderQuestion,
  result: renderResult,
  leaderboard: renderLeaderboard,
  error: renderError,
};

function render() {
  const app = document.getElementById("app");
  app.replaceChildren(SCREENS[state.screen]());
  const focusTarget = app.querySelector("[data-focus]");
  if (focusTarget) focusTarget.focus();
}

// ===== 시작 =====
function init() {
  state.errors = typeof QUESTIONS === "undefined"
    ? ["questions.js를 불러오지 못했습니다."]
    : validateQuestions(QUESTIONS);
  if (state.errors.length > 0) {
    console.error("문항 자료 오류:", state.errors);
    state.screen = "error";
  }
  render();
}

init();
