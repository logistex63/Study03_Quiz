# 상식 퀴즈 웹 앱 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**목표:** 브라우저에서 `index.html`을 열면 동작하는 4지선다 상식 퀴즈(4개 카테고리 × 10문제)를 3단계로 만듭니다. 1단계는 기본 퀴즈와 점수, 2단계는 게임 모드 3개, 3단계는 점수 저장과 순위표입니다.

**구조:** `script.js`에 상태 객체 `state` 하나와 화면별 그리기 함수를 둡니다. 사용자가 무언가를 하면 `state`를 바꾸고 `render()`가 `#app`을 다시 그립니다. 모드별 차이는 `MODES` 설정표 한 곳에 모읍니다. 계산만 하는 함수(섞기, 채점, 자료 검사, 순위 정렬)는 화면과 분리해서 브라우저 콘솔에서 바로 확인할 수 있게 합니다.

**기술:** HTML, CSS, 순수 JavaScript(ES2020). 라이브러리, 빌드 도구, 서버는 쓰지 않습니다.

**설계 문서:** [`PRD.md`](PRD.md). 이 계획은 PRD를 근거로 합니다. 실행하는 사람은 둘 다 읽습니다.

## 전체 제약

모든 과제에 적용됩니다.

- 앱 파일은 `index.html`, `style.css`, `script.js`, `questions.js` 4개뿐입니다. 테스트 파일은 만들지 않습니다(사용자 결정). 프로젝트 폴더에는 이 밖에 `PRD.md`, `IMPL-PLAN.md`, `.git`만 둡니다.
- `file://`에서 동작해야 합니다. `<script type="module">`, `fetch`, `import`를 쓰지 않습니다. 스크립트는 `<body>` 끝에서 `questions.js` → `script.js` 순서로 일반 `<script src>`로 불러옵니다.
- 화면에 글자를 넣을 때는 `textContent`나 `el()` 도우미만 씁니다. `innerHTML`은 쓰지 않습니다.
- 폭 360px에서 가로 스크롤이 없어야 합니다.
- 정답과 오답은 색과 함께 ✔/✘ 기호로도 구분합니다.
- 문항 규칙(PRD 5.4): 정답은 하나만, 기준에 따라 답이 달라지는 문항은 기준과 시점을 문제에 적음, 해설은 한 줄, 출처는 실제로 열어 확인한 것만 적음.
- localStorage 키는 `quiz.scores` 하나입니다. 읽기와 쓰기는 모두 `try/catch` 안에서 합니다.

## 확인 방법

테스트 파일이 없으므로 각 과제는 다음 순서로 확인합니다.

1. **실패 확인**: 구현하기 전에 브라우저 콘솔에서 확인 코드를 실행해 실패(`ReferenceError` 등)를 봅니다.
2. **구현**
3. **통과 확인**: 같은 확인 코드를 다시 실행해 모든 값이 `true`인지 봅니다. 화면 동작은 직접 눌러 봅니다.

브라우저는 Claude 앱의 브라우저 창에서 `file:///C:/Users/logistex/study03_quiz/index.html`을 엽니다. 파일을 고친 뒤에는 같은 주소로 다시 이동해서 새로 불러옵니다. 확인 코드는 콘솔(javascript 실행 도구)에 그대로 붙여 넣습니다. 브라우저 창에서 `file://` 주소가 열리지 않으면 사용자에게 `index.html`을 더블클릭해 열고 개발자 도구 콘솔에 붙여 넣어 달라고 요청합니다.

각 단계 끝의 **사용자 확인** 항목은 사용자가 직접 브라우저에서 확인합니다. 사용자가 확인했다고 말하기 전에는 다음 단계로 넘어가지 않습니다.

## 파일 지도

| 파일 | 맡는 일 | 만드는 과제 | 고치는 과제 |
|---|---|---|---|
| `index.html` | 틀, `#app`, 스크립트 불러오기 | 1 | 없음 |
| `style.css` | 모든 화면의 모양 | 1 | 5, 6, 7, 10 |
| `questions.js` | `QUESTIONS` 배열(40문항) | 1(빈 배열) | 2 |
| `script.js` | 설정, 계산 함수, 상태, 화면, 이벤트 | 1 | 3, 5–10 |

`script.js`는 위에서부터 다음 구역으로 나눕니다. 새 코드는 알맞은 구역 끝에 넣습니다.

```
// ===== 설정 =====
// ===== 계산 함수 =====
// ===== 저장소 =====        (8에서 추가)
// ===== 상태 =====
// ===== DOM 도우미 =====
// ===== 동작 =====
// ===== 화면 =====
// ===== 시작 =====
```

## 함수 한눈에 보기

| 이름 | 모양 | 처음 만드는 과제 |
|---|---|---|
| `isFilled(value)` | → boolean. 공백이 아닌 글자가 있는 문자열인지 | 1 |
| `shuffle(items, random = Math.random)` | → 새 배열(원본은 그대로) | 1 |
| `validateQuestions(questions)` | → 오류 문장 배열(없으면 `[]`) | 1 |
| `buildRound(category, questions, random = Math.random)` | → 그 카테고리 문항을 섞고 보기도 섞은 새 배열 | 1 |
| `gradeAnswer(question, chosen, hintUsed = false)` | → `{ questionId, chosen, correct, timedOut, hintUsed, points }`. `chosen === null`은 시간 초과 | 1, 5에서 확장 |
| `scoreRound(records)` | → 점수 합 | 1 |
| `formatScore(score)` | → `"7"` 또는 `"7.5"` | 1 |
| `remainingSeconds(startedAt, now, limit)` | → 남은 초(0 이상 정수) | 6 |
| `pickHintRemovals(question, random = Math.random)` | → 지울 오답 2개 | 7 |
| `compareScores(a, b)`, `isValidScore(entry)`, `parseScores(raw)`, `topScores(scores, category, mode)`, `addScore(scores, entry)`, `rankOf(scores, entry)`, `formatDate(iso)` | 순위표 계산 | 8 |
| `loadScores()`, `saveScores(scores)`, `clearScores()` | localStorage 읽기, 쓰기, 지우기 | 8 |
| `el(tag, props, ...children)` | DOM 요소 만들기 | 1 |
| `render()` | `SCREENS[state.screen]()`로 `#app`을 다시 그림 | 1 |

---

# 1단계: 기본 퀴즈와 점수

**만들 것**
- 파일 4개의 뼈대와 문항 자료 검사
- 출처를 확인한 40문항(카테고리마다 10문항)
- 시작 화면(카테고리 선택), 문제 화면(즉시 정답 여부, 해설, 출처), 결과 화면(점수, 틀린 문제, 다시 하기)
- 모드는 아직 없습니다. 시간 제한과 힌트 없이 맞히면 1점입니다.

**완료 기준**
- 앱을 열 때 자료 검사 오류가 0건이고 콘솔 오류가 없습니다.
- 과제 1, 3의 콘솔 확인 코드가 모두 `true`입니다.
- 사용자가 40문항 검토표를 승인했습니다.
- 아래 사용자 확인 항목을 사용자가 모두 확인했습니다.

**사용자 확인 (브라우저에서 직접)**
1. 탐색기에서 `index.html`을 더블클릭하면 "상식 퀴즈" 시작 화면이 나온다.
2. 카테고리 4개 각각에 대해: 고르고 [시작]을 누르면 "1 / 10"부터 "10 / 10"까지 10문제가 나오고, 같은 문제가 두 번 나오지 않는다.
3. 보기를 누르면 곧바로 보기가 잠기고, 정답 보기에 ✔(초록), 내가 고른 오답에 ✘(빨강)가 붙고, "정답입니다/오답입니다", 한 줄 해설, 출처 링크가 나온다.
4. 출처 링크를 누르면 새 탭에서 열린다.
5. [다음]을 눌러야 넘어가고, 10번째 문제에서는 버튼이 [결과 보기]다.
6. 결과 화면의 점수가 내가 맞힌 개수와 같고, 틀린 문제 목록에 문제, 정답, 해설이 나온다.
7. [다시 하기]를 누르면 같은 카테고리가 다른 순서(문제와 보기 모두)로 나온다.
8. 문제 도중 [처음으로]를 누르면 시작 화면으로 돌아간다.
9. 창을 휴대폰 폭만큼 좁혀도 가로 스크롤이 생기지 않는다.

---

### 과제 0: git 저장소 만들기

**파일:** 없음(폴더 설정)

- [ ] **1단계: 저장소 만들기**

```bash
git init
```

