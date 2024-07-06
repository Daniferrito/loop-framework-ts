import { ActionType, Coordinates, EntityWithState, GenericCalc, Instruction, MoveInstruction, PerActionType, State, TileMap, TileWithState } from "../src/State";

type P = {};
type L = {};
type BasicState = State<P, L>;

const flatNumber: (n: number) => GenericCalc<P, L> = (number: number) => () => number;

const familiarityFormula: (formula: (familiarity: number) => number, actionType: ActionType) => GenericCalc<P, L> = (formula, actionType) => (_, target) => formula(target.familiarity[actionType] || 0);

// Helper function to create a TileWithState
function createWalkableTileWithState(name: string, entityId?: number): TileWithState<P, L> {
  return {
    name,
    cost: {move: flatNumber(10)},

    familiarity: {},
    familiarityThisLoop: {},
    familiarityGain: {move: flatNumber(1)},

    onPartialAction: {},
    onCompletedAction: {},

    timesPerformed: {},
    timesPerformedThisLoop: {},

    entityId,
  };
}

// Helper function to create an Entity
function createEntity(id: number, name: string, cost: PerActionType<GenericCalc<P, L>>): EntityWithState<P, L> {
  return {
    id,
    name,
    cost,
    
    familiarity: {},
    familiarityThisLoop: {},
    familiarityGain: {move: flatNumber(1)},

    onPartialAction: {},
    onCompletedAction: {},

    timesPerformed: {},
    timesPerformedThisLoop: {},
  };
}

function createNTileTileMap(width: number, height: number, tileGenerator: (coords: Coordinates) => TileWithState<P, L> = (coords) => createWalkableTileWithState(`Tile ${coords.x}, ${coords.y}`)): TileMap<P, L> {
  const tiles: TileWithState<P, L>[][] = [];
  for (let i = 0; i < height; i++) {
    const row: TileWithState<P, L>[] = [];
    for (let j = 0; j < width; j++) {
      row.push(tileGenerator({x: j, y: i}));
    }
    tiles.push(row);
  }
  return {
    width,
    height,
    tiles,
    entities: new Map(),
    defaults: {
      cost: {},
      familiarityGain: {move: flatNumber(1)},

      onPartialAction: {},
      onCompletedAction: {},
    },
  };
}

//Helper function to create a State with a single move instruction
function createState(tileMap: TileMap<P, L>, instructions: Instruction[]): BasicState {
  return new State<{},{}>(tileMap, instructions, {x: 0, y: 0}, {max: 100, current: 100}, {}, {});
}

const moveInstructionRight: MoveInstruction = {name: "Move Right", type: "move", count: 1, x: 1, y: 0};
const moveInstructionLeft: MoveInstruction = {name: "Move Left", type: "move", count: 1, x: -1, y: 0};
const moveInstructionUp: MoveInstruction = {name: "Move Up", type: "move", count: 1, x: 0, y: -1};
const moveInstructionDown: MoveInstruction = {name: "Move Down", type: "move", count: 1, x: 1, y: 1};

