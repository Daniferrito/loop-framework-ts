import tilesMap from "./WorldTerrain_Layer_tiledata";
import entitiesMap from "./WorldElements_Layer_tiledata";

import { EntityWithState, GenericCalc, Instruction, MoveInstruction, OnCompleteFunc, OnPartialFunc, State, TileMap, TileWithState } from "../State";

export type AT = "move" | "attack" | "interact" | "speak";
export type FullAT = "move" | AT;
export type P = {
  skills: {[key: string]: number};
  buffs: {[key: string]: number};
};
export type L = {
  stats: {
    body: number;
    spirit: number;
    heart: number;
  };
  spentLevels: number;
  xp: number;
  inventory: {[key: string]: number};
};
export type iP = {};
export type iL = {
  id: number;
  dId?: (t: number) => number;
  flags: number;
  options: EntityOptions;
  stacks?: number;
};

const staticFamiliarityGainFunction: (actionType: FullAT) => GenericCalc<AT, P, L, iP, iL> = (actionType) => (state, target, position) => {
  if ((target.timesPerformedThisLoop[actionType] ?? 0) === 0) {
    return 20 * 3;
  }
  return 20;
};
const randomInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;
const randomFamiliarityGainFunction: (actionType: FullAT) => GenericCalc<AT, P, L, iP, iL> = (actionType) => (state, target, position) => {
  if ((target.timesPerformedThisLoop[actionType] ?? 0) === 0) {
    return 20 * 3 * randomInRange(0.7, 1.3);
  }
  return 20 * randomInRange(0.7, 1.3);
};

const skillXpTheresholds = [ 150, 450, 900, 1500, 2250, 3150, 4200, 5400, 6750, 8250, 9900, 11700, 13650, 15750, 18000, 20400, 22950, 25650, 28500, 31500, 34650, 37950, 41400, 45000, 48750, 52650, 56700, 60900, 65250, 69750, 74400, 79200, 84150, 89250, 94500, 99900, 105450, 111150, 117000, 123000, 129150, 135450, 141900, 148500, 155250, 162150, 169200, 176400, 183750, 191250, 198900, 206700, 214650, 222750, 231000, 239400, 247950, 256650, 265500, 274500, ]

const skillLevel = (xp: number) => {
  for (let i = 0; i < skillXpTheresholds.length; i++) {
    if (xp < skillXpTheresholds[i]) {
      return i;
    }
  }
  throw new Error("Too much xp");
}

// const levelXpTheresholds = [ 150, 350, 600, 900, 1250, 1650, 2100, 2550, 3150, 3750, 4500, 5250, 6000, 6750, 7500, 8250, 9000, 9750, 10500, 11250, 12000, 12750, 13500, 14250, 15000, 15750, 16500, 17250, 18000, 18750, 19500, 20250, 21000, 21750, 22500, 23250, 24000, 24750, 25500, 26250, 27000, 27750, 28500, 29250, 30000, 30750, 31500, 32250, 33000, 33750, 34500, 35250, 36000, 36750, 37500, 38250, 39000, 39750, 40500, 41250, 42000, 42750, 43500, 44250, 45000, ]
const levelXpTheresholds = [ 150, 450, 900, 1500, 2250, 3150, 4200, 5400, 6750, 8250, 9900, 11700, 13650, 15750, 18000, 20400, 22950, 25650, 28500, 31500, 34650, 37950, 41400, 45000, 48750, 52650, 56700, 60900, 65250, 69750, 74400, 79200, 84150, 89250, 94500, 99900, 105450, 111150, 117000, 123000, 129150, 135450, 141900, 148500, 155250, 162150, 169200, 176400, 183750, 191250, 198900, 206700, 214650, 222750, 231000, 239400, 247950, 256650, 265500, 274500, ]

const playerLevel = (xp: number) => {
  for (let i = 0; i < levelXpTheresholds.length; i++) {
    if (xp < levelXpTheresholds[i]) {
      return i;
    }
  }
  throw new Error("Too much xp");
}

