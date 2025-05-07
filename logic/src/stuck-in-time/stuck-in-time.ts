import tilesMap from "./WorldTerrain_Layer_tiledata";
import entitiesMap from "./WorldElements_Layer_tiledata";
import { ActionDefinition, Cell, FullTile, GenericCalc, OnCompleteFunc, OnPartialFunc, PerActionType, State, Tile, TileDefinition, TileMap } from "..";

export type AT = "move" | "attack" | "interact" | "speak"
export const SitActionTypes = ["move", "attack", "interact", "speak"] as const;
type AD = { x?: number, y?: number };
type TP = {
  familiarity: PerActionType<AT, number>;
};
type TL = {
  stacks?: number;
  timesPerformedThisLoop: PerActionType<AT, number>;
  blocked?: boolean;
  options: {
    flippedX: boolean,
    flippedY: boolean,
    rotate90: boolean,
  };
};
type TDL = {
  id: number;
  ghostLevel?: number;
  goldLevel?: number;
};
type CP = {};
type CL = {};
type GP = {
  skills: { [key: string]: number };
  buffs: { [key: string]: number };
};
type GL = {
  mana: {
    current: number;
    max: number;
  }
  stats: {
    body: number;
    spirit: number;
    heart: number;
  };
  spentLevels: number;
  xp: number;
  inventory: { [key: string]: number };
};
export class SITState extends State<AT, AD, TP, TL, TDL, CP, CL, GP, GL> { };
export type SITTileMap = TileMap<AT, AD, TP, TL, TDL, CP, CL, GP, GL>;
export type SITCell = Cell<TP, TL>;
export type SITTile = Tile<TP, TL>;
export type SITFullTile = FullTile<AT, AD, TP, TL, TDL, CP, CL, GP, GL>;
export type SITTileDefinition = TileDefinition<AT, AD, TP, TL, TDL, CP, CL, GP, GL>;
export type SITGenericCalc = GenericCalc<AT, AD, TP, TL, TDL, CP, CL, GP, GL>;
export type SITOnCompleteFunc = OnCompleteFunc<AT, AD, TP, TL, TDL, CP, CL, GP, GL>;
export type SITOnPartialFunc = OnPartialFunc<AT, AD, TP, TL, TDL, CP, CL, GP, GL>;
export type SITActionDefinition = ActionDefinition<AT, AD>;

const staticFamiliarityGainFunction: SITOnCompleteFunc = ({ action, target }) => {
  let toGain = 0;
  const timesPerformedThisLoop = target.loopData.timesPerformedThisLoop[action.type] ?? 0;
  if (timesPerformedThisLoop === 0) {
    toGain = 20 * 3;
  } else {
    toGain = 20;
  }
  target.persistentData.familiarity[action.type] = (target.persistentData.familiarity[action.type] ?? 0) + toGain;
  target.loopData.timesPerformedThisLoop[action.type] = timesPerformedThisLoop + 1;
};
const randomInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;
const randomFamiliarityGainFunction: SITOnCompleteFunc = ({ action, target }) => {
  let toGain = 0;
  const timesPerformedThisLoop = target.loopData.timesPerformedThisLoop[action.type] ?? 0;
  if (timesPerformedThisLoop === 0) {
    toGain = 20 * 3 * randomInRange(0.7, 1.3);
  } else {
    toGain = 20 * randomInRange(0.7, 1.3);
  }
  target.persistentData.familiarity[action.type] = (target.persistentData.familiarity[action.type] ?? 0) + toGain;
  target.loopData.timesPerformedThisLoop[action.type] = timesPerformedThisLoop + 1;
};

const skillXpTheresholds = [150, 450, 900, 1500, 2250, 3150, 4200, 5400, 6750, 8250, 9900, 11700, 13650, 15750, 18000, 20400, 22950, 25650, 28500, 31500, 34650, 37950, 41400, 45000, 48750, 52650, 56700, 60900, 65250, 69750, 74400, 79200, 84150, 89250, 94500, 99900, 105450, 111150, 117000, 123000, 129150, 135450, 141900, 148500, 155250, 162150, 169200, 176400, 183750, 191250, 198900, 206700, 214650, 222750, 231000, 239400, 247950, 256650, 265500, 274500,]