- [ ] **2단계: 커밋할 이름과 메일이 있는지 확인**

```bash
git config user.name
```

```bash
git config user.email
```

둘 중 하나라도 비어 있으면 멈추고 사용자에게 어떤 이름과 메일로 커밋할지 묻습니다. 사용자가 알려 준 값으로 이 저장소에만 설정합니다(`git config user.name "…"`, `git config user.email "…"`, `--global` 없이).

- [ ] **3단계: 문서 커밋**

```bash
git add PRD.md IMPL-PLAN.md
```

```bash
git commit -m "docs: 상식 퀴즈 PRD와 구현 계획 추가" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### 과제 1: 뼈대, 계산 함수, 자료 검사

**파일:**
- 만들기: `index.html`, `style.css`, `questions.js`, `script.js`

**인터페이스:**
- 사용: 없음
- 제공: 위 "함수 한눈에 보기"의 과제 1 함수들, `CATEGORIES`, `QUESTIONS_PER_ROUND`, `state`, `SCREENS`, `el`, `render`. 이 과제의 `gradeAnswer`는 `{ questionId, chosen, correct, points }`만 돌려줍니다(과제 5에서 확장).

- [ ] **1단계: `index.html` 만들기**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>상식 퀴즈</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main id="app"></main>
  <script src="questions.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

- [ ] **2단계: `questions.js`를 빈 배열로 만들기** (과제 2에서 채움)

```js
// 문항 자료. 형식과 규칙은 PRD.md 5절을 따릅니다.
const QUESTIONS = [];
```

- [ ] **3단계: `script.js`를 빈 파일로 만들고 실패 확인**

`script.js`에는 `"use strict";` 한 줄만 적습니다. 브라우저에서 `index.html`을 열고 콘솔에서 아래 확인 코드를 실행합니다.

```js
(() => {
  let seed = 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const q = { id: "t-1", category: "과학", question: "Q", choices: ["가", "나", "다", "라"], answer: "다", explanation: "E", source: { title: "S", url: "https://example.com" } };
  const round = buildRound("과학", [q, { ...q, id: "t-2", category: "한국사" }], rnd);
  const original = [1, 2, 3];
  shuffle(original, rnd);
  return {
    shuffleKeepsItems: shuffle([1, 2, 3, 4, 5], rnd).sort().join() === "1,2,3,4,5",
    shuffleDoesNotMutate: original.join() === "1,2,3",
    roundFilters: round.length === 1 && round[0].id === "t-1",
    roundKeepsAnswer: round[0].choices.length === 4 && round[0].choices.includes("다") && round[0].answer === "다",
    roundCopiesQuestion: round[0] !== q,
    gradeCorrect: gradeAnswer(q, "다").correct === true && gradeAnswer(q, "다").points === 1,
    gradeWrong: gradeAnswer(q, "가").correct === false && gradeAnswer(q, "가").points === 0,
    score: scoreRound([{ points: 1 }, { points: 0.5 }, { points: 0 }]) === 1.5,
    format: formatScore(7) === "7" && formatScore(7.5) === "7.5",
    filled: isFilled(" a ") && !isFilled("  ") && !isFilled(3),
    validEmpty: validateQuestions([]).length === 4,
    validBad: validateQuestions([{ ...q, choices: ["가", "가", "나", "라"], answer: "마" }]).length === 6,
    validMissingSource: validateQuestions([{ ...q, source: { title: "", url: "" } }]).some((e) => e.includes("출처")),
  };
})()
```

기대 결과: `ReferenceError: buildRound is not defined`

- [ ] **4단계: `script.js` 작성**

```js
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
```

- [ ] **5단계: `style.css` 작성**

```css
:root {
  --bg: #f7f7f5;
  --surface: #ffffff;
  --text: #1f2328;
  --muted: #5b636e;
  --border: #d5d9de;
  --accent: #2f5bd3;
  --accent-text: #ffffff;
  --correct: #1f7a3d;
  --correct-bg: #e6f4ea;
  --wrong: #b3261e;
  --wrong-bg: #fce8e6;
  --radius: 10px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #16181c;
    --surface: #1f2228;
    --text: #e8eaed;
    --muted: #a0a7b1;
    --border: #3a3f47;
    --accent: #7ea2ff;
    --accent-text: #0d1220;
    --correct: #7bd88f;
    --correct-bg: #1d3325;
    --wrong: #ff8a80;
    --wrong-bg: #3b1f1d;
  }
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
  line-height: 1.6;
}

#app { max-width: 640px; margin: 0 auto; padding: 24px 16px 48px; }

h1 { font-size: 1.75rem; margin: 0 0 8px; }
h2 { font-size: 1.25rem; margin: 16px 0; }
h3 { font-size: 1.05rem; margin: 24px 0 8px; }
a { color: var(--accent); }

button {
  font: inherit;
  color: inherit;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 16px;
  cursor: pointer;
}
button:disabled { cursor: default; }
button:focus-visible, input:focus-visible, a:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}
button.primary { background: var(--accent); color: var(--accent-text); border-color: var(--accent); font-weight: 600; }
button.link { background: none; border: none; padding: 4px; color: var(--accent); text-decoration: underline; }

.lead { color: var(--muted); }

.options {
  margin: 16px 0;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}
.options legend { font-weight: 600; padding: 0 4px; }
.option { display: flex; align-items: flex-start; gap: 8px; padding: 6px 0; cursor: pointer; }
.option input { margin-top: 0.4em; }

.topbar { display: flex; align-items: center; gap: 12px; color: var(--muted); flex-wrap: wrap; }
.topbar .link { margin-left: auto; }

.choices { display: grid; gap: 10px; }
.choice { width: 100%; text-align: left; overflow-wrap: anywhere; }
.choice:not(:disabled):hover { border-color: var(--accent); }
.choice.correct { background: var(--correct-bg); border-color: var(--correct); color: var(--correct); font-weight: 600; }
.choice.wrong { background: var(--wrong-bg); border-color: var(--wrong); color: var(--wrong); }

.feedback {
  margin-top: 16px;
  padding: 12px 16px;
  border-left: 4px solid;
  border-radius: var(--radius);
  background: var(--surface);
}
.feedback.is-correct { border-color: var(--correct); }
.feedback.is-wrong { border-color: var(--wrong); }
.verdict { margin: 0 0 4px; font-weight: 700; }
.feedback.is-correct .verdict { color: var(--correct); }
.feedback.is-wrong .verdict { color: var(--wrong); }
.explanation { margin: 0 0 4px; }
.source { margin: 0 0 12px; font-size: 0.9rem; color: var(--muted); overflow-wrap: anywhere; }

.score { margin: 8px 0; font-size: 2.5rem; font-weight: 700; }
.wrong-list { padding-left: 1.25rem; }
.wrong-list li { margin-bottom: 12px; }
.wrong-list p { margin: 0; }

.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }

.error ul { color: var(--wrong); }
```

- [ ] **6단계: 통과 확인**

브라우저에서 새로 불러오고 3단계의 확인 코드를 다시 실행합니다.

기대 결과: 모든 값이 `true`. 화면에는 "문항 자료에 오류가 있습니다"와 오류 4줄(카테고리마다 "문항이 0개입니다")이 나오고, 콘솔에는 `문항 자료 오류:`가 한 번 찍힙니다. 그 밖의 콘솔 오류는 없어야 합니다.

- [ ] **7단계: 커밋**

```bash
git add index.html style.css questions.js script.js
```

```bash
git commit -m "feat: 퀴즈 뼈대와 문항 자료 검사 추가" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### 과제 2: 40문항 작성과 출처 확인

**파일:**
- 고치기: `questions.js`

**인터페이스:**
- 사용: 과제 1의 `validateQuestions`(앱을 열 때 자동으로 실행됨)
- 제공: `QUESTIONS` 40개. id는 `kh-01`~`kh-10`(한국사), `wg-01`~`wg-10`(세계지리), `sc-01`~`sc-10`(과학), `ac-01`~`ac-10`(예술과 문화)

이 과제는 코드가 아니라 내용 작업입니다. 아래 절차를 문항마다 따릅니다.

- [ ] **1단계: 규칙 확인용 코드 실행(실패 확인)**

콘솔에서 실행합니다.

