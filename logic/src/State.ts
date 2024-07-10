// export type ActionTypes<AT extends string> = "move" | AT;
export type PerActionType<ActionType extends string, T> = Partial<{ [key in "move" | ActionType]: T }>;

export interface Instruction<ActionType extends "move" | string> {
  name: string;
  type: "move" | ActionType;
  count: number;
}

export interface MoveInstruction extends Instruction<"move"> {
  type: "move";
  movement: {x: number, y: number};
}

export interface InstructionList<ActionType extends string> {
  instructions: Instruction<ActionType>[];
  possibleActions: Instruction<ActionType>[];
  index: number;
  subIndex: number;
  spentActionMana: number;
}


export type GenericCalc<ActionType extends string, PersistentData, LoopData, IndPersistentData, IndLoopData> = (state: State<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>, target: EntityOrTileWithState<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>, targetPos: Coordinates) => number;
export type OnPartialFunc<ActionType extends string, PersistentData, LoopData, IndPersistentData, IndLoopData> = (state: State<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>, target: EntityOrTileWithState<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>, spentMana: number, targetPos: Coordinates) => void;
export type OnCompleteFunc<ActionType extends string, PersistentData, LoopData, IndPersistentData, IndLoopData> = (state: State<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>, target: EntityOrTileWithState<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>, targetPos: Coordinates) => boolean;

export interface EntityOrTile<ActionType extends string, PersistentData, LoopData, IndPersistentData, IndLoopData> {
  name: string;

  cost: PerActionType<ActionType, GenericCalc<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>>;
  familiarityGain: PerActionType<ActionType, GenericCalc<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>>;
  onPartialAction: PerActionType<ActionType, OnPartialFunc<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>>;
  onCompletedAction: PerActionType<ActionType, OnCompleteFunc<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>>;
  blocked?: boolean;

  loopData: IndLoopData;
}

export interface Entity<ActionType extends string, PersistentData, LoopData, IndPersistentData, IndLoopData> extends EntityOrTile<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData> {
  active: boolean;
}

export interface Tile<ActionType extends string, PersistentData, LoopData, IndPersistentData, IndLoopData> extends EntityOrTile<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData> {
  entities: Entity<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>[];
}

export interface PersistentSingleState<ActionType extends string, IndPersistentData> {
  timesPerformed: PerActionType<ActionType, number>;
  familiarity: PerActionType<ActionType, number>;
  persistentData: IndPersistentData;
}

export interface PersistentSingleStateWithPersistentEntities<ActionType extends string, IndPersistentData> extends PersistentSingleState<ActionType, IndPersistentData> {
  entities: PersistentSingleState<ActionType, IndPersistentData>[];
}

export interface LoopSingleState<AT extends string> {
  timesPerformedThisLoop: PerActionType<AT, number>;
  familiarityThisLoop: PerActionType<AT, number>;
}

export interface SingleState<AT extends string, IndPersistentData> extends PersistentSingleState<AT, IndPersistentData>, LoopSingleState<AT> { }

export interface EntityOrTileWithState<AT extends string, PersistentData, LoopData, IndPersistentData, IndLoopData> extends EntityOrTile<AT, PersistentData, LoopData, IndPersistentData, IndLoopData>, SingleState<AT, IndPersistentData> { }
export interface TileWithState<AT extends string, PersistentData, LoopData, IndPersistentData, IndLoopData> extends Tile<AT, PersistentData, LoopData, IndPersistentData, IndLoopData>, SingleState<AT, IndPersistentData> {
  entities: EntityWithState<AT, PersistentData, LoopData, IndPersistentData, IndLoopData>[];
}
export interface EntityWithState<AT extends string, PersistentData, LoopData, IndPersistentData, IndLoopData> extends Entity<AT, PersistentData, LoopData, IndPersistentData, IndLoopData>, SingleState<AT, IndPersistentData> { }