const skillLevel = (xp: number) => {
  for (let i = 0; i < skillXpTheresholds.length; i++) {
    if (xp < skillXpTheresholds[i]) {
      return i;
    }
  }
  throw new Error("Too much xp");
}

// const levelXpTheresholds = [ 150, 350, 600, 900, 1250, 1650, 2100, 2550, 3150, 3750, 4500, 5250, 6000, 6750, 7500, 8250, 9000, 9750, 10500, 11250, 12000, 12750, 13500, 14250, 15000, 15750, 16500, 17250, 18000, 18750, 19500, 20250, 21000, 21750, 22500, 23250, 24000, 24750, 25500, 26250, 27000, 27750, 28500, 29250, 30000, 30750, 31500, 32250, 33000, 33750, 34500, 35250, 36000, 36750, 37500, 38250, 39000, 39750, 40500, 41250, 42000, 42750, 43500, 44250, 45000, ]
const levelXpTheresholds = [150, 450, 900, 1500, 2250, 3150, 4200, 5400, 6750, 8250, 9900, 11700, 13650, 15750, 18000, 20400, 22950, 25650, 28500, 31500, 34650, 37950, 41400, 45000, 48750, 52650, 56700, 60900, 65250, 69750, 74400, 79200, 84150, 89250, 94500, 99900, 105450, 111150, 117000, 123000, 129150, 135450, 141900, 148500, 155250, 162150, 169200, 176400, 183750, 191250, 198900, 206700, 214650, 222750, 231000, 239400, 247950, 256650, 265500, 274500,]

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
export const getAttack = (state: SITState) => {
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

export const getFamiliarityLevel: (familiarity: number) => number = (familiarity) => {
  return Math.floor(
    -9.5 + Math.sqrt(8 * familiarity + 5415) / (2 * Math.sqrt(15))
  );
}

const getFamiliarityCostDivider: (familiarity: number) => number = (familiarity) => {
  // Level is calculated with: floor(-(19/2)+(sqrt(8*xp+5415))/(2*sqrt(15)))
  // where xp is familiarity
  const level = getFamiliarityLevel(familiarity);
  // Multiplier is calculated with: pow(1+familiarityLvl/20,0.8)
  // where familiarityLvl is the level calculated above
  // console.log("Familiarity: ", familiarity, "Level: ", level, "Multiplier:", Math.pow(1 + level / 20, 0.8));
  return (1 + level / 20) ** 0.8;
}
const fCFMemo: {
  [key: string]: SITGenericCalc
} = {}
const familiarityCostFormula: (baseCost: number, actionType: AT) => SITGenericCalc = (baseCost, actionType) => {
  const key = `${baseCost}-${actionType}`
  return fCFMemo[key] ?? (fCFMemo[key] = ({ target }) => {
    const targetFamiliarity = target.persistentData.familiarity[actionType] ?? 0;
    return baseCost / getFamiliarityCostDivider(targetFamiliarity);
  })
};

const fACMemo: {
  [key: string]: SITGenericCalc
} = {}
const attackCostFormula: (baseCost: number) => SITGenericCalc = (baseCost) => {
  const key = `${baseCost}`
  return fACMemo[key] ?? (fACMemo[key] = ({ state, target }) => {
    const attack = getAttack(state);
    const targetFamiliarity = target.persistentData.familiarity.attack ?? 0;
    // console.log("Familiarity: ", tileFamiliarity + entityFamiliarity, "Attack: ", attack, "Tile", target.name);
    return baseCost / (getFamiliarityCostDivider(targetFamiliarity) * attack);
  });
}

const maxManaFormula: (state: SITState) => number = (state) => {
  return 500 + state.loopData.stats.spirit * 200;
}

const dependantOnStacksAndFamiliarityFormula: (f: (stacks: number) => number, actionType: AT) => SITGenericCalc = (f, actionType) => ({ target }) => {
  const r = f(target.loopData.stacks ?? 1);
  const targetFamiliarity = target.persistentData.familiarity[actionType] ?? 0;
  return r / getFamiliarityCostDivider(targetFamiliarity);
};

const move: SITOnCompleteFunc = ({ state, action }) => {
  const oP = state.characters[0].position;
  const dP = action.data;
  const newPosition = { i: oP.i, j: oP.j, x: oP.x + (dP.x ?? 0), y: oP.y + (dP.y ?? 0) };
  const cell = state.getCell(newPosition);
  if (cell.tiles.some(tile => tile.loopData.blocked === true)) {
    throw new Error("Can't move there");
    return
  }
  state.characters[0].position = { i: oP.i, j: oP.j, x: oP.x + (dP.x ?? 0), y: oP.y + (dP.y ?? 0) };
  return false;
}

const reduceMana: SITOnPartialFunc = ({ state, spentMana }) => {
  state.loopData.mana.current -= spentMana;
}

const drinkPotion: SITOnPartialFunc = ({ state }) => {
  if (state.loopData.mana.current * 10 < state.loopData.mana.max) {
    if (state.loopData.inventory["s_potion"] ?? 0 > 0) {
      state.loopData.mana.current += 500;
      state.loopData.mana.current = Math.min(state.loopData.mana.current, state.loopData.mana.max);
      state.loopData.inventory["s_potion"] = state.loopData.inventory["s_potion"] - 1;
    }
  }
};

// function toTile(partial: Partial<SITTileDefinition>): SITTileDefinition {
//   return {
//     name: "",
//     ...partial,
//   };
// }

type TileGenerator = (definitionLoopData: TDL, loopData: TL) => { definition: SITTileDefinition, loopData: TL, persistentData?: TP, disabled?: boolean };

const defaultTile: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: `Unknown tile: ${definitionLoopData.id}`,
    definitionLoopData,
  },
  loopData,
});

