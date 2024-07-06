
export type ActionType = "move" | "attack" | string;
export type PerActionType<T> = Partial<{ [key in ActionType]: T }>;

export interface Instruction {
  name: string;
  type: ActionType;
  count: number;
}

export interface MoveInstruction extends Instruction {
  type: "move";
  x: number;
  y: number;
}

export interface InstructionList {
  instructions: Instruction[];
  index: number;
  subIndex: number;
  spentActionMana: number;
}


export type GenericCalc<PersistentData, LoopData> = (state: State<PersistentData, LoopData>, target: EntityOrTileWithState<PersistentData, LoopData>) => number;
export type OnPartialFunc<PersistentData, LoopData> = (state: State<PersistentData, LoopData>, target: EntityOrTileWithState<PersistentData, LoopData>, spentMana: number) => void;
export type OnCompleteCalcFunc<PersistentData, LoopData> = (state: State<PersistentData, LoopData>, target: EntityOrTileWithState<PersistentData, LoopData>) => boolean;

export interface EntityOrTile<PersistentData, LoopData> {
  name: string;

  cost: PerActionType<GenericCalc<PersistentData, LoopData>>;
  familiarityGain: PerActionType<GenericCalc<PersistentData, LoopData>>;
  onPartialAction: PerActionType<OnPartialFunc<PersistentData, LoopData>>;
  onCompletedAction: PerActionType<OnCompleteCalcFunc<PersistentData, LoopData>>;
  blocked?: boolean;
}

export interface Entity<PersistentData, LoopData> extends EntityOrTile<PersistentData, LoopData> {
  id: number;
}

export interface Tile<PersistentData, LoopData> extends EntityOrTile<PersistentData, LoopData> {
  entityId?: number;
}

export interface PersistentSingleState {
  timesPerformed: PerActionType<number>;
  familiarity: PerActionType<number>;
}

export interface LoopSingleState {
  timesPerformedThisLoop: PerActionType<number>;
  familiarityThisLoop: PerActionType<number>;
}

export interface SingleState extends PersistentSingleState, LoopSingleState {}

export interface EntityOrTileWithState<PersistentData, LoopData> extends EntityOrTile<PersistentData, LoopData>, SingleState { }
export interface TileWithState<PersistentData, LoopData> extends Tile<PersistentData, LoopData>, SingleState { }
export interface EntityWithState<PersistentData, LoopData> extends Entity<PersistentData, LoopData>, SingleState { }

export interface TileMap<PersistentData, LoopData> {
  width: number;
  height: number;
  tiles: TileWithState<PersistentData, LoopData>[][];
  entities: Map<number, EntityWithState<PersistentData, LoopData>>;

  defaults: {
    cost: PerActionType<GenericCalc<PersistentData, LoopData>>;
    familiarityGain: PerActionType<GenericCalc<PersistentData, LoopData>>;
    onPartialAction: PerActionType<OnPartialFunc<PersistentData, LoopData>>;
    onCompletedAction: PerActionType<OnCompleteCalcFunc<PersistentData, LoopData>>;
  };
}

export interface Coordinates {
  x: number;
  y: number;
}

export class State<PersistentData, LoopData> {
  tileMap: TileMap<PersistentData, LoopData>;
  instructionList: InstructionList;

  position: Coordinates;
  mana: { max: number, current: number };
  loopCount: number;

  persistentData: PersistentData;
  loopData: LoopData;

  constructor(tileMap: TileMap<PersistentData, LoopData>, instructions: Instruction[], initialPosition: Coordinates, mana: { max: number, current: number }, persistentData: PersistentData, loopData: LoopData) {
    this.tileMap = tileMap;
    this.instructionList = {
      instructions,
      index: 0,
      subIndex: 0,
      spentActionMana: 0

    };
    this.position = initialPosition;
    this.mana = mana;
    this.loopCount = 0;
    this.persistentData = persistentData;
    this.loopData = loopData;
  }

  advanceState(manaToSpend: number): number {
    if (manaToSpend <= 0) {
      throw new Error("Invalid mana to spend");
    }
    const instruction = this.instructionList.instructions[this.instructionList.index];

    const { target, cost: actionCost } = this.getTargetAndCost();


    const remainingManaCost = actionCost - this.instructionList.spentActionMana;
    const actuallySpentMana = Math.min(manaToSpend, remainingManaCost);
    const overSpentMana = Math.max(manaToSpend - remainingManaCost, 0);
    this.instructionList.spentActionMana += actuallySpentMana;
    this.mana.current -= actuallySpentMana;

    const onPartialAction = target.onPartialAction[instruction.type] || this.tileMap.defaults.onPartialAction[instruction.type];
    if (onPartialAction) {
      onPartialAction(this, target, actuallySpentMana);
    }
    
    if (this.instructionList.spentActionMana === actionCost) {
      this.instructionList.spentActionMana = 0;
      //Completed the action
      
      const onCompletedAction = target.onCompletedAction[instruction.type] || this.tileMap.defaults.onCompletedAction[instruction.type];
      let preventDefault = false;
      if (onCompletedAction) {
        preventDefault = onCompletedAction(this, target);
      }

      // Get the familiarity gain function before moving
      const familiarityGainFunc = target.familiarityGain[instruction.type] || this.tileMap.defaults.familiarityGain[instruction.type];
      if (!familiarityGainFunc) {
        throw new Error(`No familiarity gain function found for ${instruction.type} on ${target.name} or defaults`);
      }

      if (!preventDefault) {
        this.performAction(instruction, target);
      }

      this.handleCounters(instruction, target, familiarityGainFunc);
      this.instructionList.subIndex++;
      if (this.instructionList.subIndex >= instruction.count) {
        this.instructionList.subIndex = 0;
        this.instructionList.index++;
      }
    }
    return overSpentMana;

  }

