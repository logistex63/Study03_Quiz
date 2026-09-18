---
description: questions.js의 문항을 report/questions.csv로 내보냅니다(번호, 카테고리, 난이도, 문제, 정답, 출처).
argument-hint: "(인수 없음)"
allowed-tools: Read, Bash(node:*), Bash(mkdir:*)
---

# 문항 내보내기

`questions.js`의 문항을 `report/questions.csv`로 내보낸다.

## 지켜야 할 것

- **만들거나 고치는 파일은 `report/questions.csv` 하나뿐이다.** `questions.js`를 비롯한 다른 파일은 고치지 않는다.
- `report/questions.csv`가 이미 있으면 새로 덮어쓴다.
- 문항은 `questions.js`에 적힌 순서 그대로 한 행씩 쓴다. 빼거나 고치거나 순서를 바꾸지 않는다.

## CSV 형식

- 첫 행은 머리글이다: `번호,카테고리,난이도,문제,정답,출처`
- 열마다 넣는 값:

| 열 | 값 |
|---|---|
| 번호 | `id` (예: `kh-01`) |
| 카테고리 | `category` |
| 난이도 | `difficulty` (없으면 빈칸) |
| 문제 | `question` |
| 정답 | `answer` |
| 출처 | `source.title (source.url)` |

- 인코딩은 UTF-8이고, 엑셀에서 한글이 깨지지 않도록 파일 맨 앞에 BOM을 붙인다. 줄바꿈은 CRLF로 한다.
- 값에 쉼표, 큰따옴표, 줄바꿈이 있으면 값 전체를 큰따옴표로 감싸고, 값 안의 큰따옴표는 두 번(`""`) 쓴다.

## 순서

1. `questions.js`를 읽어 문항 수를 확인한다.
2. 프로젝트 루트에서 아래 명령을 실행한다. `questions.js`를 그대로 불러와 CSV를 만든다.

```bash
node -e '
const fs = require("fs");
const Q = new Function(fs.readFileSync("questions.js", "utf8") + ";return QUESTIONS;")();
const cell = (v) => { const s = String(v ?? ""); return /[",\r\n]/.test(s) ? "\"" + s.replace(/"/g, "\"\"") + "\"" : s; };
const rows = [["번호", "카테고리", "난이도", "문제", "정답", "출처"]].concat(
  Q.map((q) => [q.id, q.category, q.difficulty, q.question, q.answer, `${q.source?.title ?? ""} (${q.source?.url ?? ""})`])
);
fs.mkdirSync("report", { recursive: true });
fs.writeFileSync("report/questions.csv", "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n", "utf8");
console.log(`rows=${Q.length}`);
'
```

3. `report/questions.csv`를 다시 읽어 확인한다.
   - 머리글을 뺀 행 수가 1단계에서 센 문항 수와 같은지 본다.
   - 첫 행과 마지막 행이 `questions.js`의 첫 문항, 마지막 문항과 같은지 본다.

## 보고 형식

1. "report/questions.csv에 N문항을 내보냈습니다."라고 한 문장으로 쓴다.
2. 첫 3행(머리글 포함)을 코드 블록으로 보여 준다.
3. 행 수가 문항 수와 다르면 그 차이를 적는다.
4. 마지막에 "questions.js는 고치지 않았습니다."라고 쓴다.