export const crushedGrass: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Crushed Grass",
    cost: { move: familiarityCostFormula(40, "move") },
    definitionLoopData,
  },
  loopData,
});
export const grass: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Grass",
    cost: { move: familiarityCostFormula(75, "move") },
    definitionLoopData,
  },
  loopData,
});
export const muddyGrass: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Muddy Grass",
    cost: { move: familiarityCostFormula(300, "move") },
    definitionLoopData,
  },
  loopData,
});
export const floodedGrass: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Flooded Grass",
    cost: { move: familiarityCostFormula(2000, "move") },
    definitionLoopData,
  },
  loopData,
});
export const field: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Field",
    cost: { move: familiarityCostFormula(80, "move") },
    definitionLoopData,
  },
  loopData,
});
export const tiles: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Tiles",
    cost: { move: familiarityCostFormula(70, "move") },
    definitionLoopData,
  },
  loopData,
});
export const sewerDrain: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Sewer drain",
    cost: { move: familiarityCostFormula(70, "move") },
    definitionLoopData,
  },
  loopData,
});
export const royalCarpet: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Royal Carpet",
    cost: { move: familiarityCostFormula(70, "move") },
    definitionLoopData,
  },
  loopData,
});
export const snow: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Snow",
    cost: { move: familiarityCostFormula(100, "move") },
    definitionLoopData,
  },
  loopData,
});
export const path: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Path",
    cost: { move: familiarityCostFormula(55, "move") },
    definitionLoopData,
  },
  loopData,
});
export const mountainTrail: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Mountain Trail",
    cost: { move: familiarityCostFormula(150, "move") },
    definitionLoopData,
  },
  loopData,
});
export const stream: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Stream",
    cost: { move: familiarityCostFormula(100, "move") },
    definitionLoopData,
  },
  loopData,
});
export const woods: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Woods",
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    blocked: true,
  },
});
export const cliff: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Cliff",
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    blocked: true,
  },
});
export const water: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Water",
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    blocked: true,
  },
});
export const rock: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Rock",
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    blocked: true,
  },
});
export const voidTile: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Void",
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    blocked: true,
  },
});

