import { ActionDefinition, FullAction } from "./Action";
import { CostType, PerActionCallbacksType, GenericCallbacksType } from "./Callbacks";
import { Character } from "./Character";
import { Coordinates, FullTile, TileMap } from "./TileMap";
import { LoopFrameworkError, LoopFrameworkErrorCode } from "./Errors";

export interface StateAdvanceResponse {
  spentMana: number;
  leftoverMana: number;
  actionCompleted: boolean;
  whoCompleted: Set<number>;
}

export interface StateData<ActionType extends string, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> {
  tileMap: TileMap<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  characters: Character<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>[];
  possibleActions?: { [id: number]: ActionDefinition<ActionType, ActionData> };

  cost?: CostType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  callbacks?: PerActionCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  alwaysCallbacks?: PerActionCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  genericCallbacks?: GenericCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  alwaysGenericCallbacks?: GenericCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;

  onDataLoad?: (state: State<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>) => void;
  onLoopEnd?: (state: State<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>) => void;

  persistentData: GlobalPersistentData,
  loopData: GlobalLoopData,
}

export type StateInitializer<ActionType extends string, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> = () => StateData<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;

export class State<ActionType extends string, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> implements StateData<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> {
  initializer: StateInitializer<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>

  tileMap: TileMap<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  characters: Character<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>[];
  possibleActions?: { [id: number]: ActionDefinition<ActionType, ActionData> };

  cost?: CostType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  callbacks?: PerActionCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  alwaysCallbacks?: PerActionCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  genericCallbacks?: GenericCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  alwaysGenericCallbacks?: GenericCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;

  onDataLoad?: (state: State<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>) => void;
  onLoopEnd?: (state: State<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>) => void;

  persistentData: GlobalPersistentData;
  loopData: GlobalLoopData;

  constructor(initializer: StateInitializer<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>) {
    this.initializer = initializer;
    this.tileMap = null as any;
    this.characters = null as any;
    this.persistentData = null as any;
    this.loopData = null as any;
    this.initialize();
  }

  initialize() {
    
    const { tileMap, characters, possibleActions, cost, callbacks, alwaysCallbacks, genericCallbacks, alwaysGenericCallbacks, onDataLoad, onLoopEnd, persistentData, loopData } = this.initializer();
    this.tileMap = tileMap;
    this.characters = characters;
    this.possibleActions = possibleActions;

    this.cost = cost;
    this.callbacks = callbacks;
    this.alwaysCallbacks = alwaysCallbacks;
    this.genericCallbacks = genericCallbacks
    this.alwaysGenericCallbacks = alwaysGenericCallbacks;

    this.onDataLoad = onDataLoad;
    this.onLoopEnd = onLoopEnd;

    this.persistentData = persistentData;
    this.loopData = loopData;
  }