```js
(() => {
  const errors = validateQuestions(QUESTIONS);
  const perCategory = Object.fromEntries(CATEGORIES.map((c) => [c, QUESTIONS.filter((q) => q.category === c).length]));
  // 기준이 필요한 말이 있는데 기준이나 연도가 안 보이는 문항(사람이 다시 볼 후보)
  const needsBasis = QUESTIONS
    .filter((q) => /가장|최초|처음|최대|최소|제일|첫 번째|몇 번째/.test(q.question) && !/기준|\d{4}년/.test(q.question))
    .map((q) => q.id);
  // 해설이 한 줄을 넘는 문항
  const longExplanations = QUESTIONS
    .filter((q) => q.explanation.length > 80 || q.explanation.includes("\n"))
    .map((q) => q.id);
  const badUrls = QUESTIONS.filter((q) => !/^https:\/\//.test(q.source.url)).map((q) => q.id);
  return { errors, perCategory, needsBasis, longExplanations, badUrls };
})()
```

기대 결과(지금): `errors`에 "문항이 0개입니다" 4줄

- [ ] **2단계: 카테고리마다 10문항 쓰기**

문항마다 다음을 지킵니다.

1. **난이도**: 대학 1학년이 교양으로 알 만한 수준. 고등학교 교과서나 일반 교양서에 나오는 내용을 중심으로 합니다. 지나치게 사소한 숫자나 날짜 맞히기는 피합니다.
2. **정답은 하나만**: 오답 3개는 분명히 틀려야 합니다. 같은 뜻의 다른 이름(예: 옛 이름과 새 이름)이 보기에 함께 들어가지 않게 합니다. "모두 정답", "정답 없음", "위의 것 모두"는 쓰지 않습니다.
3. **기준과 시점**: 「가장 ~한」, 「최초」, 순위, 수치, 현재 상태(수도, 인구, 최고 기록 등)를 묻는 문항은 문제에 기준과 시점을 적습니다. 예: "2024년 기준", "면적 기준", "유네스코 세계유산 등재 기준".
4. **출처 확인**: 웹 검색으로 출처를 찾고 **그 페이지를 실제로 열어** 정답과 해설 내용이 적혀 있는지 확인합니다. 확인한 페이지의 이름을 `source.title`에, 주소를 `source.url`에 적습니다. 우선할 출처는 한국민족문화대백과사전, 우리역사넷(국사편찬위원회), 국립중앙박물관, 브리태니커, 정부·공공기관, 대학·학술 기관, NASA 등입니다. 위키백과는 다른 출처로 교차 확인했을 때만 씁니다. `https://` 주소만 씁니다.
5. **확인이 안 되면 버림**: 출처가 정답과 다르거나, 출처끼리 말이 다르거나, 페이지를 열 수 없으면 그 문항을 버리고 다른 문항을 씁니다.
6. **해설**: 80자 안의 한 줄로, 왜 그것이 정답인지 적습니다.
7. **보기 길이**: 정답만 유난히 길거나 짧지 않게 보기 4개의 길이와 형식을 비슷하게 맞춥니다.

형식(PRD 5.1):

```js
// 문항 자료. 형식과 규칙은 PRD.md 5절을 따릅니다.
const QUESTIONS = [
  {
    id: "kh-01",
    category: "한국사",
    question: "(문제)",
    choices: ["(보기1)", "(보기2)", "(보기3)", "(보기4)"],
    answer: "(choices 중 하나와 똑같은 글자)",
    explanation: "(한 줄 해설)",
    source: { title: "(확인한 출처 이름)", url: "https://…" },
  },
  // kh-02 … ac-10
];
```

위의 괄호는 형식 설명일 뿐이고, 실제 파일에는 확인한 내용만 넣습니다.

- [ ] **3단계: 규칙 확인 코드 다시 실행(통과 확인)**

브라우저를 새로 불러와 1단계 코드를 실행합니다.

기대 결과: `errors: []`, `perCategory`가 모두 10, `longExplanations: []`, `badUrls: []`. `needsBasis`에 나온 id가 있으면 그 문항을 다시 읽고 기준을 적거나, 기준이 필요 없는 이유(예: "최초의 한글 소설"처럼 학계 통설로 굳은 사실)를 검토표 비고에 적습니다. 자료 검사를 통과하면 `state.screen`이 `"start"`로 남는데, 시작 화면은 과제 3에서 만들므로 이 시점에는 화면이 비고 콘솔에 `TypeError: SCREENS[state.screen] is not a function`이 한 번 나옵니다. 이 오류만은 정상이며 과제 3에서 사라집니다. 그 밖의 콘솔 오류는 없어야 합니다.

- [ ] **4단계: 사용자 검토 받기**

아래 형식의 표를 카테고리별로 대화창에 보여 주고 사용자에게 검토를 요청합니다.

| id | 문제 | 정답 | 출처 | 비고 |
|---|---|---|---|---|

사용자가 고치라고 한 문항을 고치고 3단계를 다시 실행합니다. 사용자가 승인하기 전에는 커밋하지 않습니다.

- [ ] **5단계: 커밋**

```bash
git add questions.js
```

```bash
git commit -m "feat: 출처를 확인한 40문항 추가" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### 과제 3: 시작, 문제, 결과 화면

**파일:**
- 고치기: `script.js` (동작, 화면 구역과 `SCREENS`)

**인터페이스:**
- 사용: `buildRound`, `gradeAnswer`, `scoreRound`, `formatScore`, `el`, `render`, `state`, `QUESTIONS`
- 제공: 동작 함수 `startRound()`, `beginRound(round)`, `answer(choice)`, `next()`, `goHome()`. 화면 함수 `renderStart()`, `renderQuestion()`, `renderChoice(q, choice, index, record)`, `renderFeedback(q, record, isLast)`, `renderResult()`. 버튼 클래스 `choice`, `correct`, `wrong`, `primary`, `link`

- [ ] **1단계: 실패 확인**

콘솔에서 실행합니다.

```js
(() => {
  const clickText = (text) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === text).click();
  const out = {};
  out.startScreen = document.querySelector("h1")?.textContent === "상식 퀴즈";
  document.querySelector('input[value="과학"]').click();
  clickText("시작");
  out.progress = document.querySelector(".progress").textContent === "1 / 10";
  out.fourChoices = document.querySelectorAll(".choice").length === 4;
  const q = state.round[0];
  const wrongChoice = q.choices.find((c) => c !== q.answer);
  [...document.querySelectorAll(".choice")].find((b) => b.textContent === wrongChoice).click();
  out.locked = [...document.querySelectorAll(".choice")].every((b) => b.disabled);
  out.marksCorrect = document.querySelector(".choice.correct").textContent === `✔ ${q.answer}`;
  out.marksWrong = document.querySelector(".choice.wrong").textContent === `✘ ${wrongChoice}`;
  out.verdict = document.querySelector(".verdict").textContent === "오답입니다";
  out.explanation = document.querySelector(".explanation").textContent === q.explanation;
  out.sourceLink = document.querySelector(".source a").href.startsWith("https://") && document.querySelector(".source a").target === "_blank";
  out.nextFocused = document.activeElement.textContent === "다음";
  for (let i = 1; i < 10; i += 1) {
    clickText("다음");
    const cur = state.round[i];
    [...document.querySelectorAll(".choice")].find((b) => b.textContent === cur.answer).click();
  }
  out.lastButton = document.querySelector(".feedback button").textContent === "결과 보기";
  out.uniqueIds = new Set(state.round.map((x) => x.id)).size === 10;
  clickText("결과 보기");
  out.score = document.querySelector(".score").textContent === "9 / 10";
  out.wrongListed = document.querySelectorAll(".wrong-list li").length === 1;
  const firstIds = state.round.map((x) => x.id).join();
  clickText("다시 하기");
  out.restarted = document.querySelector(".progress").textContent === "1 / 10" && state.category === "과학";
  out.reshuffled = state.round.map((x) => x.id).join() !== firstIds; // 같을 확률은 1/3628800
  clickText("처음으로");
  out.home = document.querySelector("h1").textContent === "상식 퀴즈";
  return out;
})()
```

기대 결과: `TypeError`(시작 화면이 없어 `document.querySelector('input[value="과학"]')`가 `null`)

- [ ] **2단계: 동작 함수 작성**

`// ===== 동작 =====` 아래에 넣습니다.

```js
function startRound() {
  beginRound(buildRound(state.category, QUESTIONS));
}

function beginRound(round) {
  state.round = round;
  state.index = 0;
  state.records = [];
  state.screen = "question";
  render();
}

function answer(choice) {
  if (state.records[state.index]) return; // 이미 답한 문항
  state.records[state.index] = gradeAnswer(state.round[state.index], choice);
  render();
}

function next() {
  if (state.index < state.round.length - 1) {
    state.index += 1;
  } else {
    state.screen = "result";
  }
  render();
}

function goHome() {
  state.screen = "start";
  render();
}
```

