// balance/harness.js
// game.js をブラウザ無しで読み込み、内部のデータ・計算式を取り出す土台。
// DOM/Canvas/各種APIを最小スタブで用意し、game.js を実行 → 末尾で内部値を __GAME に公開する。
// これにより「データと計算式の二重管理」を避け、本体と同じ数値で検証できる。

const fs = require("fs");
const path = require("path");
const vm = require("vm");

// Canvas 2D コンテキストの何でもスタブ（メソッド呼び出しは全て no-op）
function makeCtx() {
  return new Proxy({}, { get: (t, p) => (p in t ? t[p] : () => {}), set: () => true });
}

// DOM要素の最小スタブ
function makeEl() {
  return {
    textContent: "", innerHTML: "", value: "", disabled: false, width: 0, height: 0,
    style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, removeEventListener() {},
    appendChild() {}, append() {}, removeChild() {}, remove() {},
    setAttribute() {}, getAttribute() { return null; },
    querySelector() { return makeEl(); }, querySelectorAll() { return []; },
    getContext() { return makeCtx(); },
    getBoundingClientRect() { return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }; },
  };
}

function loadGame() {
  const src = fs.readFileSync(path.join(__dirname, "..", "game.js"), "utf8");

  const elCache = {};
  const documentStub = {
    getElementById(id) { return elCache[id] || (elCache[id] = makeEl()); },
    querySelectorAll() { return []; },
    querySelector() { return makeEl(); },
    createElement() { return makeEl(); },
    addEventListener() {}, body: makeEl(),
  };
  const windowStub = {
    innerWidth: 800, innerHeight: 600, devicePixelRatio: 1,
    addEventListener() {}, removeEventListener() {},
    matchMedia() { return { matches: false, addEventListener() {} }; },
  };

  const sandbox = {
    console, Math, Date, JSON, Object, Array, String, Number, Boolean,
    isNaN, parseInt, parseFloat,
    performance: { now: () => Date.now() },
    document: documentStub,
    window: windowStub,
    navigator: {}, // serviceWorker を持たない → SW登録はスキップ
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
    setTimeout: () => 0, clearTimeout: () => {},
    setInterval: () => 0, clearInterval: () => {},
    confirm: () => false, alert: () => {},
  };
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  sandbox.window.self = sandbox;
  vm.createContext(sandbox);

  // game.js 末尾に内部値を公開するコードを連結（同じトップレベルのconstを参照できる）
  const epilogue = `
;globalThis.__GAME = {
  MONSTER_TYPES, WEAPONS, ARMORS, SKILLS, SLOTS, AREAS, QUESTS,
  RARE_MAT, VARIANT_CHANCE, VARIANT_MIN_KILLS,
  CRIT_MULT, DEF_K, ENRAGE_DMG, ENRAGE_HP, ENRAGE_SPEED, JUST_WINDOW, DODGE_INVULN,
  ELE_WEAK_MULT, ELE_RESIST_MULT, ELE_NEUTRAL_MULT,
  player,
  getAtk, getDef, getMaxHp, getJustWindow, elementalHit, skillVal, skillLevel, skillPoints,
  typeByName, weaponById, armorById, toVariant, monsterArea, areaUnlocked,
};`;

  vm.runInContext(src + epilogue, sandbox, { filename: "game.js" });
  return sandbox.__GAME;
}

module.exports = { loadGame };