const handToHandFactor = 0.1;
const bodyControlFactor = 0.1;
export const getAttack = (state: State<AT, P, L, iP, iL>) => {
  const weaponAttack = 0;
  const baseAttack = 1;
  const bodyLevel = state.loopData.stats.body;
  const handToHandXp = state.persistentData.skills["HandToHand"] ?? 0;
  const handToHandLevel = skillLevel(handToHandXp);
  const bodyControlXp = state.persistentData.skills["BodyControl"] ?? 0;
  const bodyControlLevel = skillLevel(bodyControlXp);
  // ((((_playerBaseAttack + (_playerBodyLvl / 2)) + (clamp(_playerBodyLvl, 0, _bodyControlLevel) * _bodyControlFactor)) * (1 + _weaponAttackValue)) + (_handToHandLevel * _handToHandFactor))
  return (
    (((baseAttack + (bodyLevel / 2)) + (Math.min(bodyLevel, bodyControlLevel) * bodyControlFactor)) * (1 + weaponAttack)) + (handToHandLevel * handToHandFactor)
  )
}

const formula: (familiarity: number) => number = (familiarity) => {
  // Level is calculated with: floor(-(19/2)+(sqrt(8*xp+5415))/(2*sqrt(15)))
  // where xp is familiarity
  const level = Math.floor(
    -9.5 + Math.sqrt(8 * familiarity + 5415) / (2 * Math.sqrt(15))
  );
  // Multiplier is calculated with: pow(1+familiarityLvl/20,0.8)
  // where familiarityLvl is the level calculated above
  // console.log("Familiarity: ", familiarity, "Level: ", level, "Multiplier:", Math.pow(1 + level / 20, 0.8));
  return Math.pow(1 + level / 20, 0.8);
}
const fCFMemo: {
  [key: string]: GenericCalc<AT, P, L, iP, iL>
} = {}
const familiarityCostFormula: (baseCost: number, actionType: FullAT) => GenericCalc<AT, P, L, iP, iL> = (baseCost, actionType) => {
  const key = `${baseCost}-${actionType}`
  return fCFMemo[key] ?? (fCFMemo[key] = (state, target, position) => {
  const tile = state.tileMap.tiles[position.y][position.x];
  const tileFamiliarity = tile.familiarity[actionType] ?? 0;
  const entity = state.getEntity(tile);
  const entityFamiliarity = entity?.familiarity[actionType] ?? 0;
  return baseCost / formula(tileFamiliarity + entityFamiliarity);
})};

const fACMemo: {
  [key: string]: GenericCalc<AT, P, L, iP, iL>
} = {}
const attackCostFormula: (baseCost: number) => GenericCalc<AT, P, L, iP, iL> = (baseCost) => {
  const key = `${baseCost}`
  return fACMemo[key] ?? (fACMemo[key] = (state, target, position) => {
    const attack = getAttack(state);
    const tile = state.tileMap.tiles[position.y][position.x];
    const tileFamiliarity = tile.familiarity.attack ?? 0;
    const entity = state.getEntity(tile);
    const entityFamiliarity = entity?.familiarity.attack ?? 0;
    // console.log("Familiarity: ", tileFamiliarity + entityFamiliarity, "Attack: ", attack, "Tile", target.name);
    return baseCost / (formula(tileFamiliarity + entityFamiliarity) * attack);
  });
}

const infinityCostFormula: GenericCalc<AT, P, L, iP, iL> = () => Infinity;

const maxManaFormula: (state: State<AT, P, L, iP, iL>) => number = (state) => {
  return 500 + state.loopData.stats.spirit * 200;
}

const onCompleteReduceStacks: OnCompleteFunc<AT, P, L, iP, iL> = (state, target, position) => {
  target.loopData.stacks = target.loopData.stacks ?? 1 - 1;
  return true;
};

const dependantOnStacksAndFamiliarityFormula: (f: (stacks: number) => number, actionType: FullAT) => GenericCalc<AT, P, L, iP, iL> = (f, actionType) => (state, target, position) => {
  const r = f(target.loopData.stacks ?? 1);

  const tile = state.tileMap.tiles[position.y][position.x];
  const tileFamiliarity = tile.familiarity[actionType] ?? 0;
  const entity = state.getEntity(tile);
  const entityFamiliarity = entity?.familiarity[actionType] ?? 0;
  return r / formula(tileFamiliarity + entityFamiliarity);
};

const drinkPotion: OnPartialFunc<AT, P, L, iP, iL> = (state) => {
  if (state.mana.current * 10 < state.mana.max) {
    if (state.loopData.inventory["s_potion"] ?? 0 > 0) {
      state.mana.current += 500;
      state.mana.current = Math.min(state.mana.current, state.mana.max);
      state.loopData.inventory["s_potion"] = state.loopData.inventory["s_potion"] - 1;
    }
  }
};