- [ ] **3단계: 화면 함수 작성**

`// ===== 화면 =====`의 `renderError` 위에 넣습니다.

```js
function renderStart() {
  return el("section", { class: "screen start" },
    el("h1", {}, "상식 퀴즈"),
    el("p", { class: "lead" }, "카테고리를 고르고 시작하세요. 한 판은 10문제입니다."),
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
    el("button", { type: "button", class: "primary", "data-focus": "", onclick: startRound }, "시작"));
}

function renderQuestion() {
  const q = state.round[state.index];
  const record = state.records[state.index];
  const isLast = state.index === state.round.length - 1;
  return el("section", { class: "screen question" },
    el("div", { class: "topbar" },
      el("span", { class: "progress" }, `${state.index + 1} / ${state.round.length}`),
      el("span", {}, state.category),
      el("button", { type: "button", class: "link", onclick: goHome }, "처음으로")),
    el("h2", { class: "question-text" }, q.question),
    el("div", { class: "choices" }, q.choices.map((choice, index) => renderChoice(q, choice, index, record))),
    record ? renderFeedback(q, record, isLast) : null);
}

function renderChoice(q, choice, index, record) {
  let className = "choice";
  let mark = "";
  if (record && choice === q.answer) {
    className += " correct";
    mark = "✔ ";
  } else if (record && choice === record.chosen) {
    className += " wrong";
    mark = "✘ ";
  }
  const props = { type: "button", class: className, disabled: Boolean(record), onclick: () => answer(choice) };
  if (!record && index === 0) props["data-focus"] = "";
  return el("button", props, mark, choice);
}

function renderFeedback(q, record, isLast) {
  return el("div", { class: `feedback ${record.correct ? "is-correct" : "is-wrong"}` },
    el("p", { class: "verdict" }, record.correct ? "정답입니다" : "오답입니다"),
    el("p", { class: "explanation" }, q.explanation),
    el("p", { class: "source" }, "출처: ",
      el("a", { href: q.source.url, target: "_blank", rel: "noopener noreferrer" }, q.source.title)),
    el("button", { type: "button", class: "primary", "data-focus": "", onclick: next }, isLast ? "결과 보기" : "다음"));
}

function renderResult() {
  const score = scoreRound(state.records);
  const wrong = state.round.filter((q, i) => !state.records[i].correct);
  return el("section", { class: "screen result" },
    el("h1", {}, `${state.category} 결과`),
    el("p", { class: "score" }, `${formatScore(score)} / ${state.round.length}`),
    wrong.length === 0
      ? el("p", {}, "모두 맞혔습니다!")
      : el("div", {},
        el("h3", {}, `틀린 문제 ${wrong.length}개`),
        el("ol", { class: "wrong-list" }, wrong.map((q) => el("li", {},
          el("p", { class: "wrong-q" }, q.question),
          el("p", {}, "정답: ", el("strong", {}, q.answer)),
          el("p", { class: "explanation" }, q.explanation))))),
    el("div", { class: "actions" },
      el("button", { type: "button", class: "primary", "data-focus": "", onclick: startRound }, "다시 하기"),
      el("button", { type: "button", onclick: goHome }, "처음으로")));
}
```

- [ ] **4단계: `SCREENS` 바꾸기**

```js
const SCREENS = {
  start: renderStart,
  question: renderQuestion,
  result: renderResult,
  error: renderError,
};
```

- [ ] **5단계: 통과 확인**

새로 불러온 뒤 1단계 코드를 실행합니다. 기대 결과: 모든 값이 `true`. 콘솔 오류가 없어야 합니다.

그다음 브라우저 창 폭을 360px로 줄여(창 크기 도구의 mobile 설정) 시작, 문제, 결과 화면에서 콘솔로 `document.documentElement.scrollWidth <= window.innerWidth`가 `true`인지 확인하고, 폭을 원래대로 돌립니다.

- [ ] **6단계: 커밋**

```bash
git add script.js
```

```bash
git commit -m "feat: 시작, 문제, 결과 화면과 즉시 해설 추가" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **7단계: 1단계 마무리**

사용자에게 위 "1단계 사용자 확인" 9개 항목을 보여 주고 직접 확인해 달라고 요청합니다. 문제가 나오면 고치고 해당 과제의 확인 코드를 다시 실행합니다. 사용자가 확인했다고 하면 태그를 답니다.

```bash
git tag stage-1
```

---

# 2단계: 게임 모드 3개

**만들 것**
- 시작 화면의 모드 선택(연습, 스피드, 힌트). 1단계의 기본 퀴즈는 이 3개로 대체됩니다.
- 연습 모드: 시간 제한과 감점 없음, 결과 화면의 [틀린 문제 다시 풀기]
- 스피드 모드: 문항당 15초, 시간이 다 되면 오답("시간 초과"), 해설을 읽는 동안 멈춤
- 힌트 모드: 문항당 한 번 오답 2개를 지우는 힌트, 쓰고 맞히면 0.5점

**완료 기준**
- 과제 5, 6, 7의 콘솔 확인 코드가 모두 `true`입니다.
- 1단계의 과제 3 확인 코드를 모드 선택에 맞게 다시 돌려도(과제 5의 3단계 참고) 모두 `true`입니다.
- 콘솔 오류가 없습니다.
- 아래 사용자 확인 항목을 사용자가 모두 확인했습니다.

**사용자 확인 (브라우저에서 직접)**
1. 시작 화면에 카테고리 4개와 모드 3개(연습, 스피드, 힌트)가 있고, 모드마다 한 줄 설명이 있다.
2. 문제 화면 위쪽에 카테고리와 모드 이름이 함께 보인다.
3. **연습 모드**: 시간 표시와 힌트 버튼이 없다. 끝나면 점수가 나오고, 틀린 문제가 있으면 [틀린 문제 다시 풀기]가 있다. 누르면 틀린 문제만 "1 / (틀린 개수)"로 다시 나온다. 모두 맞히면 그 버튼이 사라진다.
4. **스피드 모드**: "남은 시간 15초"부터 1초씩 줄어든다. 아무것도 누르지 않으면 0초에서 "시간 초과"와 함께 정답, 해설, 출처가 나온다. 해설을 보는 동안에는 시간이 줄지 않고, [다음]을 누르면 다시 15초부터 센다.
5. **스피드 모드**: 문제를 풀다 다른 탭에 5초쯤 갔다 오면, 남은 시간도 그만큼 줄어 있다.
6. **스피드 모드**: 문제 도중 [처음으로]를 누르고 가만히 있어도, 나중에 "시간 초과"가 튀어나오지 않는다.
7. **힌트 모드**: [힌트]를 누르면 오답 2개가 흐려지고 줄이 그어지며 누를 수 없다. 정답은 절대 지워지지 않는다. 힌트 버튼은 한 문항에 한 번만 눌린다.
8. **힌트 모드**: 힌트를 쓰고 맞힌 문제는 0.5점이다. 예를 들어 힌트 없이 7개, 힌트 쓰고 2개 맞히면 "8 / 10"이고, 결과 화면에 "힌트 2번 사용"이 나온다.
9. 좁은 창에서도 가로 스크롤이 없다.

---

### 과제 5: 모드 설정표, 모드 선택, 연습 모드

**파일:**
- 고치기: `script.js`, `style.css`

**인터페이스:**
- 사용: 과제 1, 3의 모든 함수
- 제공: `MODES`(키 `practice`, `speed`, `hint`, 값 `{ label, description, timeLimit, hint, ranked, retryWrong }`), `state.mode`, `retryWrong()`, `renderModeTools(q, record)`(이 과제에서는 `null`만 돌려줌. 과제 6, 7에서 바꿈). `gradeAnswer(question, chosen, hintUsed = false)`가 `{ questionId, chosen, correct, timedOut, hintUsed, points }`를 돌려줌(`chosen === null`이면 `timedOut: true`, 맞히면 힌트 사용 시 0.5점, 아니면 1점)

- [ ] **1단계: 실패 확인**

```js
(() => {
  const q = { id: "t-1", answer: "다" };
  const clickText = (text) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === text).click();
  const out = {};
  out.modes = Object.keys(MODES).join() === "practice,speed,hint";
  out.modeFlags = MODES.practice.ranked === false && MODES.speed.timeLimit === 15 && MODES.hint.hint === true && MODES.practice.retryWrong === true;
  out.gradeHint = gradeAnswer(q, "다", true).points === 0.5 && gradeAnswer(q, "다", true).hintUsed === true;
  out.gradeNoHint = gradeAnswer(q, "다").points === 1 && gradeAnswer(q, "다").hintUsed === false;
  out.gradeTimeout = gradeAnswer(q, null).timedOut === true && gradeAnswer(q, null).points === 0;
  out.gradeWrongHint = gradeAnswer(q, "가", true).points === 0;
  out.modeRadios = document.querySelectorAll('input[name="mode"]').length === 3;
  document.querySelector('input[value="한국사"]').click();
  document.querySelector('input[value="practice"]').click();
  clickText("시작");
  out.topbarShowsMode = document.querySelector(".topbar").textContent.includes("한국사 · 연습");
  // 앞 3문제는 틀리고 나머지는 맞힘
  for (let i = 0; i < 10; i += 1) {
    const cur = state.round[i];
    const pick = i < 3 ? cur.choices.find((c) => c !== cur.answer) : cur.answer;
    [...document.querySelectorAll(".choice")].find((b) => b.textContent === pick).click();
    clickText(i < 9 ? "다음" : "결과 보기");
  }
  out.practiceScore = document.querySelector(".score").textContent === "7 / 10";
  const wrongIds = state.round.slice(0, 3).map((x) => x.id).sort().join();
  clickText("틀린 문제 다시 풀기");
  out.retryOnlyWrong = state.round.length === 3 && state.round.map((x) => x.id).sort().join() === wrongIds;
  out.retryProgress = document.querySelector(".progress").textContent === "1 / 3";
  for (let i = 0; i < 3; i += 1) {
    const cur = state.round[i];
    [...document.querySelectorAll(".choice")].find((b) => b.textContent === cur.answer).click();
    clickText(i < 2 ? "다음" : "결과 보기");
  }
  out.retryAllCorrect = document.querySelector(".score").textContent === "3 / 3";
  out.retryButtonGone = ![...document.querySelectorAll("button")].some((b) => b.textContent === "틀린 문제 다시 풀기");
  clickText("처음으로");
  return out;
})()
```

기대 결과: `ReferenceError: MODES is not defined`

- [ ] **2단계: 설정과 계산 함수 고치기**

`// ===== 설정 =====`의 `QUESTIONS_PER_ROUND` 아래에 넣습니다.