  advanceState(manaToSpend: number): StateAdvanceResponse {
    if (manaToSpend <= 0) {
      return { spentMana: 0, leftoverMana: 0, actionCompleted: false, whoCompleted: new Set() };
    }
    let spentMana = 0;
    let actionCompleted = false;
    const whoCompleted: Set<number> = new Set();
    try{
      while (spentMana < manaToSpend) {
        // Get the next actions for each character
        const nextActions: {
          action: FullAction<ActionType, ActionData> | undefined,
          characterIndex: number,
          character: Character<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>,
          target: FullTile<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>,
          targetPos: Coordinates,
          allTiles: FullTile<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>[],
          cost: number,
          remainingCost: number,
        }[] = this.getNextActions();
        const leastManaToComplete = nextActions.reduce((acc, next) => Math.min(acc, next.remainingCost), Infinity);
        const manaToSpendThisIteration = Math.min(manaToSpend - spentMana, leastManaToComplete);

        // Advance the loop by manaToSpendThisIteration
        nextActions.forEach(({ action, characterIndex, character, target, targetPos, allTiles, cost }) => {
          if (action == null) {
            // TODO define error
            throw {
              name: 'NoActionDefined',
              message: `No action defined for the character ${character.name} at action index ${character.actionList.index}`,
              code: LoopFrameworkErrorCode.NoAction,
            } as LoopFrameworkError;
          }

          const fnInput = { state: this, action, character, target, targetPos };
          const isStartingAction = character.actionList.spentActionMana === 0; 
          if (isStartingAction) {
            target.callbacks?.onStartAction?.[action.type]?.find(fn => fn(fnInput))
            || character.callbacks?.onStartAction?.[action.type]?.find(fn => fn(fnInput))
            || this.callbacks?.onStartAction?.[action.type]?.find(fn => fn(fnInput))
            || target.genericCallbacks?.onStartAction?.find(fn => fn(fnInput))
            || character.genericCallbacks?.onStartAction?.find(fn => fn(fnInput))
            || this.genericCallbacks?.onStartAction?.find(fn => fn(fnInput));
  
            allTiles.forEach(tile => {
              tile.alwaysCallbacks?.onStartAction?.[action.type]?.forEach(fn => fn(fnInput));
              tile.alwaysGenericCallbacks?.onStartAction?.forEach(fn => fn(fnInput));
            });
            character.alwaysCallbacks?.onStartAction?.[action.type]?.forEach(fn => fn(fnInput));
            character.alwaysGenericCallbacks?.onStartAction?.forEach(fn => fn(fnInput));
            this.alwaysCallbacks?.onStartAction?.[action.type]?.forEach(fn => fn(fnInput));
            this.alwaysGenericCallbacks?.onStartAction?.forEach(fn => fn(fnInput));
          }
          
          character.actionList.spentActionMana += manaToSpendThisIteration;
  
          const isProgressingAction = true;
          if (isProgressingAction) {
            const fnInputPartial = { ...fnInput, spentMana: manaToSpendThisIteration };
            target.callbacks?.onProgressAction?.[action.type]?.find(fn => fn(fnInputPartial))
            || character.callbacks?.onProgressAction?.[action.type]?.find(fn => fn(fnInputPartial))
            || this.callbacks?.onProgressAction?.[action.type]?.find(fn => fn(fnInputPartial))
            || target.genericCallbacks?.onProgressAction?.find(fn => fn(fnInputPartial))
            || character.genericCallbacks?.onProgressAction?.find(fn => fn(fnInputPartial))
            || this.genericCallbacks?.onProgressAction?.find(fn => fn(fnInputPartial));
  
            allTiles.forEach(tile => {
              tile.alwaysCallbacks?.onProgressAction?.[action.type]?.forEach(fn => fn(fnInputPartial))
              tile.alwaysGenericCallbacks?.onProgressAction?.forEach(fn => fn(fnInputPartial))
            });
            character.alwaysCallbacks?.onProgressAction?.[action.type]?.forEach(fn => fn(fnInputPartial))
            character.alwaysGenericCallbacks?.onProgressAction?.forEach(fn => fn(fnInputPartial))
            this.alwaysCallbacks?.onProgressAction?.[action.type]?.forEach(fn => fn(fnInputPartial))
            this.alwaysGenericCallbacks?.onProgressAction?.forEach(fn => fn(fnInputPartial))
          }
  
          const isCompletingAction = character.actionList.spentActionMana >= cost;
          if (isCompletingAction) {
            actionCompleted = true;
            whoCompleted.add(characterIndex);
            target.callbacks?.onCompleteAction?.[action.type]?.find(fn => fn(fnInput))
            || character.callbacks?.onCompleteAction?.[action.type]?.find(fn => fn(fnInput))
            || this.callbacks?.onCompleteAction?.[action.type]?.find(fn => fn(fnInput))
            || target.genericCallbacks?.onCompleteAction?.find(fn => fn(fnInput))
            || character.genericCallbacks?.onCompleteAction?.find(fn => fn(fnInput))
            || this.genericCallbacks?.onCompleteAction?.find(fn => fn(fnInput));
  
            allTiles.forEach(tile => {
              tile.alwaysCallbacks?.onCompleteAction?.[action.type]?.forEach(fn => fn(fnInput));
              tile.alwaysGenericCallbacks?.onCompleteAction?.forEach(fn => fn(fnInput));
            });
            character.alwaysCallbacks?.onCompleteAction?.[action.type]?.forEach(fn => fn(fnInput));
            character.alwaysGenericCallbacks?.onCompleteAction?.forEach(fn => fn(fnInput));
            this.alwaysCallbacks?.onCompleteAction?.[action.type]?.forEach(fn => fn(fnInput));
            this.alwaysGenericCallbacks?.onCompleteAction?.forEach(fn => fn(fnInput));
  
            character.actionList.spentActionMana = 0;
            character.actionList.subIndex++;
            if (character.actionList.subIndex >= action.repetitions) {
              character.actionList.index += 1;
              character.actionList.subIndex = 0;
            }
          }
        })
        spentMana += manaToSpendThisIteration;
      }
    } catch (e) {
      const error = e as LoopFrameworkError;
      if (error.code === LoopFrameworkErrorCode.NoAction) {
        // Do nothing
      } else {
        // console.warn(e);
        throw e;
      }
    }

    return { spentMana, leftoverMana: manaToSpend - spentMana, actionCompleted, whoCompleted };
  }

  getCell(position: Coordinates) {
    return this.tileMap.cells[position.j][position.i][position.y][position.x];
  }