export const tileMapping: { [key in number]?: TileGenerator } = {
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
  329: woods,
  376: woods,

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

const fireflyDefinition: SITTileDefinition = {
  name: "3ff",
  // TODO
  cost: {
    move: familiarityCostFormula(65, "move"),
    interact: familiarityCostFormula(100, "interact")
  },
  callbacks: {
    onCompleteAction: {
      interact: [({ state, target }) => {
        if (target.loopData.stacks ?? 0 > 0) {
          state.loopData.mana.current += 500 + (50 * skillLevel(state.persistentData.skills["FireflyFriend"] ?? 0));
          state.loopData.mana.current = Math.min(state.loopData.mana.current, state.loopData.mana.max);
          state.loopData.xp += 75 * (1 + skillLevel(state.persistentData.skills["FireflyFriend"] ?? 0));
          target.loopData.stacks = (target.loopData.stacks ?? 1) - 1;
        }
        return true;
      }]
    },
  },
  definitionLoopData: {
    id: 0,
  },
};

const oneFirefly: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    ...fireflyDefinition,
    name: "1ff",
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    stacks: 1,
  }
});

const twoFireflies: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    ...fireflyDefinition,
    name: "2ff",
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    stacks: 2,
  }
});

const threeFireflies: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    ...fireflyDefinition,
    name: "3ff",
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    stacks: 3,
  }
});

const oldMan: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Old man",
    callbacks: {
      onCompleteAction: {
        interact: [({ state }) => {
          if (state.loopData.inventory["bat"] ?? 0 > 0) {
            state.loopData.inventory["s_potion"] = (state.loopData.inventory["s_potion"] ?? 0) + 1;
            state.loopData.inventory["bat"] = (state.loopData.inventory["bat"] ?? 1) - 1;
          }
          return true;
        }]
      },
    },
    cost: {
      move: familiarityCostFormula(100, "move"),
      attack: attackCostFormula(350),
      interact: familiarityCostFormula(200, "interact"),
      speak: familiarityCostFormula(200, "speak"),

    },
    definitionLoopData,
  },
  loopData,
});

const fenceGate: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Fence Gate",
    callbacks: {
      onCompleteAction: {
        attack: [({ state, target }) => {
          const stack = target.loopData.stacks ?? 1;
          if (stack === 0) {
            return false
          } else {
            state.loopData.xp += 200;
            target.loopData.stacks = stack - 1;
            return true;
          }
        }]
      },
    },
    cost: {
      move: dependantOnStacksAndFamiliarityFormula((stacks) => (stacks === 0) ? 35 : Infinity, "move"),
      attack: attackCostFormula(350)
    },
    // TODO
    definitionLoopData,
  },
  loopData,
});

const fence: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Fence",
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    blocked: true,
  },
});

const rats: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Rats",
    cost: { move: familiarityCostFormula(50, "move"), attack: attackCostFormula(100) },
    callbacks: {
      onCompleteAction: {
        attack: [({ state, target }) => {
          const stack = target.loopData.stacks ?? 1;
          if (stack === 0) {
            return false
          } else {
            // console.log("Gain xp", 150 * ( 1 + 0.1*(skillLevel(state.persistentData.skills["RodentAffinity"] ?? 0))), "affinity xp", state.persistentData.skills["RodentAffinity"] ?? 0, "affinity level", skillLevel(state.persistentData.skills["RodentAffinity"] ?? 0));
            state.loopData.xp += 150 * (1 + 0.1 * (skillLevel(state.persistentData.skills["RodentAffinity"] ?? 0)));
            state.loopData.inventory["rodent"] = (state.loopData.inventory["rodent"] ?? 0) + 1;
            target.loopData.stacks = stack - 1;
            return true;
          }
        }]
      },
    },
    // TODO
    definitionLoopData: {
      ...definitionLoopData,
    },
  },
  loopData: {
    ...loopData,
    stacks: 10,
  },
});