function toTile(partial: Partial<TileWithState<AT, P, L, iP, iL>>): TileWithState<AT, P, L, iP, iL> {
  return {
    name: "",
    cost: {},
    familiarityGain: {},
    onPartialAction: {},
    onCompletedAction: {},
    familiarity: {},
    familiarityThisLoop: {},
    timesPerformed: {},
    timesPerformedThisLoop: {},
    entities: [],
    loopData: {
      id: 0,
      flags: 0,
      options: {
        flippedX: false,
        flippedY: false,
        rotate90: false,
      },
    },
    persistentData: {},
    ...partial,
  };
}

type TileGenerator = (loopData: iL) => TileWithState<AT, P, L, iP, iL>;

const defaultTile: (id: number, loopData: iL) => TileWithState<AT, P, L, iP, iL> = (id, loopData) => toTile({
  name: `Unknown tile: ${id}`,
  loopData,
});

export const crushedGrass: TileGenerator = (loopData) => toTile({
  name: "Crushed Grass",
  cost: {move: familiarityCostFormula(40, "move")},
  loopData,
});
export const grass: TileGenerator = (loopData) => toTile({
  name: "Grass",
  cost: {move: familiarityCostFormula(75, "move")},
  loopData,
});
export const muddyGrass: TileGenerator = (loopData) => toTile({
  name: "Muddy Grass",
  cost: {move: familiarityCostFormula(300, "move")},
  loopData,
});
export const floodedGrass: TileGenerator = (loopData) => toTile({
  name: "Flooded Grass",
  cost: {move: familiarityCostFormula(2000, "move")},
  loopData,
});
export const field: TileGenerator = (loopData) => toTile({
  name: "Field",
  cost: {move: familiarityCostFormula(80, "move")},
  loopData,
});
export const tiles: TileGenerator = (loopData) => toTile({
  name: "Tiles",
  cost: {move: familiarityCostFormula(70, "move")},
  loopData,
});
export const sewerDrain: TileGenerator = (loopData) => toTile({
  name: "Sewer drain",
  cost: {move: familiarityCostFormula(70, "move")},
  loopData,
});
export const royalCarpet: TileGenerator = (loopData) => toTile({
  name: "Royal Carpet",
  cost: {move: familiarityCostFormula(70, "move")},
  loopData,
});
export const snow: TileGenerator = (loopData) => toTile({
  name: "Snow",
  cost: {move: familiarityCostFormula(100, "move")},
  loopData,
});
export const path: TileGenerator = (loopData) => toTile({
  name: "Path",
  cost: {move: familiarityCostFormula(55, "move")},
  loopData,
});
export const mountainTrail: TileGenerator = (loopData) => toTile({
  name: "Mountain Trail",
  cost: {move: familiarityCostFormula(150, "move")},
  loopData,
});
export const stream: TileGenerator = (loopData) => toTile({
  name: "Stream",
  cost: {move: familiarityCostFormula(100, "move")},
  loopData,
});
export const woods: TileGenerator = (loopData) => toTile({
  name: "Woods",
  blocked: true,
  loopData,
});
export const cliff: TileGenerator = (loopData) => toTile({
  name: "Cliff",
  blocked: true,
  loopData,
});
export const water: TileGenerator = (loopData) => toTile({
  name: "Water",
  blocked: true,
  loopData,
});
export const rock: TileGenerator = (loopData) => toTile({
  name: "Rock",
  blocked: true,
  loopData,
});
export const voidTile: TileGenerator = (loopData) => toTile({
  name: "Void",
  blocked: true,
  loopData,
});

