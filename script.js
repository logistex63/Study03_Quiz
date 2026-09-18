"use strict";

// ===== 설정 =====
const CATEGORIES = ["한국사", "세계지리", "과학", "예술과 문화"];
const QUESTIONS_PER_ROUND = 10;

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

function gradeAnswer(question, chosen) {
  const correct = chosen === question.answer;
  return { questionId: question.id, chosen, correct, points: correct ? 1 : 0 };
}

function scoreRound(records) {
  return records.reduce((sum, record) => sum + record.points, 0);
}

function formatScore(score) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

// ===== 상태 =====
const state = {
  screen: "start", // start | question | result | error
  errors: [],
  category: CATEGORIES[0],
  round: [], // 이번 판 문항(섞은 복사본)
  index: 0, // 지금 풀고 있는 문항 번호(0부터)
  records: [], // records[i]가 있으면 i번 문항은 답을 고른 상태
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

// ===== 화면 =====
function renderError() {
  return el("section", { class: "screen error" },
    el("h1", {}, "문항 자료에 오류가 있습니다"),
    el("p", {}, "questions.js를 고친 뒤 새로고침하세요."),
    el("ul", {}, state.errors.map((message) => el("li", {}, message))));
}

const SCREENS = {
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