```js
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
```

`gradeAnswer`를 통째로 바꿉니다.

```js
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
```

`state`에 `mode`를 더합니다(`category` 줄 아래).

```js
  mode: "practice", // MODES의 키
```

- [ ] **3단계: 동작 함수 더하기**

`// ===== 동작 =====`의 `goHome` 아래에 넣습니다.

```js
function retryWrong() {
  const wrong = state.round.filter((q, i) => !state.records[i].correct);
  beginRound(buildRound(state.category, wrong));
}
```

- [ ] **4단계: 화면 함수 바꾸기**

`renderStart`, `renderQuestion`, `renderResult`를 아래로 통째로 바꾸고, `renderQuestion` 아래에 `renderModeTools`를 더합니다.

```js
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
    el("button", { type: "button", class: "primary", "data-focus": "", onclick: startRound }, "시작"));
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

// 모드별 도구(타이머, 힌트 버튼). 과제 6, 7에서 채웁니다.
function renderModeTools(q, record) {
  return null;
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
```

- [ ] **5단계: `style.css`에 더하기**

```css
.option-desc { display: block; color: var(--muted); font-size: 0.9rem; }
```

- [ ] **6단계: 통과 확인**

새로 불러온 뒤 1단계 코드를 실행합니다. 기대 결과: 모든 값이 `true`.

과제 3의 확인 코드도 다시 실행합니다. 이때 코드의 `document.querySelector('input[value="과학"]').click();` 다음 줄에 `document.querySelector('input[value="practice"]').click();`를 더하고, `out.score`를 `"9 / 10"`으로 그대로 둡니다. 기대 결과: 모든 값이 `true`.

- [ ] **7단계: 커밋**

```bash
git add script.js style.css
```

```bash
git commit -m "feat: 모드 설정표, 모드 선택, 연습 모드 추가" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### 과제 6: 스피드 모드 타이머

**파일:**
- 고치기: `script.js`, `style.css`

**인터페이스:**
- 사용: `MODES[mode].timeLimit`, `gradeAnswer(question, null)`의 `timedOut`, 과제 5의 `renderModeTools`
- 제공: `remainingSeconds(startedAt, now, limit)`, `startTimer()`, `stopTimer()`, `tick()`, `showQuestion()`(새 문항을 보여 줄 때 부름. 과제 7에서 힌트 초기화를 더함), `state.timerStartedAt`, `state.timerId`. 타이머 요소는 `#timer`

- [ ] **1단계: 실패 확인(계산 함수)**

```js
(() => ({
  full: remainingSeconds(1000, 1000, 15) === 15,
  justUnder: remainingSeconds(1000, 1999, 15) === 15,
  oneSecond: remainingSeconds(1000, 2000, 15) === 14,
  end: remainingSeconds(1000, 16000, 15) === 0,
  neverNegative: remainingSeconds(1000, 99000, 15) === 0,
}))()
```

기대 결과: `ReferenceError: remainingSeconds is not defined`

- [ ] **2단계: 계산 함수와 상태 더하기**

`// ===== 계산 함수 =====` 끝(`formatScore` 아래)에 넣습니다.

```js
// 시작 시각과의 차이로 계산하므로 탭을 떠났다 와도 어긋나지 않습니다.
function remainingSeconds(startedAt, now, limit) {
  return Math.max(0, limit - Math.floor((now - startedAt) / 1000));
}
```

`state`의 `records` 줄 아래에 더합니다.

```js
  timerStartedAt: null,
  timerId: null,
```

- [ ] **3단계: 동작 함수 바꾸기**

`// ===== 동작 =====`의 `beginRound`, `answer`, `next`, `goHome`을 아래로 바꾸고, `startTimer`, `stopTimer`, `tick`, `showQuestion`을 더합니다(`startRound`와 `retryWrong`은 그대로).

```js
function beginRound(round) {
  state.round = round;
  state.index = 0;
  state.records = [];
  state.screen = "question";
  showQuestion();
}

// 새 문항을 화면에 올릴 때마다 부릅니다.
function showQuestion() {
  startTimer();
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
  state.records[state.index] = gradeAnswer(state.round[state.index], choice);
  render();
}

function next() {
  if (state.index < state.round.length - 1) {
    state.index += 1;
    showQuestion();
  } else {
    state.screen = "result";
    render();
  }
}

function goHome() {
  stopTimer();
  state.screen = "start";
  render();
}
```

- [ ] **4단계: 화면 함수 바꾸기**

`renderModeTools`와 `renderFeedback`을 통째로 바꿉니다.

```js
// 모드별 도구(타이머, 힌트 버튼). 힌트는 과제 7에서 더합니다.
function renderModeTools(q, record) {
  const limit = MODES[state.mode].timeLimit;
  if (limit === null || record) return null;
  const left = remainingSeconds(state.timerStartedAt, Date.now(), limit);
  return el("p", { id: "timer", class: "timer", role: "timer" }, `남은 시간 ${left}초`);
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
```

- [ ] **5단계: `style.css`에 더하기**

```css
.timer { margin: 0 0 12px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--accent); }
```

- [ ] **6단계: 통과 확인(계산 함수)**

새로 불러온 뒤 1단계 코드를 실행합니다. 기대 결과: 모든 값이 `true`.

- [ ] **7단계: 통과 확인(화면)**

아래 코드는 시간을 기다려야 해서 `await`를 씁니다. 콘솔에 그대로 붙여 넣으면 약 17초 뒤에 결과가 나옵니다.

```js
await (async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const clickText = (text) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === text).click();
  const out = {};
  document.querySelector('input[value="세계지리"]').click();
  document.querySelector('input[value="speed"]').click();
  clickText("시작");
  out.timerStarts = document.getElementById("timer").textContent === "남은 시간 15초";
  await wait(1300);
  out.timerCounts = document.getElementById("timer").textContent === "남은 시간 14초";
  await wait(14200);
  out.timedOut = document.querySelector(".verdict").textContent === "시간 초과";
  out.notCorrectMarked = document.querySelector(".choice.wrong") === null && document.querySelector(".choice.correct") !== null;
  out.recordTimedOut = state.records[0].timedOut === true && state.records[0].points === 0;
  out.timerStopped = state.timerId === null && document.getElementById("timer") === null;
  clickText("다음");
  out.timerRestarts = document.getElementById("timer").textContent === "남은 시간 15초";
  clickText("처음으로");
  out.timerClearedOnHome = state.timerId === null;
  await wait(1500);
  out.stillHome = document.querySelector("h1").textContent === "상식 퀴즈";
  return out;
})()
```