export const tileMapping: Partial<{[key: string]: TileGenerator}> = {
  5: grass,
  6: grass,
  8: grass,
  9: grass,
  48: grass,
  49: grass,
  50: grass,
  98: grass,
  99: grass,
  288: grass,
  175: grass,
  138: grass,

  64: crushedGrass,

  45: muddyGrass,

  11: floodedGrass,
  46: floodedGrass,
  47: floodedGrass,
  536870959: floodedGrass,
  805306415: floodedGrass,
  1879048239: floodedGrass,
  268435503: floodedGrass,

  212: field,
  213: field,
  214: field,
  252: field,
  253: field,
  254: field,
  292: field,
  293: field,
  294: field,

  68: water,

  27: tiles,
  28: tiles,
  19: tiles,
  20: tiles,
  29: tiles,
  30: tiles,
  31: tiles,
  55: tiles,
  56: tiles,
  57: tiles,
  58: tiles,
  59: tiles,
  60: tiles,
  67: tiles,
  69: tiles,
  70: tiles,
  71: tiles,
  // 69: tiles,
  107: tiles,
  108: tiles,
  109: tiles,
  110: tiles,
  301: tiles,

  380: sewerDrain,

  62: royalCarpet,

  117: snow,

  101: path,
  102: path,
  140: path,
  142: path,
  143: path,
  144: path,
  145: path,
  180: path,
  181: path,
  182: path,
  183: path,
  185: path,

  556: mountainTrail,
  596: mountainTrail,
  636: mountainTrail,
  676: mountainTrail,
  756: mountainTrail,
  796: mountainTrail,
  836: mountainTrail,
  876: mountainTrail,
  916: mountainTrail,
  
  154: stream,
  155: stream,
  156: stream,
  194: stream,
  196: stream,
  197: stream,
  198: stream,
  199: stream,
  234: stream,
  235: stream,
  236: stream,
  237: stream,
  238: stream,
  239: stream,
  277: stream,

  34: woods,
  36: woods,
  37: woods,
  54: woods,
  74: woods,
  75: woods,
  76: woods,
  78: woods,
  91: woods,
  92: woods,
  93: woods,
  94: woods,
  95: woods,
  96: woods,
  97: woods,
  114: woods,
  115: woods,
  116: woods,
  131: woods,
  132: woods,
  133: woods,
  134: woods,
  135: woods,
  136: woods,
  137: woods,
  147: woods,
  148: woods,
  149: woods,
  150: woods,
  151: woods,
  172: woods,
  171: woods,
  173: woods,
  174: woods,
  176: woods,
  187: woods,
  188: woods,
  189: woods,
  190: woods,
  191: woods,
  216: woods,
  227: woods,
  228: woods,
  229: woods,

  255: cliff,
  256: cliff,
  295: cliff,
  296: cliff,
  958: cliff,

  208: water,
  209: water,
  210: water,
  211: water,
  206: water,
  207: water,
  245: water,
  246: water,
  247: water,
  248: water,
  249: water,
  250: water,
  251: water,
  286: water,

  158: rock,
  754: rock,
  755: rock,
  794: rock,
  795: rock,
  834: rock,
  835: rock,
  874: rock,
  875: rock,
  914: rock,
  915: rock,
  514: rock,
  515: rock,
  554: rock,
  555: rock,
  594: rock,
  595: rock,
  634: rock,
  635: rock,
  717: rock,
  718: rock,
  757: rock,
  797: rock,
  798: rock,
  837: rock,
  838: rock,
  877: rock,
  878: rock,
  517: rock,
  518: rock,
  557: rock,
  558: rock,
  597: rock,
  598: rock,
  637: rock,
  638: rock,


  0: voidTile,
  7: voidTile,
};

function toEntity(partial: Partial<EntityWithState<AT, P, L, iP, iL>>): EntityWithState<AT, P, L, iP, iL> {
  return {
    active: true,
    name: "",
    cost: {},
    familiarityGain: {},
    onPartialAction: {},
    onCompletedAction: {},
    familiarity: {},
    familiarityThisLoop: {},
    timesPerformed: {},
    timesPerformedThisLoop: {},
    loopData: {
      id: 0,
      flags: 0,
      options: {
        flippedX: false,
        flippedY: false,
        rotate90: false,
      },
    },
    persistentData: {},
    ...partial,
  };
}

type EntityGenerator = (loopData: iL) => EntityWithState<AT, P, L, iP, iL>;

const defaultEntity: (id: number, loopData: iL) => EntityWithState<AT, P, L, iP, iL> = (id, loopData) => toEntity({
  name: `Unknown entity: ${id}`,
  loopData,
});

const oneFirefly: EntityGenerator = (loopData) => toEntity({
  name: "3ff",
  // TODO
  cost: {
    move: familiarityCostFormula(65, "move"),
    interact: familiarityCostFormula(100, "interact")
  },
  onCompletedAction: {
    interact: (state, target, position) => {
      if (target.loopData.stacks ?? 0 > 0) {
        state.mana.current += 500 + ( 50 * skillLevel(state.persistentData.skills["FireflyFriend"] ?? 0));
        state.mana.current = Math.min(state.mana.current, state.mana.max);
        state.loopData.xp += 75 * ( 1 + skillLevel(state.persistentData.skills["FireflyFriend"] ?? 0));
        target.loopData.stacks = (target.loopData.stacks ?? 1) - 1;
      }
      return true;
    }
  },
  loopData: {
    ...loopData,
    dId: (time) => {
      console.log("Getting id for 3ff: ", time, " => 200 + (time % 4) = ", 200 + (time % 4),)
      return 200 + (time % 4)
    },
    stacks: 1,
  },
});