  getNextActions() {
    const nextActions: {
      action: FullAction<ActionType, ActionData> | undefined,
      characterIndex: number,
      character: Character<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>,
      target: FullTile<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>,
      targetPos: Coordinates,
      allTiles: FullTile<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>[],
      cost: number,
      remainingCost: number,
    }[] = this.characters.map((character, characterIndex) => {
      
      const targetPos: Coordinates = { ...character.position };
      const allTiles: FullTile<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>[] = 
        this.getCell(targetPos).tiles
          .map(tile => ({ ...tile, ...this.tileMap.tileDefinitions[tile.id] } as FullTile<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>))
          .filter(({ disabled }) => disabled !== true);
      const firstTile = allTiles[0];

      const actionReference = character.actionList.actions[character.actionList.index];
      if (actionReference == null) {
        return {
          action: undefined,
          characterIndex,
          character,
          target: firstTile,
          targetPos: character.position,
          allTiles,
          cost: 0,
          remainingCost: 0,
        }
      }
      const actionDefinition = actionReference.global ? this.possibleActions?.[actionReference.id] : character.actionList.possibleActions?.[actionReference.id];
      if (actionDefinition == null) {
        // TODO define error
        throw {
          name: 'ActionNotFound',
          message: `Action with id ${actionReference.id} and global ${actionReference.global} for character ${character.name} (${characterIndex}) not found`,
          code: LoopFrameworkErrorCode.ActionNotFound,
        } as LoopFrameworkError;
      }
      const action: FullAction<ActionType, ActionData> = { ...actionDefinition, ...actionReference };
      const actionType: ActionType = actionDefinition.type;
      const tiles: {cost: number, tile: FullTile<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>}[] =
        allTiles
          .map(tile => {
            const cost = tile.cost?.[actionType]?.({state: this, action, character, target: tile, targetPos});
            if (cost === undefined) {
              return null;
            }
            return { cost, tile };
          })
          .filter(notEmpty);
      
      const fnInput = { state: this, action, character, target: firstTile, targetPos };
      const characterCost = character.cost?.[actionType]?.(fnInput)
      const globalCost = this.cost?.[actionType]?.(fnInput);
      const { target, cost } = tiles.length > 0 ? {target: tiles[0].tile, cost: tiles[0].cost} : {target: firstTile, cost: characterCost} ?? {target: firstTile, cost: globalCost};
      if (cost == null) {
        // TODO define error
        throw {
          name: 'NoCostDefined',
          message: `No cost defined for the action ${action.type} on the character ${character.name} on the tile ${target.name} at position ${targetPos.i}, ${targetPos.j}, ${targetPos.x}, ${targetPos.y}`,
          code: LoopFrameworkErrorCode.NoCost,
        } as LoopFrameworkError;
      }
      const remainingCost = cost - character.actionList.spentActionMana;
      return { action, characterIndex, character, target, targetPos, allTiles, cost, remainingCost };
    })
    return nextActions;
  }

  getPaths(): Path<ActionType>[] {
    // Make a copy of the state
    const state = this.clone();

    const paths: Path<ActionType>[] = state.characters.map((_, characterIndex) => ({
      characterIndex,
      path: [{
        position: state.characters[characterIndex].position,
        index: -1,
        type: undefined,
      }],
    }));
    try {
      let nextActions = state.getNextActions();
      while (nextActions.some(({ remainingCost }) => remainingCost > 0)) {
        const leastManaToComplete = nextActions.reduce((acc, next) => Math.min(acc, next.remainingCost), Infinity);
        const result = state.advanceState(leastManaToComplete);
        result.whoCompleted.forEach(characterIndex => {
          const character = state.characters[characterIndex];
          const index = character.actionList.index - 1;
          const completedAction = character.actionList.actions[index];
          const type = completedAction.global ? this.possibleActions?.[completedAction.id]?.type : character.actionList.possibleActions?.[completedAction.id]?.type;
          paths[characterIndex].path.push({
            position: character.position,
            index,
            type,
          });
        });
        nextActions = state.getNextActions();
      }
    } catch (e) {
      console.warn(e);
      // Do nothing
    }
    return paths;
  }

  serializePermanentState(): string {
    const toSerialize: PermanentState<TilePersistentData, CharacterPersistentData, GlobalPersistentData> = {
      tilesState: this.tileMap.cells
        .map(row1 => row1
          .map((col1) => col1
            .map(row2 => row2
              .map(cell => cell.tiles
                .map(tile => (tile.persistentData)),
              )))),
      charactersState: this.characters.map(character => character.persistentData),
      globalState: this.persistentData,
    };
    return JSON.stringify(toSerialize);
  }

  deserializePermanentState(serializedState: string) {
    const parsed: PermanentState<TilePersistentData, CharacterPersistentData, GlobalPersistentData> = JSON.parse(serializedState);
    this.tileMap.cells.forEach((row1, i) => row1.forEach((col1, j) => col1.forEach((row2, y) => row2.forEach((cell, x) => cell.tiles.forEach((tile, id) => {
      tile.persistentData = parsed.tilesState[i][j][y][x][id];
    })))));
    this.characters.forEach((character, id) => {
      character.persistentData = parsed.charactersState[id];
    });
    this.persistentData = parsed.globalState;
  }

  resetLoop() {
    const serialized = this.serializePermanentState();
    this.initialize();
    this.deserializePermanentState(serialized);
  }

  clone(): State<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> {
    const serialized = this.serializePermanentState();
    const state = new State<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>(this.initializer);
    state.deserializePermanentState(serialized);
    return state;
  }
}

interface PermanentState<TilePersistentData, CharacterPersistentData, GlobalPersistentData> {
  tilesState: TilePersistentData[][][][][];
  charactersState: CharacterPersistentData[];
  globalState: GlobalPersistentData;
}

interface Path<ActionType extends string>{
  characterIndex: number;
  path: {position: Coordinates, index: number, type: ActionType | undefined}[];
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}