describe(`getTargetAndCost`, () => {
  it(`should fail if there are no instructions in the list`, () => {
    const state: BasicState = createState(createNTileTileMap(1, 1), []);
    expect(() => state.getTargetAndCost()).toThrowErrorMatchingInlineSnapshot(`"No more actions to perform"`);
  });
  it(`should return the tile target and cost for a move instruction on a tile with no entity`, () => {
    const state: BasicState = createState(createNTileTileMap(1, 1), [moveInstructionRight]);
    const {target, cost} = state.getTargetAndCost();
    expect(target).toBe(state.tileMap.tiles[0][0]);
    expect(cost).toBe(10);
  });
  it(`should return the tile target and cost for a move instruction on a tile with an entity with no move function`, () => {
    const entity = createEntity(1, "Enemy", {});
    const state: BasicState = createState(createNTileTileMap(1, 1), [moveInstructionRight]);
    state.tileMap.tiles[0][0].entityId = 1;
    state.tileMap.entities.set(1, entity);
    const {target, cost} = state.getTargetAndCost();
    expect(target).toBe(state.tileMap.tiles[0][0]);
    expect(cost).toBe(10);
  });
  it(`should return the entity target and cost for a move instruction on a tile with an entity with a move function`, () => {
    const entity = createEntity(1, "Enemy", {move: flatNumber(5)});
    const state: BasicState = createState(createNTileTileMap(1, 1), [moveInstructionRight]);
    state.tileMap.tiles[0][0].entityId = 1;
    state.tileMap.entities.set(1, entity);
    const {target, cost} = state.getTargetAndCost();
    expect(target).toBe(entity);
    expect(cost).toBe(5);
  });
  it(`should return the tile target and default cost for a move instruction on a tile with no entity and no tile cost`, () => {
    const state: BasicState = createState(createNTileTileMap(1, 1), [moveInstructionRight]);
    state.tileMap.tiles[0][0].cost = {};
    state.tileMap.defaults.cost.move = flatNumber(7);
    const {target, cost} = state.getTargetAndCost();
    expect(target).toBe(state.tileMap.tiles[0][0]);
    expect(cost).toBe(7);
  });
  it(`should return the entity target and default cost for a move instruction on a tile with an entity with no move function and no entity cost`, () => {
    const entity = createEntity(1, "Enemy", {});
    const state: BasicState = createState(createNTileTileMap(1, 1), [moveInstructionRight]);
    state.tileMap.tiles[0][0].entityId = 1;
    state.tileMap.entities.set(1, entity);
    state.tileMap.defaults.cost.move = flatNumber(7);
    const {target, cost} = state.getTargetAndCost();
    expect(target).toBe(entity);
    expect(cost).toBe(7);
  });
  it(`should throw if there is no cost for the action on the entity, tile or default`, () => {
    const entity = createEntity(1, "Enemy", {});
    const state: BasicState = createState(createNTileTileMap(1, 1), [moveInstructionRight]);
    state.tileMap.tiles[0][0].entityId = 1;
    state.tileMap.entities.set(1, entity);
    state.tileMap.tiles[0][0].cost = {};
    state.tileMap.defaults.cost = {};
    expect(() => state.getTargetAndCost()).toThrowErrorMatchingInlineSnapshot(`"No action cost found for move on entity ${entity.name}, tile ${state.tileMap.tiles[0][0].name}, or defaults"`);
  });
  it(`should throw if there is no cost for the action on the tile or default, and there is no entity`, () => {
    const state: BasicState = createState(createNTileTileMap(1, 1), [moveInstructionRight]);
    state.tileMap.tiles[0][0].cost = {};
    state.tileMap.defaults.cost = {};
    expect(() => state.getTargetAndCost()).toThrowErrorMatchingInlineSnapshot(`"No action cost found for move on entity undefined, tile ${state.tileMap.tiles[0][0].name}, or defaults"`);
  });
  it(`should apply the familiarity cost to the cost`, () => {
    const state: BasicState = createState(createNTileTileMap(1, 1), [moveInstructionRight]);
    state.tileMap.tiles[0][0].familiarity.move = 2;
    const usedFamiliarityFormula = jest.fn(familiarityFormula((familiarity) => 10 * (1 / (1 + familiarity)), "move"));
    state.tileMap.tiles[0][0].cost.move = usedFamiliarityFormula
    const {target, cost} = state.getTargetAndCost();
    expect(target).toBe(state.tileMap.tiles[0][0]);
    expect(cost).toBe(10 * (1 / (1 + 2)));
    expect(usedFamiliarityFormula).toHaveBeenCalledWith(state, state.tileMap.tiles[0][0]);
  });
  it(`cost function should be called with the state and the target`, () => {
    const state: BasicState = createState(createNTileTileMap(1, 1), [moveInstructionRight]);
    const costFunction = jest.fn(flatNumber(10));
    state.tileMap.tiles[0][0].cost.move = costFunction;
    state.getTargetAndCost();
    expect(costFunction).toHaveBeenCalledWith(state, state.tileMap.tiles[0][0]);
  });
});