const twoFireflies: EntityGenerator = (loopData) => toEntity({
  name: "3ff",
  // TODO
  cost: {
    move: familiarityCostFormula(65, "move"),
    interact: familiarityCostFormula(100, "interact")
  },
  onCompletedAction: {
    interact: (state, target, position) => {
      if (target.loopData.stacks ?? 0 > 0) {
        state.mana.current += 500 + ( 50 * skillLevel(state.persistentData.skills["FireflyFriend"] ?? 0));
        state.mana.current = Math.min(state.mana.current, state.mana.max);
        state.loopData.xp += 75 * ( 1 + skillLevel(state.persistentData.skills["FireflyFriend"] ?? 0));
        target.loopData.stacks = (target.loopData.stacks ?? 1) - 1;
      }
      return true;
    }
  },
  loopData: {
    ...loopData,
    dId: (time) => {
      console.log("Getting id for 3ff: ", time, " => 200 + (time % 4) = ", 200 + (time % 4),)
      return 200 + (time % 4)
    },
    stacks: 2,
  },
});

const threeFireflies: EntityGenerator = (loopData) => toEntity({
  name: "3ff",
  // TODO
  cost: {
    move: familiarityCostFormula(65, "move"),
    interact: familiarityCostFormula(100, "interact")
  },
  onCompletedAction: {
    interact: (state, target, position) => {
      if (target.loopData.stacks ?? 0 > 0) {
        state.mana.current += 500 + ( 50 * skillLevel(state.persistentData.skills["FireflyFriend"] ?? 0));
        state.mana.current = Math.min(state.mana.current, state.mana.max);
        state.loopData.xp += 75 * ( 1 + skillLevel(state.persistentData.skills["FireflyFriend"] ?? 0));
        target.loopData.stacks = (target.loopData.stacks ?? 1) - 1;
      }
      return true;
    }
  },
  loopData: {
    ...loopData,
    dId: (time) => {
      console.log("Getting id for 3ff: ", time, " => 200 + (time % 4) = ", 200 + (time % 4),)
      return 200 + (time % 4)
    },
    stacks: 3,
  },
});

const oldMan: EntityGenerator = (loopData) => toEntity({
  name: "Old man",
  onCompletedAction: {
    interact: (state, target, position) => {
      if (state.loopData.inventory["bat"] ?? 0 > 0) {
        state.loopData.inventory["s_potion"] = (state.loopData.inventory["s_potion"] ?? 0) + 1;
        state.loopData.inventory["bat"] = (state.loopData.inventory["bat"] ?? 1) - 1;
      }
      return true;
    }
  },
  cost: {
    move: familiarityCostFormula(100, "move"),
    attack: attackCostFormula(350),
    interact: familiarityCostFormula(200, "interact"),
    speak: familiarityCostFormula(200, "speak"),

  },
  loopData,
});

const fenceGate: EntityGenerator = (loopData) => toEntity({
  name: "Fence Gate",
  onCompletedAction: {
    attack: (state, target, position) => {
      const stack = target.loopData.stacks ?? 1;
      if (stack === 0) {
        return false
      } else {
        state.loopData.xp += 200;
        target.loopData.stacks = stack - 1;
        return true;
      }
    }
  },
  cost: {
    move: dependantOnStacksAndFamiliarityFormula((stacks) => (stacks === 0) ? 35 : Infinity, "move"), 
    attack: attackCostFormula(350)
  },
  // TODO
  loopData,
});

const fence: EntityGenerator = (loopData) => toEntity({
  name: "Fence",
  blocked: true,
  // TODO
  loopData,
});

const rats: EntityGenerator = (loopData) => toEntity({
  name: "Rats",
  cost: {move: familiarityCostFormula(50, "move"), attack: attackCostFormula(100)},
  onCompletedAction: {
    attack: (state, target, position) => {
      const stack = target.loopData.stacks ?? 1;
      if (stack === 0) {
        return false
      } else {
        // console.log("Gain xp", 150 * ( 1 + 0.1*(skillLevel(state.persistentData.skills["RodentAffinity"] ?? 0))), "affinity xp", state.persistentData.skills["RodentAffinity"] ?? 0, "affinity level", skillLevel(state.persistentData.skills["RodentAffinity"] ?? 0));
        state.loopData.xp += 150 * ( 1 + 0.1*(skillLevel(state.persistentData.skills["RodentAffinity"] ?? 0)));
        state.loopData.inventory["rodent"] = (state.loopData.inventory["rodent"] ?? 0) + 1;
        target.loopData.stacks = stack - 1;
        return true;
      }
    }
  },
  // TODO
  loopData: {
    ...loopData,
    stacks: 10,
  },
});