  getTargetAndCost(): { target: EntityOrTileWithState<PersistentData, LoopData>, cost: number } {

    if (this.instructionList.index >= this.instructionList.instructions.length) {
      throw new Error("No more actions to perform");
    }

    const instruction = this.instructionList.instructions[this.instructionList.index];
    let target: EntityOrTileWithState<PersistentData, LoopData> | undefined = undefined;
    let actionCost: number | undefined = undefined;

    const tile = this.tileMap.tiles[this.position.y][this.position.x];
    const entity = this.getEntity(tile);
    const entityActionCost = entity ? entity.cost[instruction.type] || this.tileMap.defaults.cost[instruction.type] : undefined;
    const tileActionCost = tile.cost[instruction.type] || this.tileMap.defaults.cost[instruction.type];
    if (entity && entityActionCost) {
      target = entity;
      actionCost = entityActionCost(this, entity);
    } else if (tileActionCost) {
      target = tile;
      actionCost = tileActionCost(this, tile);
    } else {
      throw new Error(`No action cost found for ${instruction.type} on entity ${entity?.name}, tile ${tile.name}, or defaults`);
    }
    // TODO: check if action is possible by looking at the tile properties and cost

    return { target: target, cost: actionCost };
  }

  performAction(instruction: Instruction, target: EntityOrTileWithState<PersistentData, LoopData>): void {
    // Perform the action
    if (instruction.type === "move") {
      const moveInstruction = instruction as MoveInstruction;
      const newPosition = this.tileMap.tiles[this.position.y + moveInstruction.y]?.[this.position.x + moveInstruction.x];
      if (newPosition === undefined) {
        throw new Error("Invalid move (outside of map)");
      } else if (newPosition.blocked === true) {
        throw new Error("Invalid move");
      }
      this.position.x += moveInstruction.x;
      this.position.y += moveInstruction.y;
    } else if (instruction.type === "attack") {
      if (isEntity(target)) {
        // Delete the entity
        this.tileMap.tiles[this.position.y][this.position.x].entityId = undefined;
      }
    }
  }

  handleCounters(instruction: Instruction, target: EntityOrTileWithState<PersistentData, LoopData>, familiarityGainFunc: GenericCalc<PersistentData, LoopData>): void {
    const gainedFamiliarity = familiarityGainFunc(this, target);
    target.familiarity[instruction.type] = target.familiarity[instruction.type] || 0 + gainedFamiliarity;
    target.familiarityThisLoop[instruction.type] = (target.familiarityThisLoop[instruction.type] || 0) + gainedFamiliarity;
    // Increase counters
    target.timesPerformed[instruction.type] = (target.timesPerformed[instruction.type] || 0) + 1;
    target.timesPerformedThisLoop[instruction.type] = (target.timesPerformedThisLoop[instruction.type] || 0) + 1;
  }


  getEntity(tile: TileWithState<PersistentData, LoopData>): EntityWithState<PersistentData, LoopData> | undefined {
    if (tile.entityId) {
      const entity = this.tileMap.entities.get(tile.entityId);
      if (!entity) {
        throw new Error("Entity not found");
      }
      return entity;
    } else {
      return undefined;
    }
  }


  serializePermanentState(): string {
    const toSerialize: PermanentState<PersistentData> = {
      tilesState: this.tileMap.tiles.map(row => row.map((tile: SingleState) => ({
        timesPerformed: tile.timesPerformed,
        familiarity: tile.familiarity,
      }))),
      entitiesState: Array.from(this.tileMap.entities).reduce((acc, [id, entity]) => {
        acc[id] = {
          timesPerformed: entity.timesPerformed,
          familiarity: entity.familiarity,
        };
        return acc;
      }, {} as {[key: number]: PersistentSingleState}),
      instructions: this.instructionList.instructions,
      loopCount: this.loopCount,
      persistentData: this.persistentData,
    };
    return JSON.stringify(toSerialize);
  }

  deserializePermanentState(serializedState: string) {
    const parsed: PermanentState<PersistentData> = JSON.parse(serializedState);
    this.tileMap.tiles.forEach((row, y) => row.forEach((tile, x) => {
      const state = parsed.tilesState[y][x];
      tile.timesPerformed = state.timesPerformed;
      tile.familiarity = state.familiarity;
    }));
    this.tileMap.entities.forEach((entity, id) => {
      const state = parsed.entitiesState[id];
      entity.timesPerformed = state.timesPerformed;
      entity.familiarity = state.familiarity;
    });
    this.instructionList.instructions = parsed.instructions;
    this.loopCount = parsed.loopCount;
    this.persistentData = parsed.persistentData;
  }
}

function isEntity<PersistentData, LoopData>(entityOrTile: EntityOrTile<PersistentData, LoopData>): entityOrTile is Entity<PersistentData, LoopData> {
  return (entityOrTile as Entity<PersistentData, LoopData>).id !== undefined;
}

interface PermanentState<PersistentData> {
  tilesState: PersistentSingleState[][];
  entitiesState: {[key: number]: PersistentSingleState};
  instructions: Instruction[];
  loopCount: number;
  persistentData: PersistentData;
}