기대 결과: 모든 값이 `true`. 이어서 연습 모드로 한 문제를 시작해 `document.getElementById("timer") === null`인지 봅니다.

- [ ] **8단계: 커밋**

```bash
git add script.js style.css
```

```bash
git commit -m "feat: 스피드 모드 15초 타이머 추가" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### 과제 7: 힌트 모드

**파일:**
- 고치기: `script.js`, `style.css`

**인터페이스:**
- 사용: `shuffle`, `gradeAnswer(question, chosen, hintUsed)`, 과제 6의 `showQuestion`, `answer`, `renderModeTools`
- 제공: `pickHintRemovals(question, random = Math.random)`, `useHint()`, `state.removed`(지운 보기 글자 배열). 지운 보기의 클래스는 `removed`, 힌트 버튼의 클래스는 `hint-button`

- [ ] **1단계: 실패 확인(계산 함수)**

```js
(() => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const q = { choices: ["가", "나", "다", "라"], answer: "다" };
  const runs = Array.from({ length: 50 }, () => pickHintRemovals(q, rnd));
  return {
    twoRemoved: runs.every((r) => r.length === 2),
    neverAnswer: runs.every((r) => !r.includes("다")),
    distinct: runs.every((r) => r[0] !== r[1]),
    varies: new Set(runs.map((r) => r.slice().sort().join())).size > 1,
  };
})()
```

기대 결과: `ReferenceError: pickHintRemovals is not defined`

- [ ] **2단계: 계산 함수와 상태 더하기**

`// ===== 계산 함수 =====` 끝(`remainingSeconds` 아래)에 넣습니다.

```js
// 오답 3개 중 2개를 무작위로 고릅니다.
function pickHintRemovals(question, random = Math.random) {
  return shuffle(question.choices.filter((choice) => choice !== question.answer), random).slice(0, 2);
}
```

`state`의 `timerId` 줄 아래에 더합니다.

```js
  removed: [], // 힌트로 지운 보기
```

- [ ] **3단계: 동작 함수 바꾸기**

`showQuestion`과 `answer`를 바꾸고 `useHint`를 더합니다.

```js
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

function answer(choice) {
  if (state.records[state.index]) return; // 이미 답한 문항
  stopTimer();
  state.records[state.index] = gradeAnswer(state.round[state.index], choice, state.removed.length > 0);
  render();
}
```

- [ ] **4단계: 화면 함수 바꾸기**

`renderModeTools`와 `renderChoice`를 통째로 바꿉니다.

```js
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
```

`index` 인자는 더 이상 쓰지 않지만, `renderQuestion`이 넘기는 모양과 맞추려고 남겨 둡니다.

- [ ] **5단계: `style.css`에 더하기**

```css
.hint-button { margin: 0 0 12px; }
.choice.removed { opacity: 0.4; text-decoration: line-through; }
```

- [ ] **6단계: 통과 확인(계산 함수)**

새로 불러온 뒤 1단계 코드를 실행합니다. 기대 결과: 모든 값이 `true`.

- [ ] **7단계: 통과 확인(화면)**

```js
(() => {
  const clickText = (text) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === text).click();
  const out = {};
  document.querySelector('input[value="예술과 문화"]').click();
  document.querySelector('input[value="hint"]').click();
  clickText("시작");
  out.noTimer = document.getElementById("timer") === null;
  document.querySelector(".hint-button").click();
  const removedButtons = [...document.querySelectorAll(".choice.removed")];
  out.twoRemoved = removedButtons.length === 2 && removedButtons.every((b) => b.disabled);
  out.answerKept = !state.removed.includes(state.round[0].answer);
  out.hintOnce = document.querySelector(".hint-button").disabled === true;
  // 1번: 힌트 쓰고 맞힘(0.5), 2번: 힌트 쓰고 맞힘(0.5), 3~9번: 힌트 없이 맞힘(7), 10번: 틀림
  [...document.querySelectorAll(".choice")].find((b) => b.textContent === state.round[0].answer).click();
  clickText("다음");
  out.hintReset = state.removed.length === 0 && document.querySelector(".hint-button").disabled === false;
  document.querySelector(".hint-button").click();
  [...document.querySelectorAll(".choice")].find((b) => b.textContent === state.round[1].answer).click();
  for (let i = 2; i < 10; i += 1) {
    clickText("다음");
    const cur = state.round[i];
    const pick = i < 9 ? cur.answer : cur.choices.find((c) => c !== cur.answer);
    [...document.querySelectorAll(".choice")].find((b) => b.textContent === pick).click();
  }
  clickText("결과 보기");
  out.score = document.querySelector(".score").textContent === "8 / 10";
  out.hintCount = document.querySelector(".result .lead").textContent === "힌트 2번 사용";
  clickText("처음으로");
  return out;
})()
```

기대 결과: 모든 값이 `true`. 이어서 과제 6의 7단계 코드도 다시 실행해 스피드 모드가 그대로인지 봅니다(힌트 버튼이 없어야 하므로 `document.querySelector(".hint-button") === null`도 확인).

- [ ] **8단계: 커밋**

```bash
git add script.js style.css
```

```bash
git commit -m "feat: 힌트 모드(오답 2개 지우기, 0.5점) 추가" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **9단계: 2단계 마무리**

좁은 폭(360px)에서 스피드, 힌트 모드 문제 화면의 가로 스크롤이 없는지 확인합니다. 사용자에게 "2단계 사용자 확인" 9개 항목을 보여 주고 확인을 요청합니다. 사용자가 확인했다고 하면 태그를 답니다.

```bash
git tag stage-2
```

---

# 3단계: 점수 저장과 순위표

**만들 것**
- localStorage(`quiz.scores`)에 스피드, 힌트 모드 기록 저장. 카테고리와 모드 조합마다 상위 5개만 보관
- 결과 화면의 "새 기록! N위" 안내와 저장 실패 안내
- 순위표 화면(카테고리 탭 4개 × 스피드·힌트 표), [기록 모두 지우기]
- 저장이 막힌 브라우저에서도 퀴즈는 정상 동작

**완료 기준**
- 과제 8, 9, 10의 콘솔 확인 코드가 모두 `true`입니다.
- 1, 2단계의 화면 확인 코드(과제 3, 5, 6, 7)를 다시 돌려도 모두 `true`입니다.
- 콘솔 오류가 없습니다.
- 아래 사용자 확인 항목을 사용자가 모두 확인했습니다.

**사용자 확인 (브라우저에서 직접)**
1. 시작 화면에 [순위표] 버튼이 있고, 누르면 순위표 화면이 나온다.
2. 순위표 위쪽에 카테고리 탭 4개가 있고, 탭을 누르면 그 카테고리의 스피드 표와 힌트 표가 나온다. 좁은 창에서는 두 표가 위아래로 쌓인다.
3. 기록이 없는 표에는 "아직 기록이 없습니다"가 나온다.
4. 스피드 모드로 한 판을 끝내면 결과 화면에 "새 기록! 1위"가 나오고, 순위표의 해당 카테고리 스피드 표에 점수와 오늘 날짜가 올라간다.
5. 힌트 모드 표에는 힌트 횟수 열이 있다.
6. 연습 모드로 끝낸 판, 도중에 [처음으로]로 그만둔 판은 순위표에 올라가지 않는다.
7. 같은 카테고리와 모드로 6판 이상 하면 표에 5개만 남고, 점수가 높은 순(같으면 힌트를 덜 쓴 순, 그다음 먼저 세운 기록 순)으로 정렬된다. 상위 5개에 못 든 판에는 "새 기록"이 나오지 않는다.
8. 브라우저를 닫았다 다시 `index.html`을 열어도 순위표가 남아 있다.
9. [기록 모두 지우기]를 누르면 확인 창이 뜨고, [확인]을 누르면 모든 표가 비고, [취소]를 누르면 그대로다.
10. 시크릿 창에서 `index.html`을 열어도 퀴즈를 끝까지 풀 수 있다.

---

### 과제 8: 순위 계산 함수와 저장소 함수

**파일:**
- 고치기: `script.js` (설정, 계산 함수, 새 `// ===== 저장소 =====` 구역)