const critter: EntityGenerator = (loopData) => toEntity({
  name: "Critter",
  cost: {
    move: dependantOnStacksAndFamiliarityFormula((stacks) => (stacks === 0) ? 75 : 200 * stacks, "move"), 
    attack: attackCostFormula(100)
  },
  onCompletedAction: {
    attack: (state, target, position) => {
      const stack = target.loopData.stacks ?? 1;
      if (stack === 0) {
        return false
      } else {
        state.loopData.xp += 150 * ( 1 + 0.1*skillLevel(state.persistentData.skills["CritterAffinity"] ?? 0));
        state.loopData.inventory["tail"] = (state.loopData.inventory["tail"] ?? 0) + 1;
        target.loopData.stacks = stack - 1;
        return true;
      }
    }
  },
  // TODO
  loopData: {
    ...loopData,
    stacks: 1,
  },
});

const doubleCritter: EntityGenerator = (loopData) => toEntity({
  name: "Double Critter",
  cost: {
    move: dependantOnStacksAndFamiliarityFormula((stacks) => (stacks === 0) ? 75 : 200 * stacks, "move"), 
    attack: attackCostFormula(100)
  },
  onCompletedAction: {
    attack: (state, target, position) => {
      const stack = target.loopData.stacks ?? 1;
      if (stack === 0) {
        return false
      } else {
        state.loopData.xp += 1000 * ( 1 + 0.1*skillLevel(state.persistentData.skills["CritterAffinity"] ?? 0));
        state.loopData.inventory["tail"] = (state.loopData.inventory["tail"] ?? 0) + 1;
        target.loopData.stacks = stack - 1;
        return true;
      }
    }
  },
  // TODO
  loopData: {
    ...loopData,
    stacks: 2,
  },
});

const cave: EntityGenerator = (loopData) => toEntity({
  name: "Cave",
  cost: {
    move: familiarityCostFormula(100, "move"), 
    attack: attackCostFormula(300)
  },
  onCompletedAction: {
    attack: (state, target, position) => {
      const stack = target.loopData.stacks ?? 1;
      if (stack === 0) {
        return false
      } else {
        state.loopData.inventory["bat"] = (state.loopData.inventory["bat"] ?? 0) + 1;
        state.loopData.xp += 150;
        target.loopData.stacks = stack - 1;
        return true;
      }
    }
  },
  // TODO
  loopData: {
    ...loopData,
    stacks: 3,
  },
});

const barrel: EntityGenerator = (loopData) => toEntity({
  name: "Barrel",
  onCompletedAction: {
    interact: (state, target, position) => {
      if(target.loopData.stacks ?? 0 > 0) {
        state.loopData.inventory["s_potion"] = (state.loopData.inventory["s_potion"] ?? 0) + 1;
      }
      return true;
    }
  },
  cost: {
    move: familiarityCostFormula(100, "move"),
    interact: familiarityCostFormula(120, "interact"),
  },
  // TODO
  loopData: {
    ...loopData,
    stacks: 1,
  },
});

const scarecrow: EntityGenerator = (loopData) => toEntity({
  name: "Scarecrow",
  onCompletedAction: {
    interact: (state, target, position) => {
      if(target.loopData.stacks ?? 0 > 0) {
        state.persistentData.skills["HandToHand"] = (state.persistentData.skills["HandToHand"] ?? 0) + 25;
        state.loopData.xp += 200;
        target.loopData.stacks = (target.loopData.stacks ?? 1) - 1;
      }
      return true;
    }
  },
  cost: {
    move: familiarityCostFormula(100, "move"),
    interact: familiarityCostFormula(250, "interact"),
  },
  // TODO
  loopData: {
    ...loopData,
    stacks: 10,
  },
});

const carrot: EntityGenerator = (loopData) => toEntity({
  name: "Carrot",
  onCompletedAction: {
    interact: (state, target, position) => {
      if(target.loopData.stacks ?? 0 > 0) {
        state.loopData.inventory["carrot"] = (state.loopData.inventory["carrot"] ?? 0) + 1;
        target.loopData.stacks = (target.loopData.stacks ?? 1) - 1;
      }
      return true;
    }
  },
  cost: {
    move: familiarityCostFormula(100, "move"),
    interact: familiarityCostFormula(250, "interact"),
  },
  // TODO
  loopData: {
    ...loopData,
    stacks: 1,
  },
});