export interface TileMap<AT extends string, PersistentData, LoopData, IndPersistentData, IndLoopData> {
  width: number;
  height: number;
  tiles: TileWithState<AT, PersistentData, LoopData, IndPersistentData, IndLoopData>[][];

  defaults: {
    cost: PerActionType<AT, GenericCalc<AT, PersistentData, LoopData, IndPersistentData, IndLoopData>>;
    familiarityGain: PerActionType<AT, GenericCalc<AT, PersistentData, LoopData, IndPersistentData, IndLoopData>>;
    onPartialAction: PerActionType<AT, OnPartialFunc<AT, PersistentData, LoopData, IndPersistentData, IndLoopData>>;
    onCompletedAction: PerActionType<AT, OnCompleteFunc<AT, PersistentData, LoopData, IndPersistentData, IndLoopData>>;
  };
  always: {
    onPartialAction: PerActionType<AT, OnPartialFunc<AT, PersistentData, LoopData, IndPersistentData, IndLoopData>[]>;
    onCompletedAction: PerActionType<AT, OnCompleteFunc<AT, PersistentData, LoopData, IndPersistentData, IndLoopData>[]>;
  };
}

export interface Coordinates {
  x: number;
  y: number;
}

export type StateInitializer<AT extends string, PersistentData, LoopData, IndPersistentData, IndLoopData> = () => { 
  tileMap: TileMap<AT, PersistentData, LoopData, IndPersistentData, IndLoopData>, 
  possibleActions: Instruction<AT>[],
  initialPosition: Coordinates, 
  mana: { max: number, current: number }, 
  persistentData: PersistentData, 
  loopData: LoopData 
};

export class State<ActionType extends string, PersistentData, LoopData, IndPersistentData, IndLoopData> {
  initializer: StateInitializer<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>

  tileMap: TileMap<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>;
  instructionList: InstructionList<ActionType>;

  initialPosition: Coordinates;
  position: Coordinates;
  mana: { max: number, current: number };
  loopCount: number;

  persistentData: PersistentData;
  loopData: LoopData;

  constructor(
    initializer: StateInitializer<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>
  ) {
    this.initializer = initializer;
    this.tileMap = {} as TileMap<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>;
    this.instructionList = {} as InstructionList<ActionType>;
    this.initialPosition = { x: 0, y: 0 };
    this.position = { x: 0, y: 0 };
    this.mana = { max: 0, current: 0 };
    this.loopCount = 0;
    this.persistentData = {} as PersistentData;
    this.loopData = {} as LoopData;
    this.initialize();
  }

  initialize() {
    const { tileMap, initialPosition, mana, persistentData, loopData, possibleActions } = this.initializer();
    this.tileMap = tileMap;
    this.instructionList = {
      instructions: [],
      possibleActions,
      index: 0,
      subIndex: 0,
      spentActionMana: 0

    };
    this.initialPosition = initialPosition;
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

    if (actionCost === Infinity) {
      throw new Error("Invalid action cost");
    }


    const remainingManaCost = actionCost - this.instructionList.spentActionMana;
    const actuallySpentMana = Math.min(manaToSpend, remainingManaCost);
    const overSpentMana = Math.max(manaToSpend - remainingManaCost, 0);
    this.instructionList.spentActionMana += actuallySpentMana;
    this.mana.current -= actuallySpentMana;

    const originalPosition = { ...this.position };

    const onPartialAction = target.onPartialAction[instruction.type] || this.tileMap.defaults.onPartialAction[instruction.type];
    if (onPartialAction) {
      onPartialAction(this, target, actuallySpentMana, this.position);
    }

    const alwaysOnPartialActionList = this.tileMap.always.onPartialAction[instruction.type];
    if (alwaysOnPartialActionList) {
      for (const alwaysOnPartialAction of alwaysOnPartialActionList){
        alwaysOnPartialAction(this, target, actuallySpentMana, this.position);
      }
    }

    if (this.instructionList.spentActionMana === actionCost) {
      this.instructionList.spentActionMana = 0;
      //Completed the action

      const onCompletedAction = target.onCompletedAction[instruction.type] || this.tileMap.defaults.onCompletedAction[instruction.type];
      let preventDefault = false;
      if (onCompletedAction) {
        preventDefault ||= onCompletedAction(this, target, this.position);
      }

      const alwaysOnCompletedActionList = this.tileMap.always.onCompletedAction[instruction.type];
      if (alwaysOnCompletedActionList) {
        for (const alwaysOnCompletedAction of alwaysOnCompletedActionList){
          alwaysOnCompletedAction(this, target, this.position);
        }
      }

      // Get the familiarity gain function before moving
      const familiarityGainFunc = target.familiarityGain[instruction.type] || this.tileMap.defaults.familiarityGain[instruction.type];
      if (!familiarityGainFunc) {
        throw new Error(`No familiarity gain function found for ${instruction.type} on ${target.name} or defaults`);
      }

      if (!preventDefault) {
        this.performAction(instruction, target);
      }

      this.handleCounters(instruction, target, originalPosition, familiarityGainFunc);
      this.instructionList.subIndex++;
      if (this.instructionList.subIndex >= instruction.count) {
        this.instructionList.subIndex = 0;
        this.instructionList.index++;
      }
    }
    return overSpentMana;

  }