const critterDefinition: SITTileDefinition = {
  name: "Critter",
  cost: {
    move: dependantOnStacksAndFamiliarityFormula((stacks) => (stacks === 0) ? 75 : 200 * stacks, "move"),
    attack: attackCostFormula(100)
  },
  callbacks: {
    onCompleteAction: {
      attack: [({ state, target }) => {
        const stack = target.loopData.stacks ?? 1;
        if (stack === 0) {
          return false
        } else {
          state.loopData.xp += 150 * (1 + 0.1 * skillLevel(state.persistentData.skills["CritterAffinity"] ?? 0));
          state.loopData.inventory["tail"] = (state.loopData.inventory["tail"] ?? 0) + 1;
          target.loopData.stacks = stack - 1;
          return true;
        }
      }]
    },
  },
  definitionLoopData: {
    id: 0,
  },
};

const critter: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    ...critterDefinition,
    name: "Critter",
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    stacks: 1,
  },
});

const doubleCritter: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    ...critterDefinition,
    name: "Double Critter",
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    stacks: 2,
  },
});

const wereCritter: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Were Critter",
    cost: {
      move: dependantOnStacksAndFamiliarityFormula((stacks) => (stacks === 0) ? 75 : 200 * stacks, "move"),
      attack: attackCostFormula(4000)
    },
    callbacks: {
      onCompleteAction: {
        attack: [({ state, target }) => {
          const stack = target.loopData.stacks ?? 1;
          if (stack === 0) {
            return false
          } else {
            state.loopData.xp += 3000 * (1 + 0.1 * skillLevel(state.persistentData.skills["CritterAffinity"] ?? 0));
            state.loopData.inventory["tail"] = (state.loopData.inventory["tail"] ?? 0) + 1;
            target.loopData.stacks = stack - 1;
            return true;
          }
        }]
      },
    },
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    stacks: 1,
  },
});

const beast: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Beast",
    cost: {
      move: dependantOnStacksAndFamiliarityFormula((stacks) => (stacks === 0) ? 100 : Infinity, "move"),
      attack: attackCostFormula(7500)
    },
    callbacks: {
      onCompleteAction: {
        attack: [({ state, target }) => {
          const stack = target.loopData.stacks ?? 1;
          if (stack === 0) {
            return false
          } else {
            state.loopData.xp += 7000 * (1 + 0.1 * skillLevel(state.persistentData.skills["BeastAffinity"] ?? 0));
            state.loopData.inventory["tooth"] = (state.loopData.inventory["tooth"] ?? 0) + 1;
            target.loopData.stacks = stack - 1;
            return true;
          }
        }]
      },
    },
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    stacks: 1,
  },
});

const hydra: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Hydra",
    cost: {
      move: dependantOnStacksAndFamiliarityFormula((stacks) => (stacks === 0) ? 300 : Infinity, "move"),
      attack: attackCostFormula(20_000)
    },
    callbacks: {
      onCompleteAction: {
        attack: [({ state, target }) => {
          const stack = target.loopData.stacks ?? 1;
          if (stack === 0) {
            return false
          } else {
            state.loopData.xp += 7000;
            target.loopData.stacks = stack - 1;
            return true;
          }
        }]
      },
    },
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    stacks: 1,
  },
});

const fireBat: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Fire Bat",
    cost: {
      // TODO fill this
      // move: dependantOnStacksAndFamiliarityFormula((stacks) => (stacks === 0) ? 100 : Infinity, "move"),
      attack: attackCostFormula(3000)
    },
    callbacks: {
      onCompleteAction: {
        attack: [({ state, target }) => {
          const stack = target.loopData.stacks ?? 1;
          if (stack === 0) {
            return false
          } else {
            state.loopData.xp += 3000;
            state.persistentData.skills["SpiritControl"] = (state.persistentData.skills["SpiritControl"] ?? 0) + 50;
            target.loopData.stacks = stack - 1;
            return true;
          }
        }]
      },
    },
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    stacks: 1,
  },
});

