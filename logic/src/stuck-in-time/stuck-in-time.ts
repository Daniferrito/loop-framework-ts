import tilesMap from "./WorldTerrain_Layer_tiledata";
import entitiesMap from "./WorldElements_Layer_tiledata";

import { EntityWithState, GenericCalc, State, TileMap, TileWithState } from "../State";

type P = {};
type L = {};

const staticFamiliarityGainFunction: GenericCalc<P, L> = () => 20;
const randomInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;
const randomFamiliarityGainFunction: GenericCalc<P, L> = () =>
  20 * randomInRange(0.7, 1.3);

const formula: (familiarity: number) => number = (familiarity) => {
  // Level is calculated with: floor(-(19/2)+(sqrt(8*xp+5415))/(2*sqrt(15)))
  // where xp is familiarity
  const level = Math.floor(
    -9.5 + Math.sqrt(8 * familiarity + 5415) / (2 * Math.sqrt(15))
  );
  // Multiplier is calculated with: pow(1+familiarityLvl/20,0.8)
  // where familiarityLvl is the level calculated above
  return Math.pow(1 + level / 20, 0.8);
}
const fCFMemo: {
  [key: string]: GenericCalc<P, L>
} = {}
const familiarityCostFormula: (baseCost: number, actionType: string) => GenericCalc<P, L> = (baseCost, actionType) => {
  const key = `${baseCost}-${actionType}`
  return fCFMemo[key] ?? (fCFMemo[key] = (state, target) => {
  const tile = state.tileMap.tiles[state.position.y][state.position.x];
  const tileFamiliarity = tile.familiarity[actionType] || 0;
  const entity = state.getEntity(tile);
  const entityFamiliarity = entity?.familiarity[actionType] || 0;
  return baseCost * formula(tileFamiliarity + entityFamiliarity);
})};

function toTile(partial: Partial<TileWithState<P, L>> | any): TileWithState<P, L> {
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
    ...partial,
  };
}

const defaultTile: (id: number) => TileWithState<P, L> = (id) => toTile({
  name: `Unknown tile: ${id}`,
  id,
  color: "black",
} as any as TileWithState<P, L>);

export const crushedGrass: () =>TileWithState<P, L> = () => toTile({
  name: "Crushed Grass",
  cost: {move: familiarityCostFormula(40, "move")},
  color: "lightgreen",
});
export const grass: () => TileWithState<P, L> = () =>toTile({
  name: "Grass",
  cost: {move: familiarityCostFormula(75, "move")},
  color: "lightgreen",
});
export const muddyGrass: () => TileWithState<P, L> = () => toTile({
  name: "Muddy Grass",
  cost: {move: familiarityCostFormula(300, "move")},
  color: "#132629",
});
export const floodedGrass: () => TileWithState<P, L> = () => toTile({
  name: "Flooded Grass",
  cost: {move: familiarityCostFormula(2000, "move")},
  color: "#032226",
});
export const field: () => TileWithState<P, L> = () => toTile({
  name: "Field",
  cost: {move: familiarityCostFormula(100, "move")},
  color: "brown",
});
export const tiles: () => TileWithState<P, L> = () => toTile({
  name: "Tiles",
  cost: {move: familiarityCostFormula(70, "move")},
  color: "gray",
});
export const sewerDrain: () => TileWithState<P, L> = () => toTile({
  name: "Sewer drain",
  cost: {move: familiarityCostFormula(70, "move")},
  color: "#09322b",
});
export const royalCarpet: () => TileWithState<P, L> = () => toTile({
  name: "Royal Carpet",
  cost: {move: familiarityCostFormula(70, "move")},
  color: "#5C4033",
});
export const snow: () => TileWithState<P, L> = () => toTile({
  name: "Snow",
  cost: {move: familiarityCostFormula(100, "move")},
  color: "white",
});
export const path: () => TileWithState<P, L> = () => toTile({
  name: "Path",
  cost: {move: familiarityCostFormula(50, "move")},
  color: "brown",
});
export const mountainTrail: () => TileWithState<P, L> = () => toTile({
  name: "Mountain Trail",
  cost: {move: familiarityCostFormula(150, "move")},
  color: "#424146",
});
export const stream: () => TileWithState<P, L> = () => toTile({
  name: "Stream",
  cost: {move: familiarityCostFormula(100, "move")},
  color: "#064456",
});
export const woods: () => TileWithState<P, L> = () => toTile({
  name: "Woods",
  blocked: true,
  color: "#023020",
});
export const cliff: () => TileWithState<P, L> = () => toTile({
  name: "Cliff",
  blocked: true,
  color: "#5C4033",
});
export const water: () => TileWithState<P, L> = () => toTile({
  name: "Water",
  blocked: true,
  color: "blue",
});
export const rock: () => TileWithState<P, L> = () => toTile({
  name: "Rock",
  blocked: true,
  color: "gray",
});
export const voidTile: () => TileWithState<P, L> = () => toTile({
  name: "Void",
  blocked: true,
  color: "black",
});