const altar: EntityGenerator = (loopData) => toEntity({
  name: "Altar",
  onCompletedAction: {
    interact: (state, target, position) => {
      if(state.loopData.spentLevels < playerLevel(state.loopData.xp)) {
        state.loopData.stats.spirit += 1;
        state.loopData.spentLevels += 1;
        state.mana.max = maxManaFormula(state);
        // console.log("You have increased your spirit level", state.loopData.spentLevels, playerLevel(state.loopData.xp), state.loopData.xp);
      } else {
        // console.log("You are already at the maximum level", state.loopData.spentLevels, playerLevel(state.loopData.xp), state.loopData.xp);
      }
      return true;
    },
    attack: (state, target, position) => {
      if(state.loopData.spentLevels < playerLevel(state.loopData.xp)) {
        state.loopData.stats.body += 1;
        state.loopData.spentLevels += 1;
        // console.log("You have increased your body level", state.loopData.spentLevels, playerLevel(state.loopData.xp), state.loopData.xp);
      }else {
        // console.log("You are already at the maximum level", state.loopData.spentLevels, playerLevel(state.loopData.xp), state.loopData.xp);
      }
      return true;
    },
    speak: (state, target, position) => {
      if(state.loopData.spentLevels < playerLevel(state.loopData.xp)) {
        state.loopData.stats.heart += 1;
        state.loopData.spentLevels += 1;
      }
      return true;
    },
  },
  cost: {
    move: familiarityCostFormula(65, "move"),
    interact: familiarityCostFormula(75, "interact"),
    attack: attackCostFormula(75),
    speak: familiarityCostFormula(75, "speak"),
  },
  // TODO
  loopData,
});

const ghost: EntityGenerator = (loopData) => toEntity({
  name: "Altar",
  onCompletedAction: {
    interact: (state, target, position) => {
      state.loopData.stats.spirit += 1;
      state.mana.max = maxManaFormula(state);
      return true;
    }
  },
  cost: {
    move: familiarityCostFormula(75, "move"),
    interact: familiarityCostFormula(75, "interact"),
    attack: attackCostFormula(75),
    speak: familiarityCostFormula(75, "speak"),
  },
  // TODO
  loopData,
});

const bonfire: EntityGenerator = (loopData) => toEntity({
  name: "Bonfire",
  onCompletedAction: {
    interact: (state, target, position) => {
      if(state.loopData.inventory["hat"] ?? 0 > 0) {
        state.persistentData.skills["VillagerAffinity"] = (state.persistentData.skills["VillagerAffinity"] ?? 0) + 115;
        state.loopData.inventory["hat"] = (state.loopData.inventory["hat"] ?? 1) - 1;
        state.loopData.xp += 200;
      } else if (state.loopData.inventory["tooth"] ?? 0 > 0) {
        state.persistentData.skills["BeastAffinity"] = (state.persistentData.skills["BeastAffinity"] ?? 0) + 165;
        state.loopData.inventory["tooth"] = (state.loopData.inventory["tooth"] ?? 1) - 1;
        state.loopData.xp += 200;
      } else if (state.loopData.inventory["tail"] ?? 0 > 0) {
        state.persistentData.skills["CritterAffinity"] = (state.persistentData.skills["CritterAffinity"] ?? 0) + 75;
        state.loopData.inventory["tail"] = (state.loopData.inventory["tail"] ?? 1) - 1;
        state.loopData.xp += 200;
      } else if (state.loopData.inventory["rodent"] ?? 0 > 0) {
        state.persistentData.skills["RodentAffinity"] = (state.persistentData.skills["RodentAffinity"] ?? 0) + 55;
        state.loopData.inventory["rodent"] = (state.loopData.inventory["rodent"] ?? 1) - 1;
        state.loopData.xp += 200;
      }
      return true;
    },
  },
  cost: {
    move: familiarityCostFormula(100, "move"),
    interact: familiarityCostFormula(200, "interact")
  },
  // TODO
  loopData,
});

export const entityMapping: Partial<{[key: string]: EntityGenerator}> = {
  560: oneFirefly,
  520: twoFireflies,
  200: threeFireflies,

  485: altar,
  1045: ghost,
  1125: bonfire,
  406: barrel,
  320: scarecrow,
  335: carrot,

  280: oldMan,

  327: fenceGate,
  244: rats,
  242: critter,
  282: doubleCritter,
  373: cave,


  367: fence,
};