describe(`advanceState`, () => {
  it('should behave correctly on a move action with not enough mana', () => {
    const state: BasicState = createState(createNTileTileMap(2, 1), [moveInstructionRight]);
    const remainingMana = state.advanceState(5);
    // Check that all the mana has been spent
    expect(remainingMana).toBe(0);
    // Check that the position has not been updated
    expect(state.position).toEqual({x: 0, y: 0});
    // Check that the instruction list has not been updated
    expect(state.instructionList.index).toBe(0);
    // Check that the subIndex has not been updated
    expect(state.instructionList.subIndex).toBe(0);
    // Check that the spentActionMana has been updated
    expect(state.instructionList.spentActionMana).toBe(5);
    // Check that the current mana was deducted
    expect(state.mana.current).toBe(95);
    // Check that the familiarity was not updated
    expect(state.tileMap.tiles[0][0].familiarity.move || 0).toEqual(0);
    // Check that the loop familiarity was not updated
    expect(state.tileMap.tiles[0][0].familiarityThisLoop.move || 0).toEqual(0);
    // Check that the timesPerformed was not updated
    expect(state.tileMap.tiles[0][0].timesPerformed.move || 0).toEqual(0);
    // Check that the timesPerformedThisLoop was not updated
    expect(state.tileMap.tiles[0][0].timesPerformedThisLoop.move || 0).toEqual(0);
  });
  it('should behave correctly on a move command with too much mana', () => {
    const state: BasicState = createState(createNTileTileMap(2, 1), [moveInstructionRight]);
    const remainingMana = state.advanceState(15);
    // Check that there is remaining mana
    expect(remainingMana).toBe(5);
    // Check that the position has been updated
    expect(state.position).toEqual({x: 1, y: 0});
    // Check that the instruction list has been updated
    expect(state.instructionList.index).toBe(1);
    // Check that the subIndex has been updated
    expect(state.instructionList.subIndex).toBe(0);
    // Check that the spentActionMana has been updated
    expect(state.instructionList.spentActionMana).toBe(0);
    // Check that the current mana was deducted
    expect(state.mana.current).toBe(90);
    // Check that the familiarity was updated
    expect(state.tileMap.tiles[0][0].familiarity.move || 0).toEqual(1);
    // Check that the loop familiarity was updated
    expect(state.tileMap.tiles[0][0].familiarityThisLoop.move || 0).toEqual(1);
    // Check that the timesPerformed was updated
    expect(state.tileMap.tiles[0][0].timesPerformed.move || 0).toEqual(1);
    // Check that the timesPerformedThisLoop was updated
    expect(state.tileMap.tiles[0][0].timesPerformedThisLoop.move || 0).toEqual(1);
  });
  it(`should behave correctly on a move command with exactly enough mana`, () => {
    const state: BasicState = createState(createNTileTileMap(2, 1), [moveInstructionRight]);
    const remainingMana = state.advanceState(10);
    // Check that there is no remaining mana
    expect(remainingMana).toBe(0);
    // Check that the position has been updated
    expect(state.position).toEqual({x: 1, y: 0});
    // Check that the instruction list has been updated
    expect(state.instructionList.index).toBe(1);
    // Check that the subIndex has been updated
    expect(state.instructionList.subIndex).toBe(0);
    // Check that the spentActionMana has been updated
    expect(state.instructionList.spentActionMana).toBe(0);
    // Check that the current mana was deducted
    expect(state.mana.current).toBe(90);
    // Check that the familiarity was updated
    expect(state.tileMap.tiles[0][0].familiarity.move || 0).toEqual(1);
  });
  it(`should return to the start on a two move command`, () => {
    const state: BasicState = createState(createNTileTileMap(2, 1), [moveInstructionRight, moveInstructionLeft]);
    state.advanceState(10);
    state.advanceState(10);
    // Check that the position has been updated
    expect(state.position).toEqual({x: 0, y: 0});
    // Check that the instruction list has been updated
    expect(state.instructionList.index).toBe(2);
    // Check that the subIndex has been updated
    expect(state.instructionList.subIndex).toBe(0);
    // Check that the spentActionMana has been updated
    expect(state.instructionList.spentActionMana).toBe(0);
    // Check that the current mana was deducted
    expect(state.mana.current).toBe(80);
    // Check that the familiarity was updated
    expect(state.tileMap.tiles[0][0].familiarity.move || 0).toEqual(1);
    expect(state.tileMap.tiles[0][1].familiarity.move || 0).toEqual(1);
    // Check that the timesPerformed was updated
    expect(state.tileMap.tiles[0][0].timesPerformed.move || 0).toEqual(1);
    expect(state.tileMap.tiles[0][1].timesPerformed.move || 0).toEqual(1);
  });
  it(`should behave correctly on a move command with a count of two`, () => {
    const state: BasicState = createState(createNTileTileMap(3, 1), [{...moveInstructionRight, count: 2}]);
    state.advanceState(10);
    state.advanceState(10);
    // Check that the position has been updated
    expect(state.position).toEqual({x: 2, y: 0});
    // Check that the instruction list has been updated
    expect(state.instructionList.index).toBe(1);
    // Check that the subIndex has been updated
    expect(state.instructionList.subIndex).toBe(0);
    // Check that the spentActionMana has been updated
    expect(state.instructionList.spentActionMana).toBe(0);
    // Check that the current mana was deducted
    expect(state.mana.current).toBe(80);
    // Check that the familiarity was updated
    expect(state.tileMap.tiles[0][0].familiarity.move || 0).toEqual(1);
    expect(state.tileMap.tiles[0][1].familiarity.move || 0).toEqual(1);
  });
  it(`should fail if there is no familiarity gain for the action`, () => {
    const state: BasicState = createState(createNTileTileMap(1, 1), [moveInstructionRight]);
    state.tileMap.tiles[0][0].familiarityGain = {};
    state.tileMap.defaults.familiarityGain = {};
    expect(() => state.advanceState(10)).toThrowErrorMatchingInlineSnapshot(`"No familiarity gain function found for move on ${state.tileMap.tiles[0][0].name} or defaults"`);
  });
  it(`should fail if the destination is outside the map for each direction`, () => {
    const state: BasicState = createState(createNTileTileMap(1, 1), [moveInstructionRight]);
    console.log(JSON.stringify(state, null, 4))
    expect(() => state.advanceState(10)).toThrowErrorMatchingInlineSnapshot(`"Invalid move (outside of map)"`);
    state.instructionList.instructions[0] = moveInstructionLeft;
    expect(() => state.advanceState(10)).toThrowErrorMatchingInlineSnapshot(`"Invalid move (outside of map)"`);
    state.instructionList.instructions[0] = moveInstructionUp;
    expect(() => state.advanceState(10)).toThrowErrorMatchingInlineSnapshot(`"Invalid move (outside of map)"`);
    state.instructionList.instructions[0] = moveInstructionDown;
    expect(() => state.advanceState(10)).toThrowErrorMatchingInlineSnapshot(`"Invalid move (outside of map)"`);
  });
  it(`should fail if the destination is blocked`, () => {
    const state: BasicState = createState(createNTileTileMap(2, 1), [moveInstructionRight]);
    state.tileMap.tiles[0][1].blocked = true;
    expect(() => state.advanceState(10)).toThrowErrorMatchingInlineSnapshot(`"Invalid move"`);
  });
  it(`familiarityGain function should be called with the state and the target`, () => {
    const state: BasicState = createState(createNTileTileMap(2, 1), [moveInstructionRight]);
    const familiarityGainFunction = jest.fn(flatNumber(1));
    state.tileMap.tiles[0][0].familiarityGain.move = familiarityGainFunction;
    state.advanceState(10);
    expect(familiarityGainFunction).toHaveBeenCalledWith(state, state.tileMap.tiles[0][0]);
  })
  it(`onPartialAction function should be called with the state and the target on a non-complete action`, () => {
    const state: BasicState = createState(createNTileTileMap(2, 1), [moveInstructionRight]);
    const onPartialActionFunction = jest.fn();
    state.tileMap.tiles[0][0].onPartialAction.move = onPartialActionFunction;
    state.advanceState(5);
    expect(onPartialActionFunction).toHaveBeenCalledWith(state, state.tileMap.tiles[0][0], 5);
  });
  it(`onPartialAction function should not be called with the state and the target on a complete action`, () => {
    const state: BasicState = createState(createNTileTileMap(2, 1), [moveInstructionRight]);
    const onPartialActionFunction = jest.fn();
    state.tileMap.tiles[0][0].onPartialAction.move = onPartialActionFunction;
    state.advanceState(15);
    expect(onPartialActionFunction).toHaveBeenCalledWith(state, state.tileMap.tiles[0][0], 10);
  });
  it(`onCompletedAction function should not be called on an incomplete action`, () => {
    const state: BasicState = createState(createNTileTileMap(2, 1), [moveInstructionRight]);
    const onCompletedActionFunction = jest.fn();
    state.tileMap.tiles[0][0].onCompletedAction.move = onCompletedActionFunction;
    state.advanceState(5);
    expect(onCompletedActionFunction).not.toHaveBeenCalled();
  });
  it(`onCompletedAction function with no preventDefault should be called with the state and the target on a complete action and still move the character`, () => {
    const state: BasicState = createState(createNTileTileMap(2, 1), [moveInstructionRight]);
    const onCompletedActionFunction = jest.fn(()=>false);
    state.tileMap.tiles[0][0].onCompletedAction.move = onCompletedActionFunction;
    state.advanceState(15);
    expect(onCompletedActionFunction).toHaveBeenCalledWith(state, state.tileMap.tiles[0][0]);
    expect(state.position).toEqual({x: 1, y: 0});
  });
  it(`onCompletedAction function with preventDefault should be called with the state and the target on a complete action and dont move the character`, () => {
    const state: BasicState = createState(createNTileTileMap(2, 1), [moveInstructionRight]);
    const onCompletedActionFunction = jest.fn(()=>true);
    state.tileMap.tiles[0][0].onCompletedAction.move = onCompletedActionFunction;
    state.advanceState(15);
    expect(onCompletedActionFunction).toHaveBeenCalledWith(state, state.tileMap.tiles[0][0]);
    expect(state.position).toEqual({x: 0, y: 0});
  });
  it(`should fail if the manaToSpend is negative or zero`, () => {
    const state: BasicState = createState(createNTileTileMap(2, 1), [moveInstructionRight]);
    expect(() => state.advanceState(0)).toThrowErrorMatchingInlineSnapshot(`"Invalid mana to spend"`);
    expect(() => state.advanceState(-1)).toThrowErrorMatchingInlineSnapshot(`"Invalid mana to spend"`);
  });
  it(`should refund mana if the cost is less than the already spent mana`, () => {
    const state: BasicState = createState(createNTileTileMap(2, 1), [moveInstructionRight]);
    state.instructionList.spentActionMana = 15;
    const remainingMana = state.advanceState(5);
    expect(remainingMana).toBe(10);
    expect(state.position).toEqual({x: 1, y: 0});
  });
});