  getTargetAndCost(): { target: EntityOrTileWithState<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>, cost: number } {

    if (this.instructionList.index >= this.instructionList.instructions.length) {
      throw new Error("No more actions to perform");
    }

    const instruction = this.instructionList.instructions[this.instructionList.index];
    let target: EntityOrTileWithState<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData> | undefined = undefined;
    let actionCost: number | undefined = undefined;

    const tile = this.tileMap.tiles[this.position.y][this.position.x];
    const entity = this.getEntity(tile);
    const entityActionCost = entity ? entity.cost[instruction.type] || this.tileMap.defaults.cost[instruction.type] : undefined;
    const tileActionCost = tile.cost[instruction.type] || this.tileMap.defaults.cost[instruction.type];
    if (entity && entityActionCost) {
      target = entity;
      actionCost = entityActionCost(this, entity, this.position);
    } else if (tileActionCost) {
      target = tile;
      actionCost = tileActionCost(this, tile, this.position);
    } else {
      throw new Error(`No action cost found for ${instruction.type} on entity ${entity?.name}, tile ${tile.name}, or defaults, on position ${this.position.x}, ${this.position.y}`);
    }
    // TODO: check if action is possible by looking at the tile properties and cost

    return { target: target, cost: actionCost };
  }

  performAction(instruction: Instruction<ActionType>, target: EntityOrTileWithState<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>): void {
    // Perform the action
    if (isMoveInstruction(instruction)) {
      const newPosition = this.tileMap.tiles[this.position.y + instruction.movement.y]?.[this.position.x + instruction.movement.x];
      if (newPosition === undefined) {
        throw new Error("Invalid move (outside of map)");
      } else if (newPosition.blocked === true) {
        throw new Error("Invalid move");
      }
      this.position = {
        x: this.position.x + instruction.movement.x,
        y: this.position.y + instruction.movement.y
      };
    }
  }

  handleCounters(instruction: Instruction<ActionType>, target: EntityOrTileWithState<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>, position: Coordinates, familiarityGainFunc: GenericCalc<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>): void {
    const gainedFamiliarity = familiarityGainFunc(this, target, position);
    target.familiarity[instruction.type] = (target.familiarity[instruction.type] || 0) + gainedFamiliarity;
    target.familiarityThisLoop[instruction.type] = (target.familiarityThisLoop[instruction.type] || 0) + gainedFamiliarity;
    // Increase counters
    target.timesPerformed[instruction.type] = (target.timesPerformed[instruction.type] || 0) + 1;
    target.timesPerformedThisLoop[instruction.type] = (target.timesPerformedThisLoop[instruction.type] || 0) + 1;
  }