export interface EntityOptions {
  flippedX: boolean;
  flippedY: boolean;
  rotate90: boolean;
  // rotate180: boolean;
}

const tileMap: (familiarityGainFunction: (actionType: FullAT) => GenericCalc<AT, P, L, iP, iL>) => TileMap<AT, P, L, iP, iL> = (
  fGF
) => {
  const fullMap: TileWithState<AT, P, L, iP, iL>[][] = [];
  // Read from ./WorldTerrain_Layer_tiledata
  tilesMap.forEach((mRow, y) => {
    const row: TileWithState<AT, P, L, iP, iL>[] = [];
    fullMap.push(row);
    mRow.forEach((id, x) => {
      if (x >= 107) {
        return;
      }
      const flags = id >> 8*3;
      id = id & 0xFFFF;
      const loopData: iL = {
        id: id,
        flags: flags,
        options: {
          flippedX: (flags & 0b00010000) > 0,
          flippedY: (flags & 0b00100000) > 0,
          rotate90: (flags & 0b01000000) > 0,
        }
      }
      // const options: EntityOptions = {
      //   flippedX: (flags & 0b00010000) > 0,
      //   flippedY: (flags & 0b00100000) > 0,
      //   rotate90: (flags & 0b01000000) > 0,
      // }
      const mappedTile = tileMapping[id];
      const tile = mappedTile ? mappedTile(loopData) : defaultTile(id, loopData);
      // tile.loopData = {
      //   id: id,
      //   flags: flags,
      //   options: options,
      // }
      row.push(tile);
    });
  });
  // Read from ./WorldElements_Layer_tiledata
  entitiesMap.forEach((mRow, y) => {
    mRow.forEach((id, x) => {
      if (id === 0) {
        return;
      }
      const flags = id >> 8*3;

      id = id & 0xFFFF;
      const loopData: iL = {
        id: id,
        flags: flags,
        options: {
          flippedX: (flags & 0b00010000) > 0,
          flippedY: (flags & 0b00100000) > 0,
          rotate90: (flags & 0b01000000) > 0,
        }
      }

      const mappedEntity = entityMapping[id];
      const entity = mappedEntity ? mappedEntity(loopData) : defaultEntity(id, loopData);

      fullMap[y][x].entities.push(entity);
    });
  });


  return {
  width: fullMap[0].length,
  height: fullMap.length,
  tiles: fullMap,
  entities: new Map(),
  defaults: {
    cost: {},
    familiarityGain: { move: fGF("move"), attack: fGF("attack"), interact: fGF("interact"), speak: fGF("speak") },
    onPartialAction: {},
    onCompletedAction: {},
  },
  always: {
    onPartialAction: {
      move: [drinkPotion],
      attack: [drinkPotion],
      interact: [drinkPotion],
      speak: [drinkPotion],
    },
    onCompletedAction: {},
  },
}};

const possibleActions: (Instruction<AT> | MoveInstruction)[] = [
  {
    name: "Up",
    type: "move",
    count: 1,
    movement:{
      x: 0,
      y: -1,
    },
  },
  {
    name: "Down",
    type: "move",
    count: 1,
    movement:{
      x: 0,
      y: 1,
    },
  },
  {
    name: "Left",
    type: "move",
    count: 1,
    movement:{
      x: -1,
      y: 0,
    },
  },
  {
    name: "Right",
    type: "move",
    count: 1,
    movement:{
      x: 1,
      y: 0,
    },
  },
  {
    name: "Interact",
    type: "interact",
    count: 1,
  },
  {
    name: "Attack",
    type: "attack",
    count: 1,
  },
  {
    name: "Speak",
    type: "speak",
    count: 1,
  },
];

interface Options {
  randomFamiliarity: boolean;
}

export const initialState: (options: Options) => State<AT, P, L, iP, iL> = (options) => {
  const { randomFamiliarity } = options;

  return new State<AT, P, L, iP, iL>(
    () => ({
      tileMap: tileMap(
        randomFamiliarity
          ? randomFamiliarityGainFunction
          : staticFamiliarityGainFunction
      ),
      possibleActions,
      initialPosition: { x: 61, y: 51 },
      mana: { current: 500, max: 500 },
      loopData: {
        stats: {
          body: 0,
          spirit: 0,
          heart: 0,
        },
        spentLevels: 0,
        xp: 0,
        inventory: {},
      },
      persistentData: {
        skills: {},
        buffs: {},
      }
    })
  );
};
