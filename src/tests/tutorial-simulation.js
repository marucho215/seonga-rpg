"use strict";

const assert = require("node:assert/strict");
global.window = global;
require("../data/characters.js");
require("../data/tutorial-endless-classroom.js");
require("../engine.js");

const ids = SEONGA_TUTORIAL_EVENT.characterPool;
const investigationPath = [
  ["terminal", "terminal-network"],
  ["messages", "messages-reports"],
  ["stairs", "stairs-route"]
];

function prepare(absent) {
  const state = GameEngine.createState();
  state.partyIds = ids.filter(id => id !== absent);
  assert.equal(GameEngine.startBriefing(state), true);
  GameEngine.startExploration(state);
  for (const [location, choice] of investigationPath) {
    assert.equal(GameEngine.selectLocation(state, location), true);
    assert.equal(GameEngine.investigate(state, choice), true);
  }
  assert.deepEqual(state.clues, ["network", "reports", "route"]);
  assert.equal(GameEngine.startBattle(state), true);
  return state;
}

function chooseAction(state) {
  const actions = GameEngine.availableActions(state).filter(action => !action.disabled);
  if (state.stageIndex < 2) {
    return actions.find(action => ["patch", "calm", "recover", "topic"].includes(action.id))
      || actions.find(action => action.id === "advance")
      || actions[0];
  }
  if (state.students.some(student => !student.evacuated && student.stage > 0)) {
    return actions.find(action => action.id === "calm") || actions.find(action => action.id === "steady");
  }
  if (state.threatPressure >= 3) {
    const response = actions.find(action => ["patch", "intercept", "scan", "care", "burst"].includes(action.id));
    if (response) return response;
  }
  return actions
    .filter(action => action.id.startsWith("evacuate-"))
    .sort((a, b) => {
      const ai = Number(a.id.split("-")[1]);
      const bi = Number(b.id.split("-")[1]);
      return state.students[bi].exitRisk - state.students[ai].exitRisk;
    })[0] || actions[0];
}

function simulate(absent) {
  const state = prepare(absent);
  const actionsByStage = [0, 0, 0];
  let safety = 0;
  while (!["success", "failure"].includes(state.phase) && safety++ < 180) {
    if (state.phase === "interlude") { GameEngine.continueStage(state); continue; }
    if (state.stageIndex > 0 && !state.supportUsed && state.supportCharges > 0) GameEngine.useSupport(state);
    if (state.phase !== "battle") continue;
    const action = chooseAction(state);
    assert.ok(action, "사용 가능한 행동이 있어야 한다.");
    actionsByStage[state.stageIndex]++;
    GameEngine.act(state, action.id);
  }
  assert.equal(state.phase, "success", `${absent} 비출전 편성이 완주해야 한다.`);
  assert.equal(state.students.length, 5);
  assert.ok(state.students.every(student => student.evacuated));
  assert.ok(actionsByStage[2] >= actionsByStage[0], "이탈 구간이 문턱 구간보다 짧아서는 안 된다.");
  return { absent, actionsByStage, total:actionsByStage.reduce((a, b) => a + b, 0) };
}

const exploration = GameEngine.createState();
GameEngine.startBriefing(exploration);
GameEngine.startExploration(exploration);
assert.equal(GameEngine.startBattle(exploration), false);
for (const [location, choice] of investigationPath) {
  assert.equal(GameEngine.selectLocation(exploration, location), true);
  assert.equal(GameEngine.investigate(exploration, choice), true);
}
assert.equal(exploration.investigationsLeft, 0);
assert.equal(GameEngine.selectLocation(exploration, "hall"), false);

const reaction = prepare("epi-minos");
const pressureBefore = reaction.threatPressure;
GameEngine.act(reaction, "advance");
assert.equal(reaction.threatPressure, pressureBefore + 1, "복창 증폭은 진행 행동에 압력 비용을 붙인다.");
GameEngine.act(reaction, "advance");
assert.ok(reaction.threatPressure >= pressureBefore + 3, "같은 계열 연속 행동은 적응 반동을 만든다.");

const results = ids.map(simulate);
console.log(JSON.stringify(results, null, 2));
