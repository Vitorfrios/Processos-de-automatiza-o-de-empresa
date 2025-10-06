const API_CONFIG = {
  projects: "http://localhost:3004",
  data: "http://localhost:3001",
}

const CALCULATION_CONSTANTS = {
  FLOW_COEFFICIENT: 0.827,
  SECONDS_PER_HOUR: 3600,
  FLOW_DIVISOR: 3.6,
  SAFETY_FACTOR: 1.25,
  PRESSURE_EXPONENT: 0.5,
}

const UI_CONSTANTS = {
  MINIMIZED_SYMBOL: "+",
  EXPANDED_SYMBOL: "−",
  SUCCESS_MESSAGE_DURATION: 5000,
  INITIAL_PROJECT_ID: 1001,
  COLLAPSED_CLASS: "collapsed",
}

const SESSION_STORAGE_KEY = "firstProjectIdOfSession"
const REMOVED_PROJECTS_KEY = "removedProjectsFromScreen"
const NORMALIZATION_DONE_KEY = "idsNormalizedOnServer"

// Estado mutável usando closure
let _systemConstants = null;
let _projectCounter = 0;
let _GeralCount = 0;

// Exportar funções para acessar e modificar o estado
export const systemConstants = {
  get: () => _systemConstants,
  set: (value) => {
    _systemConstants = value;
    console.log("[v0] systemConstants atualizado:", _systemConstants);
  }
};

export const projectCounter = {
  get: () => _projectCounter,
  set: (value) => {
    _projectCounter = value;
    console.log("[v0] projectCounter atualizado:", _projectCounter);
  },
  increment: () => {
    _projectCounter++;
    console.log("[v0] projectCounter incrementado:", _projectCounter);
    return _projectCounter;
  }
};

export const GeralCount = {
  get: () => _GeralCount,
  set: (value) => {
    _GeralCount = value;
    console.log("[v0] GeralCount atualizado:", _GeralCount);
  }
};

export {
  API_CONFIG,
  CALCULATION_CONSTANTS,
  UI_CONSTANTS,
  SESSION_STORAGE_KEY,
  REMOVED_PROJECTS_KEY,
  NORMALIZATION_DONE_KEY
}