const cave: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Cave",
    cost: {
      move: familiarityCostFormula(100, "move"),
      attack: attackCostFormula(300)
    },
    callbacks: {
      onCompleteAction: {
        attack: [({ state, target }) => {
          const stack = target.loopData.stacks ?? 1;
          if (stack === 0) {
            return false
          } else {
            state.loopData.inventory["bat"] = (state.loopData.inventory["bat"] ?? 0) + 1;
            state.loopData.xp += 150;
            target.loopData.stacks = stack - 1;
            return true;
          }
        }]
      },
    },
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    stacks: 3,
  },
});

const barrel: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Barrel",
    callbacks: {
      onCompleteAction: {
        interact: [({ state, target }) => {
          const stack = target.loopData.stacks ?? 1;
          if (stack ?? 0 > 0) {
            state.loopData.inventory["s_potion"] = (state.loopData.inventory["s_potion"] ?? 0) + 1;
            target.loopData.stacks = stack - 1;
          }
          return true;
        }]
      },
    },
    cost: {
      move: familiarityCostFormula(100, "move"),
      interact: familiarityCostFormula(120, "interact"),
    },
    // TODO
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    stacks: 1,
  },
});

const scarecrowDefinition: SITTileDefinition = {
  name: "Scarecrow",
  cost: {
    move: familiarityCostFormula(100, "move"),
    interact: familiarityCostFormula(250, "interact"),
  },
  callbacks: {
    onCompleteAction: {
      interact: [({ state, target }) => {
        const stack = target.loopData.stacks ?? 1;
        if (stack ?? 0 > 0) {
          state.persistentData.skills["HandToHand"] = (state.persistentData.skills["HandToHand"] ?? 0) + 25;
          state.loopData.xp += 200;
          target.loopData.stacks = (target.loopData.stacks ?? 1) - 1;
        }
        return true;
      }]
    },
  },
  definitionLoopData: {
    id: 0,
  },
};

const flimsyScarecrow: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    ...scarecrowDefinition,
    name: "Flimsy Scarecrow",
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    stacks: 10,
  },
});

const toughScarecrow: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    ...scarecrowDefinition,
    name: "Tough Scarecrow",
    definitionLoopData,
  },
  loopData: {
    ...loopData,
    stacks: 100,
  },
});

const carrot: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Carrot",
    callbacks: {
      onCompleteAction: {
        interact: [({ state, target }) => {
          const stack = target.loopData.stacks ?? 1;
          if (stack ?? 0 > 0) {
            state.loopData.inventory["carrot"] = (state.loopData.inventory["carrot"] ?? 0) + 1;
            target.loopData.stacks = stack - 1;
          }
          return true;
        }]
      },
    },
    cost: {
      move: familiarityCostFormula(100, "move"),
      interact: familiarityCostFormula(250, "interact"),
    },
    // TODO
    definitionLoopData: {
      ...definitionLoopData,
      stacks: 1,
    },
  },
  loopData,
});