describe(`performAction`, () => {
  it(`should move the character if the action is a move action`, () => {
    const state: BasicState = createState(createNTileTileMap(2, 1), [moveInstructionRight]);
    state.performAction(moveInstructionRight, state.tileMap.tiles[0][0]);
    expect(state.position).toEqual({x: 1, y: 0});
  });
  it(`should delete the entity if the action is an attack action and the target is an entity`, () => {
    const entity = createEntity(1, "Enemy", {});
    const state: BasicState = createState(createNTileTileMap(2, 1), [moveInstructionRight]);
    state.tileMap.tiles[0][0].entityId = 1;
    state.tileMap.entities.set(1, entity);
    state.performAction({name: "Attack", type: "attack", count: 1}, entity);
    expect(state.getEntity(state.tileMap.tiles[0][0])).toBeUndefined();
  });
});

describe(`getEntity`, () => {
  it(`should return the entity if there is one`, () => {
    const entity = createEntity(1, "Enemy", {});
    const state: BasicState = createState(createNTileTileMap(1, 1), []);
    state.tileMap.tiles[0][0].entityId = 1;
    state.tileMap.entities.set(1, entity);
    expect(state.getEntity(state.tileMap.tiles[0][0])).toBe(entity);
  });
  it(`should return undefined if there is no entity`, () => {
    const state: BasicState = createState(createNTileTileMap(1, 1), []);
    expect(state.getEntity(state.tileMap.tiles[0][0])).toBeUndefined();
  });
  it(`should throw if the entityId is not in the entities map`, () => {
    const state: BasicState = createState(createNTileTileMap(1, 1), []);
    state.tileMap.tiles[0][0].entityId = 1;
    expect(() => state.getEntity(state.tileMap.tiles[0][0])).toThrowErrorMatchingInlineSnapshot(`"Entity not found"`);
  });
});