export const tileMapping: Partial<{[key: string]: () =>TileWithState<P, L>}> = {
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

function toEntity(partial: Partial<EntityWithState<P, L>> | any): EntityWithState<P, L> {
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
    ...partial,
  };
}

const defaultEntity: (id: number) => EntityWithState<P, L> = (id) => toEntity({
  name: `Unknown entity: ${id}`,
  id,
  color: "magenta",
} as any as EntityWithState<P, L>);

const oneFirefly: () => EntityWithState<P, L> = () => toEntity({
  name: "1ff",
  color: "blue",
  // TODO
});

const twoFireflies: () => EntityWithState<P, L> = () => toEntity({
  name: "2ff",
  color: "blue",
  // TODO
});

const threeFireflies: () => EntityWithState<P, L> = () => toEntity({
  name: "3ff",
  color: "blue",
  // TODO
});

const fenceGate: () => EntityWithState<P, L> = () => toEntity({
  name: "F-Gate",
  color: "#5C4033",
  // TODO
});

const fence: () => EntityWithState<P, L> = () => toEntity({
  name: "Fence",
  color: "#5C4033",
  blocked: true,
  // TODO
});

const rats: () => EntityWithState<P, L> = () => toEntity({
  name: "Rats",
  color: "gray",
  // TODO
});

const altar: () => EntityWithState<P, L> = () => toEntity({
  name: "Altar",
  color: "green",
  // TODO
});

const bonfire: () => EntityWithState<P, L> = () => toEntity({
  name: "Bonfire",
  color: "red",
  // TODO
});

export const entityMapping: Partial<{[key: string]: () =>EntityWithState<P, L>}> = {
  560: oneFirefly,
  520: twoFireflies,
  200: threeFireflies,

  485: altar,
  1125: bonfire,

  327: fenceGate,
  367: fence,
  268435700: rats,
};

const tileMap: (familiarityGainFunction: GenericCalc<P, L>) => TileMap<P, L> = (
  fGF
) => {
  const fullMap: TileWithState<P, L>[][] = [];
  // Read from ./WorldTerrain_Layer_tiledata
  tilesMap.forEach((mRow, y) => {
    const row: TileWithState<P, L>[] = [];
    fullMap.push(row);
    mRow.forEach((id, x) => {
      if (x >= 107) {
        return;
      }
      const mappedTile = tileMapping[id];
      if (mappedTile) {
        const tile = mappedTile();
        (tile as any)._id = id;
        row.push(tile);
      } else {
        console.log("Unknown tile", id, "at", x, y);
        row.push(defaultTile(id))
      }
    });
  });
  // Read from ./WorldElements_Layer_tiledata
  entitiesMap.forEach((mRow, y) => {
    mRow.forEach((id, x) => {
      if (id === 0) {
        return;
      }
      const mappedEntity = entityMapping[id];
      if (mappedEntity) {
        const entity = mappedEntity();
        (entity as any)._id = id;
        fullMap[y][x].entities.push(entity);
      } else {
        fullMap[y][x].entities.push(defaultEntity(id));
      }
    });
  });


  return {
  width: fullMap[0].length,
  height: fullMap.length,
  tiles: fullMap,
  entities: new Map(),
  defaults: {
    cost: {},
    familiarityGain: { move: fGF, attack: fGF, interact: fGF, speak: fGF },
    onPartialAction: {},
    onCompletedAction: {},
  },
}};

interface Options {
  randomFamiliarity: boolean;
}

export const initialState: (options: Options) => State<P, L> = (options) => {
  const { randomFamiliarity } = options;

  return new State<P, L>(
    tileMap(
      randomFamiliarity
        ? randomFamiliarityGainFunction
        : staticFamiliarityGainFunction
    ),
    { x: 61, y: 51 },
    { current: 500, max: 500 },
    {},
    {}
  );
};