**인터페이스:**
- 사용: `CATEGORIES`, `MODES`
- 제공:
  - `STORAGE_KEY = "quiz.scores"`, `TOP_N = 5`, `RANKED_MODES`(= `["speed", "hint"]`, `MODES`에서 `ranked`인 키)
  - 기록 1건 모양: `{ category, mode, score, hintsUsed, date }`(`date`는 ISO 문자열)
  - `compareScores(a, b)`: 정렬 비교 함수(점수 높은 순 → 힌트 적은 순 → 날짜 이른 순)
  - `isValidScore(entry)` → boolean
  - `parseScores(raw)`: 문자열 또는 `null` → 올바른 기록만 담은 배열(깨졌으면 `[]`)
  - `topScores(scores, category, mode)` → 정렬된 상위 5개
  - `addScore(scores, entry)` → 새 기록을 더하고 조합마다 상위 5개만 남긴 새 배열(원본 그대로)
  - `rankOf(scores, entry)` → 그 기록의 순위(1~5) 또는 `null`(같은 객체인지로 찾음)
  - `formatDate(iso)` → 사용자 컴퓨터 시간대 기준 `"YYYY-MM-DD"`
  - `loadScores()` → `{ ok: boolean, scores: [] }`, `saveScores(scores)` → boolean, `clearScores()` → boolean

- [ ] **1단계: 실패 확인**

```js
(() => {
  const mk = (score, hintsUsed, date, category = "과학", mode = "hint") => ({ category, mode, score, hintsUsed, date });
  const a = mk(8, 0, "2026-09-01T00:00:00.000Z");
  const b = mk(8, 2, "2026-08-01T00:00:00.000Z");
  const c = mk(9, 3, "2026-09-02T00:00:00.000Z");
  const d = mk(8, 0, "2026-08-15T00:00:00.000Z");
  const out = {};
  out.constants = STORAGE_KEY === "quiz.scores" && TOP_N === 5 && RANKED_MODES.join() === "speed,hint";
  out.order = [a, b, c, d].sort(compareScores).map((x) => [a, b, c, d].indexOf(x)).join() === "2,3,0,1";
  out.parseNull = parseScores(null).length === 0;
  out.parseBroken = parseScores("{not json").length === 0;
  out.parseNotArray = parseScores('{"a":1}').length === 0;
  out.parseSkipsBad = parseScores(JSON.stringify([a, { ...a, mode: "practice" }, { ...a, score: "8" }, { ...a, date: "어제" }, null])).length === 1;
  let scores = [];
  const entries = [];
  for (let i = 0; i < 7; i += 1) {
    const e = mk(i, 0, `2026-09-0${i + 1}T00:00:00.000Z`);
    entries.push(e);
    scores = addScore(scores, e);
  }
  scores = addScore(scores, mk(10, 0, "2026-09-09T00:00:00.000Z", "한국사", "speed"));
  out.keepsTop5 = topScores(scores, "과학", "hint").map((x) => x.score).join() === "6,5,4,3,2";
  out.otherBoardKept = topScores(scores, "한국사", "speed").length === 1;
  out.totalSize = scores.length === 6;
  out.rankTop = rankOf(scores, entries[6]) === 1;
  out.rankDropped = rankOf(scores, entries[0]) === null;
  const before = [a];
  addScore(before, b);
  out.addDoesNotMutate = before.length === 1;
  out.date = formatDate(new Date(2026, 8, 18, 23, 30).toISOString()) === "2026-09-18";
  out.storageRoundTrip = (() => {
    const backup = localStorage.getItem(STORAGE_KEY);
    const saved = saveScores([a]);
    const loaded = loadScores();
    const cleared = clearScores();
    const empty = loadScores();
    if (backup === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, backup);
    return saved && loaded.ok && loaded.scores.length === 1 && cleared && empty.ok && empty.scores.length === 0;
  })();
  return out;
})()
```

기대 결과: `ReferenceError: STORAGE_KEY is not defined`

- [ ] **2단계: 설정 더하기**

`// ===== 설정 =====`의 `MODES` 아래에 넣습니다.

```js
const STORAGE_KEY = "quiz.scores";
const TOP_N = 5;
const RANKED_MODES = Object.keys(MODES).filter((key) => MODES[key].ranked);
```

- [ ] **3단계: 계산 함수 더하기**

`// ===== 계산 함수 =====` 끝(`pickHintRemovals` 아래)에 넣습니다.

```js
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
```

- [ ] **4단계: 저장소 함수 더하기**

`// ===== 계산 함수 =====` 구역과 `// ===== 상태 =====` 사이에 새 구역을 만듭니다.

```js
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
```

- [ ] **5단계: 통과 확인**

새로 불러온 뒤 1단계 코드를 실행합니다. 기대 결과: 모든 값이 `true`. 원래 있던 기록은 확인 코드가 되돌려 놓습니다.

- [ ] **6단계: 커밋**

```bash
git add script.js
```

```bash
git commit -m "feat: 순위 계산과 localStorage 저장 함수 추가" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### 과제 9: 판이 끝나면 기록 저장, 결과 화면 안내

**파일:**
- 고치기: `script.js`, `style.css`

**인터페이스:**
- 사용: 과제 8의 `loadScores`, `saveScores`, `addScore`, `rankOf`, `MODES[mode].ranked`
- 제공: `finishRound()`, `recordScore()` → `{ ok: boolean, rank: number | null }`, `state.lastSave`(`null`이면 저장 대상이 아닌 판). 안내 문단 클래스 `notice`, `notice-new`, `notice-error`

- [ ] **1단계: 실패 확인**

```js
(() => {
  const clickText = (text) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === text).click();
  const backup = localStorage.getItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  const play = (category, mode, correctCount) => {
    document.querySelector(`input[value="${category}"]`).click();
    document.querySelector(`input[value="${mode}"]`).click();
    clickText("시작");
    for (let i = 0; i < 10; i += 1) {
      const cur = state.round[i];
      const pick = i < correctCount ? cur.answer : cur.choices.find((c) => c !== cur.answer);
      [...document.querySelectorAll(".choice")].find((b) => b.textContent === pick).click();
      clickText(i < 9 ? "다음" : "결과 보기");
    }
  };
  const out = {};
  play("과학", "hint", 6);
  out.firstIsNew = document.querySelector(".notice-new")?.textContent === "새 기록! 1위";
  let saved = loadScores().scores;
  out.savedOne = saved.length === 1 && saved[0].category === "과학" && saved[0].mode === "hint" && saved[0].score === 6 && saved[0].hintsUsed === 0;
  clickText("다시 하기");
  for (let i = 0; i < 10; i += 1) {
    const cur = state.round[i];
    [...document.querySelectorAll(".choice")].find((b) => b.textContent === cur.answer).click();
    clickText(i < 9 ? "다음" : "결과 보기");
  }
  out.betterIsFirst = document.querySelector(".notice-new")?.textContent === "새 기록! 1위";
  clickText("처음으로");
  play("과학", "practice", 10);
  out.practiceNotSaved = loadScores().scores.length === 2 && document.querySelector(".notice") === null;
  clickText("처음으로");
  document.querySelector('input[value="speed"]').click();
  clickText("시작");
  clickText("처음으로");
  out.abandonedNotSaved = loadScores().scores.length === 2;
  // 상위 5개를 채운 뒤 낮은 점수는 "새 기록"이 아님
  for (let k = 0; k < 4; k += 1) { play("과학", "hint", 9); clickText("처음으로"); }
  play("과학", "hint", 0);
  out.lowNotNew = document.querySelector(".notice-new") === null;
  out.stillFive = topScores(loadScores().scores, "과학", "hint").length === 5;
  clickText("처음으로");
  if (backup === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, backup);
  return out;
})()
```

기대 결과: `out.firstIsNew`가 `false`(아직 안내가 없음). 모든 값이 `true`가 아니면 실패로 봅니다.

- [ ] **2단계: 상태와 동작 함수 고치기**

`state`의 `removed` 줄 아래에 더합니다.

```js
  lastSave: null, // 방금 끝난 판의 저장 결과 { ok, rank }. 저장 대상이 아니면 null
```

`// ===== 동작 =====`의 `beginRound`와 `next`를 바꾸고, `finishRound`, `recordScore`를 더합니다.

```js
function beginRound(round) {
  state.round = round;
  state.index = 0;
  state.records = [];
  state.lastSave = null;
  state.screen = "question";
  showQuestion();
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
```

- [ ] **3단계: 결과 화면 바꾸기**

`renderResult`를 통째로 바꾸고, 그 아래에 `renderSaveNotice`를 더합니다.

```js
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
```

- [ ] **4단계: `style.css`에 더하기**