const altar: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Altar",
    callbacks: {
      onCompleteAction: {
        interact: [({ state }) => {
          if (state.loopData.spentLevels < playerLevel(state.loopData.xp)) {
            state.loopData.stats.spirit += 1;
            state.loopData.spentLevels += 1;
            state.loopData.mana.max = maxManaFormula(state);
            // console.log("You have increased your spirit level", state.loopData.spentLevels, playerLevel(state.loopData.xp), state.loopData.xp);
          } else {
            // console.log("You are already at the maximum level", state.loopData.spentLevels, playerLevel(state.loopData.xp), state.loopData.xp);
          }
          return true;
        }],
        attack: [({ state }) => {
          if (state.loopData.spentLevels < playerLevel(state.loopData.xp)) {
            state.loopData.stats.body += 1;
            state.loopData.spentLevels += 1;
            // console.log("You have increased your body level", state.loopData.spentLevels, playerLevel(state.loopData.xp), state.loopData.xp);
          } else {
            // console.log("You are already at the maximum level", state.loopData.spentLevels, playerLevel(state.loopData.xp), state.loopData.xp);
          }
          return true;
        }],
        speak: [({ state }) => {
          if (state.loopData.spentLevels < playerLevel(state.loopData.xp)) {
            state.loopData.stats.heart += 1;
            state.loopData.spentLevels += 1;
          }
          return true;
        }],
      },
    },
    cost: {
      move: familiarityCostFormula(65, "move"),
      interact: familiarityCostFormula(75, "interact"),
      attack: attackCostFormula(75),
      speak: familiarityCostFormula(75, "speak"),
    },
    // TODO
    definitionLoopData,
  },
  loopData,
});

const ghost: (ghostLevel: number) => TileGenerator = (ghostLevel) => (definitionLoopData, loopData) => ({
  definition: {
    name: "Ghost",
    callbacks: {
      onCompleteAction: {
        interact: [({ state }) => {
          state.loopData.stats.spirit += 1;
          state.loopData.mana.max = maxManaFormula(state);
          return true;
        }]
      },
    },
    cost: {
      move: familiarityCostFormula(75, "move"),
      interact: familiarityCostFormula(75, "interact"),
      attack: attackCostFormula(75),
      speak: familiarityCostFormula(75, "speak"),
    },
    // TODO
    definitionLoopData: {
      ...definitionLoopData,
      ghostLevel,
    },
  },
  loopData,
});

const chancellorGhost: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Chancellor Ghost",
    callbacks: {
    },
    cost: {
      speak: familiarityCostFormula(4000, "speak"),
    },
    // TODO
    definitionLoopData: {
      ...definitionLoopData,
      ghostLevel: 1,
    },
  },
  loopData,
});

const bonfire: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Bonfire",
    callbacks: {
      onCompleteAction: {
        interact: [({ state }) => {
          if (state.loopData.inventory["hat"] ?? 0 > 0) {
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
        }],
      },
    },
    cost: {
      move: familiarityCostFormula(100, "move"),
      interact: familiarityCostFormula(200, "interact")
    },
    // TODO
    definitionLoopData,
  },
  loopData,
});

const hiddenCacheDefinition: SITTileDefinition = {
  name: "Hidden Cache",
  cost: {
    move: familiarityCostFormula(75, "move"),
    interact: familiarityCostFormula(250, "interact"),
  },
  definitionLoopData: {
    id: 0,
  },
};

const hiddenCache:(goldLevel: number) => TileGenerator = (goldLevel) => (definitionLoopData, loopData) => ({
  definition: {
    ...hiddenCacheDefinition,
    name: "Hidden Cache",
    cost: {
      move: familiarityCostFormula(75, "move"),
      interact: familiarityCostFormula(250, "interact"),
    },
    // TODO
    definitionLoopData: {
      ...definitionLoopData,
      goldLevel,
    },
  },
  loopData,
});

const visualEntity: TileGenerator = (definitionLoopData, loopData) => ({
  definition: {
    name: "Visual entity",
    definitionLoopData,
  },
  loopData,
  disabled: true,
});

export const entityMapping: { [key in number]?: TileGenerator } = {
  560: oneFirefly,
  520: twoFireflies,
  200: threeFireflies,

  485: altar,

  644: ghost(1),
  965: ghost(2),
  1005: ghost(3),
  1045: ghost(4),
  1085: ghost(5),

  890: chancellorGhost,

  1125: bonfire,
  406: barrel,
  320: flimsyScarecrow,
  926: toughScarecrow,
  335: carrot,

  280: oldMan,

  327: fenceGate,
  244: rats,
  242: critter,
  282: doubleCritter,
  848: wereCritter,
  240: beast,
  885: hydra,
  680: fireBat,
  373: cave,

  // TODO - check that the values are right
  572: hiddenCache(1),
  613: hiddenCache(2),
  653: hiddenCache(3),
  693: hiddenCache(4),
  734: hiddenCache(5),
  367: fence,
  365: fence,

  405: visualEntity,
};