describe(`deserializePermanentState`, () => {
  it(`should deserialize the state, keeping entityId of tiles, mana, familiarityThisLoop, timesCompletedThisLoop, and position from initialState, but the rest from serializedState`, () => {
    const state: BasicState = createState(createNTileTileMap(2, 2), [moveInstructionRight]);
    state.mana.current = 50;

    state.position = {x: 1, y: 0};

    const entity = createEntity(1, "Enemy", {});
    entity.familiarity.move = 1;
    state.tileMap.tiles[0][0].entityId = 1;
    state.tileMap.entities.set(1, entity);

    state.tileMap.tiles[0][0].familiarity.move = 1;
    state.tileMap.tiles[0][1].familiarity.move = 10;
    state.tileMap.tiles[0][0].familiarityThisLoop.move = 5;
    state.tileMap.tiles[0][1].familiarityThisLoop.move = 50;
    state.tileMap.tiles[0][0].timesPerformed.move = 1;
    state.tileMap.tiles[0][1].timesPerformed.move = 10;
    state.tileMap.tiles[0][0].timesPerformedThisLoop.move = 5;
    state.tileMap.tiles[0][1].timesPerformedThisLoop.move = 50;

    const persistent = {shouldStay: 1};
    state.persistentData = persistent;
    const loop = {shouldChange: 1};
    state.loopData = loop;

    const serializedState = state.serializePermanentState();


    const initialState = createState(createNTileTileMap(2, 2), [moveInstructionLeft]);
    initialState.mana.current = 100;

    initialState.position = {x: 0, y: 1};

    const newEntity = createEntity(1, "Enemy", {});
    entity.familiarity.move = 2;
    initialState.tileMap.tiles[0][1].entityId = 1;
    initialState.tileMap.entities.set(1, newEntity);

    initialState.tileMap.tiles[0][0].familiarity.move = 2;
    initialState.tileMap.tiles[0][1].familiarity.move = 20;
    initialState.tileMap.tiles[0][0].familiarityThisLoop.move = 6;
    initialState.tileMap.tiles[0][1].familiarityThisLoop.move = 60;
    initialState.tileMap.tiles[0][0].timesPerformed.move = 2;
    initialState.tileMap.tiles[0][1].timesPerformed.move = 20;
    initialState.tileMap.tiles[0][0].timesPerformedThisLoop.move = 6;
    initialState.tileMap.tiles[0][1].timesPerformedThisLoop.move = 60;

    const initialPersistent = {shouldStay: 2};
    initialState.persistentData = initialPersistent;
    const initialLoop = {shouldChange: 2};
    initialState.loopData = initialLoop;
    initialState.deserializePermanentState(serializedState);

    expect(initialState.mana.current).toEqual(100);
    expect(initialState.position).toEqual({x: 0, y: 1});
    expect(initialState.tileMap.tiles[0][0].entityId).toEqual(undefined);
    expect(initialState.tileMap.tiles[0][1].entityId).toEqual(1);

    expect(initialState.tileMap.tiles[0][0].familiarity.move).toEqual(1);
    expect(initialState.tileMap.tiles[0][1].familiarity.move).toEqual(10);
    expect(initialState.tileMap.tiles[0][0].familiarityThisLoop.move).toEqual(6);
    expect(initialState.tileMap.tiles[0][1].familiarityThisLoop.move).toEqual(60);

    expect(initialState.tileMap.tiles[0][0].timesPerformed.move).toEqual(1);
    expect(initialState.tileMap.tiles[0][1].timesPerformed.move).toEqual(10);
    expect(initialState.tileMap.tiles[0][0].timesPerformedThisLoop.move).toEqual(6);
    expect(initialState.tileMap.tiles[0][1].timesPerformedThisLoop.move).toEqual(60);

    expect(initialState.tileMap.entities.get(1)?.familiarity.move).toEqual(1);

    expect(initialState.persistentData).toEqual(persistent);
    expect(initialState.persistentData).not.toBe(persistent);
    expect(initialState.loopData).toBe(initialLoop);
  });
});