  getEntity(tile: TileWithState<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>): EntityWithState<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData> | undefined {
    for (const entity of tile.entities) {
      if (entity.active) {
        return entity;
      }
    }
    return undefined;
  }

  addInstruction(instruction: Instruction<ActionType>, index?: number): void {
    const toAdd = { ...instruction}
    if (index === undefined) {
      if (this.instructionList.instructions.length > 0 && this.instructionList.instructions[this.instructionList.instructions.length - 1].name === toAdd.name) {
        this.instructionList.instructions[this.instructionList.instructions.length - 1].count += toAdd.count;
      }else{
        this.instructionList.instructions.push(toAdd);
      }
    } else {
      this.instructionList.instructions.splice(index, 0, toAdd);
    }
  }

  getPath(): {x: number, y: number, index: number, type: "move" | ActionType}[] {
    // Make a copy of the state
    const state = this.clone();
    const path: {x: number, y: number, index: number, type: "move" | ActionType}[] = [];
    try {
      while (state.instructionList.index < state.instructionList.instructions.length) {
        // while (state.instructionList.subIndex < state.instructionList.instructions[state.instructionList.index].count) {
          const instruction = state.instructionList.instructions[state.instructionList.index];
          const {target, cost} = state.getTargetAndCost()
          state.advanceState(cost);
          path.push({x: state.position.x, y: state.position.y, index: state.instructionList.index, type: instruction.type});
        // }
      }
    } catch (e) {
      console.log(e);
      // Do nothing
    }
    return path;
  }


  serializePermanentState(): string {
    const toSerialize: PermanentState<ActionType, PersistentData, IndPersistentData> = {
      tilesState: this.tileMap.tiles.map(row => row.map((tile) => ({
        timesPerformed: tile.timesPerformed,
        familiarity: tile.familiarity,
        persistentData: tile.persistentData,
        entities: tile.entities.map(entity => ({
          timesPerformed: entity.timesPerformed,
          familiarity: entity.familiarity,
          persistentData: entity.persistentData,
        })),
      }))),
      instructions: this.instructionList.instructions,
      loopCount: this.loopCount,
      persistentData: this.persistentData,
    };
    return JSON.stringify(toSerialize);
  }

  deserializePermanentState(serializedState: string) {
    const parsed: PermanentState<ActionType, PersistentData, IndPersistentData> = JSON.parse(serializedState);
    this.tileMap.tiles.forEach((row, y) => row.forEach((tile, x) => {
      const state = parsed.tilesState[y][x];
      tile.timesPerformed = state.timesPerformed;
      tile.familiarity = state.familiarity;
      tile.persistentData = state.persistentData;
      tile.entities.forEach((entity, i) => {
        const entityState = state.entities[i];
        entity.timesPerformed = entityState.timesPerformed;
        entity.familiarity = entityState.familiarity;
        entity.persistentData = entityState.persistentData;
      });
    }));
    this.instructionList.instructions = parsed.instructions;
    this.loopCount = parsed.loopCount;
    this.persistentData = parsed.persistentData;
  }

  resetLoop() {
    this.loopCount++;
    const serialized = this.serializePermanentState();
    this.initialize();
    this.deserializePermanentState(serialized);
  }

  clone(): State<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>{
    const serialized = this.serializePermanentState();
    const state = new State<ActionType, PersistentData, LoopData, IndPersistentData, IndLoopData>(this.initializer);
    state.deserializePermanentState(serialized);
    return state;
  }
}

function isMoveInstruction(instruction: Instruction<string>): instruction is MoveInstruction {
  return instruction.type === "move";
}

interface PermanentState<ActionType extends string, PersistentData, IndPersistentData> {
  tilesState: (PersistentSingleStateWithPersistentEntities<ActionType, IndPersistentData>)[][];
  instructions: Instruction<ActionType>[];
  loopCount: number;
  persistentData: PersistentData;
}