export interface EntityOptions {
  flippedX: boolean;
  flippedY: boolean;
  rotate90: boolean;
  // rotate180: boolean;
}

const tileMap: () => SITTileMap = () => {
  const cells: SITCell[][][][] = [[[]]];
  const tileDefinitions: { [key: number]: SITTileDefinition } = {};
  function idToTile(id: number): SITTile {
    const flags = id >> 8 * 3;
    id &= 0xFF_FF;
    const definitionLoopData: TDL = {
      id,
      // flags: flags,
    };
    const baseLoopData: TL = {
      timesPerformedThisLoop: {},
      options: {
        flippedX: (flags & 16) > 0,
        flippedY: (flags & 32) > 0,
        rotate90: (flags & 64) > 0,
      }
    }

    const mappedTile = tileMapping[id] ?? entityMapping[id];
    const { definition, loopData, persistentData, disabled } = mappedTile ? mappedTile(definitionLoopData, baseLoopData) : defaultTile(definitionLoopData, baseLoopData);
    if (!(id in tileDefinitions)) {
      tileDefinitions[id] = definition;
    }
    return {
      id,
      persistentData: {
        familiarity: {},
        ...persistentData,
      },
      loopData,
      disabled,
    };
  }
  // Read from ./WorldTerrain_Layer_tiledata
  tilesMap.forEach((mRow, _y) => {
    const row: SITCell[] = [];
    cells[0][0].push(row);
    mRow.forEach((id, x) => {
      if (x >= 107) {
        return;
      }
      const tile = idToTile(id);
      const cell: SITCell = {
        tiles: [tile],
      };
      row.push(cell);
    });
  });
  // Read from ./WorldElements_Layer_tiledata
  entitiesMap.forEach((mRow, y) => {
    mRow.forEach((id, x) => {
      if (id === 0) {
        return;
      }
      const tile = idToTile(id);
      cells[0][0][y][x].tiles.unshift(tile);
    });
  });


  return {
    cells,
    tileDefinitions,
  }
};

const possibleActions: (ActionDefinition<AT, AD>)[] = [
  {
    name: "Up",
    type: "move",
    data: {
      x: 0,
      y: -1,
    },
  },
  {
    name: "Down",
    type: "move",
    data: {
      x: 0,
      y: 1,
    },
  },
  {
    name: "Left",
    type: "move",
    data: {
      x: -1,
      y: 0,
    },
  },
  {
    name: "Right",
    type: "move",
    data: {
      x: 1,
      y: 0,
    },
  },
  {
    name: "Interact",
    type: "interact",
    data: {},
  },
  {
    name: "Attack",
    type: "attack",
    data: {},
  },
  {
    name: "Speak",
    type: "speak",
    data: {},
  },
];

interface Options {
  randomFamiliarity: boolean;
}

export const initialState: (options: Options) => SITState = (options) => {
  const { randomFamiliarity } = options;

  return new SITState(
    () => ({
      tileMap: tileMap(),
      characters: [{
        name: "Player",
        position: { i: 0, j: 0, x: 61, y: 51 },
        actionList: {
          actions: [],
          index: 0,
          subIndex: 0,
          spentActionMana: 0,
        },
        loopData: {
        },
        persistentData: {
        },
      }],
      possibleActions,
      alwaysCallbacks: {
        onCompleteAction: {
          move: [move]
        },
      },
      alwaysGenericCallbacks: {
        onProgressAction: [reduceMana, drinkPotion],
        onCompleteAction: [
          randomFamiliarity ? randomFamiliarityGainFunction : staticFamiliarityGainFunction,
        ],
      },
      loopData: {
        mana: {
          current: 500,
          max: 500,
        },
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