```css
.notice { margin: 8px 0; padding: 8px 12px; border-radius: var(--radius); font-weight: 600; }
.notice-new { background: var(--correct-bg); color: var(--correct); }
.notice-error { background: var(--wrong-bg); color: var(--wrong); }
```

- [ ] **5단계: 통과 확인**

새로 불러온 뒤 1단계 코드를 실행합니다. 기대 결과: 모든 값이 `true`.

- [ ] **6단계: 저장이 막힌 경우 확인**

새로 불러온 뒤 콘솔에서 localStorage의 읽기, 쓰기, 지우기가 모두 예외를 내도록 막습니다(새로고침하면 원래대로 돌아옵니다).

```js
for (const name of ["getItem", "setItem", "removeItem"]) {
  Storage.prototype[name] = () => { throw new DOMException("blocked", "SecurityError"); };
}
```

그다음 힌트 모드로 한 판을 모두 맞히는 아래 코드를 실행합니다.

```js
(() => {
  const clickText = (text) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === text).click();
  document.querySelector('input[value="과학"]').click();
  document.querySelector('input[value="hint"]').click();
  clickText("시작");
  for (let i = 0; i < 10; i += 1) {
    [...document.querySelectorAll(".choice")].find((b) => b.textContent === state.round[i].answer).click();
    clickText(i < 9 ? "다음" : "결과 보기");
  }
  const out = {
    finished: document.querySelector(".score").textContent === "10 / 10",
    errorNotice: document.querySelector(".notice-error")?.textContent === "기록을 저장할 수 없습니다",
  };
  clickText("처음으로");
  return out;
})()
```

기대 결과: 모든 값이 `true`, 콘솔 오류 없음. 확인 뒤 새로 불러와 localStorage를 되돌립니다.

- [ ] **7단계: 커밋**

```bash
git add script.js style.css
```

```bash
git commit -m "feat: 스피드·힌트 모드 기록 저장과 새 기록 안내 추가" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### 과제 10: 순위표 화면과 기록 지우기

**파일:**
- 고치기: `script.js`, `style.css`

**인터페이스:**
- 사용: `loadScores`, `clearScores`, `topScores`, `formatScore`, `formatDate`, `RANKED_MODES`, `MODES`
- 제공: `state.boardCategory`, `openLeaderboard()`, `clearAllScores()`, `renderLeaderboard()`, `renderBoard(scores, category, mode)`, `SCREENS.leaderboard`. 클래스 `tabs`, `tab`, `boards`, `board`, `empty`

- [ ] **1단계: 실패 확인**

```js
(() => {
  const clickText = (text) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === text).click();
  // 기록을 건드리기 전에 확인합니다(실패할 때 시험용 기록이 남지 않게).
  if (![...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "순위표")) return "순위표 버튼 없음";
  const backup = localStorage.getItem(STORAGE_KEY);
  const mk = (score, hintsUsed, date, category, mode) => ({ category, mode, score, hintsUsed, date });
  saveScores([
    mk(7, 0, "2026-09-10T03:00:00.000Z", "세계지리", "speed"),
    mk(9, 0, "2026-09-11T03:00:00.000Z", "세계지리", "speed"),
    mk(8.5, 1, "2026-09-12T03:00:00.000Z", "세계지리", "hint"),
  ]);
  const out = {};
  clickText("순위표");
  out.title = document.querySelector("h1").textContent === "순위표";
  out.fourTabs = document.querySelectorAll(".tab").length === 4;
  out.firstTabSelected = document.querySelector(".tab").getAttribute("aria-pressed") === "true";
  out.emptyBoards = [...document.querySelectorAll(".board .empty")].length === 2;
  [...document.querySelectorAll(".tab")].find((b) => b.textContent === "세계지리").click();
  const boards = [...document.querySelectorAll(".board")];
  out.twoBoards = boards.length === 2;
  const speedRows = [...boards[0].querySelectorAll("tbody tr")].map((tr) => [...tr.cells].map((td) => td.textContent).join("|"));
  out.speedOrder = speedRows.join(",") === "1위|9 / 10|2026-09-11,2위|7 / 10|2026-09-10";
  const hintHead = [...boards[1].querySelectorAll("th")].map((th) => th.textContent).join();
  out.hintColumns = hintHead === "순위,점수,힌트,날짜";
  out.hintRow = [...boards[1].querySelector("tbody tr").cells].map((td) => td.textContent).join("|") === "1위|8.5 / 10|1번|2026-09-12";
  const originalConfirm = window.confirm;
  window.confirm = () => false;
  clickText("기록 모두 지우기");
  out.cancelKeeps = loadScores().scores.length === 3;
  window.confirm = () => true;
  clickText("기록 모두 지우기");
  window.confirm = originalConfirm;
  out.cleared = loadScores().scores.length === 0 && document.querySelectorAll(".board .empty").length === 2;
  clickText("처음으로");
  out.home = document.querySelector("h1").textContent === "상식 퀴즈";
  if (backup === null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, backup);
  return out;
})()
```

날짜 칸은 사용자 컴퓨터 시간대로 보여 주므로, 위 기록은 일부러 UTC 03시로 넣어 한국 시간에서도 같은 날짜가 나오게 했습니다.

기대 결과: `"순위표 버튼 없음"`

- [ ] **2단계: 상태와 동작 함수 더하기**

`state`의 `lastSave` 줄 아래에 더합니다.

```js
  boardCategory: CATEGORIES[0], // 순위표에서 보고 있는 카테고리
```

`// ===== 동작 =====` 끝에 넣습니다.

```js
function openLeaderboard() {
  state.screen = "leaderboard";
  render();
}

function clearAllScores() {
  if (!window.confirm("모든 기록을 지울까요? 되돌릴 수 없습니다.")) return;
  if (!clearScores()) window.alert("기록을 지울 수 없습니다.");
  render();
}
```

- [ ] **3단계: 화면 함수 고치기**

`renderStart`를 통째로 바꿉니다([순위표] 버튼이 더해짐).

```js
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
```

`renderError` 위에 순위표 화면 함수를 더합니다.

```js
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
```

`SCREENS`를 바꿉니다.

```js
const SCREENS = {
  start: renderStart,
  question: renderQuestion,
  result: renderResult,
  leaderboard: renderLeaderboard,
  error: renderError,
};
```

- [ ] **4단계: `style.css`에 더하기**

```css
.leaderboard .topbar h1 { margin: 0; color: var(--text); }

.tabs { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
.tab[aria-pressed="true"] { background: var(--accent); color: var(--accent-text); border-color: var(--accent); font-weight: 600; }

.boards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.board { padding: 12px 16px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
.board h3 { margin-top: 0; }
.board table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
.board th, .board td { padding: 6px 4px; border-bottom: 1px solid var(--border); text-align: left; }
.board th { color: var(--muted); font-weight: 600; font-size: 0.9rem; }
.empty { color: var(--muted); margin: 0; }
```

`minmax(260px, 1fr)`이므로 폭이 좁으면(표 두 개가 나란히 들어가지 않으면) 저절로 위아래로 쌓입니다.

- [ ] **5단계: 통과 확인**

새로 불러온 뒤 1단계 코드를 실행합니다. 기대 결과: 모든 값이 `true`.

폭을 360px로 줄여 순위표 화면에서 `document.documentElement.scrollWidth <= window.innerWidth`가 `true`이고, 두 표가 위아래로 쌓이는지 스크린샷으로 확인합니다. 폭을 원래대로 돌립니다.

저장이 막힌 경우(과제 9의 6단계 코드로 localStorage를 막은 뒤)에도 [순위표]를 누르면 "기록을 저장할 수 없습니다"가 나오고 콘솔 오류가 없는지 확인합니다.

- [ ] **6단계: 앞 단계 회귀 확인**

과제 3(과제 5의 6단계에서 고친 모양), 5, 6(7단계), 7(7단계), 9의 화면 확인 코드를 차례로 다시 실행합니다. 기대 결과: 모두 `true`. 과제 5와 7의 코드는 순위표 기록을 남기지 않거나(연습) 남기므로, 실행 전에 `localStorage.getItem(STORAGE_KEY)`를 적어 두었다가 끝나면 되돌립니다.

- [ ] **7단계: 커밋**

```bash
git add script.js style.css
```

```bash
git commit -m "feat: 순위표 화면과 기록 지우기 추가" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **8단계: 3단계 마무리**

사용자에게 "3단계 사용자 확인" 10개 항목을 보여 주고 확인을 요청합니다. 사용자가 확인했다고 하면 태그를 답니다.

```bash
git tag stage-3
```
