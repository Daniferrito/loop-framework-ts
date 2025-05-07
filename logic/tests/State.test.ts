import { State, GenericCalc, TileMap, TileDefinition, Cell, Action, ActionDefinition } from "../src";

type AT = "move" | "attack";
type AD = {x: number, y: number};
type TP = {};
type TL = {};
type TDL = {};
type CP = {};
type CL = {};
type GP = {};
type GL = {};
type BasicState = State<AT, AD, TP, TL, TDL, CP, CL, GP, GL>;

const flatNumber: (n: number) => GenericCalc<AT, AD, TP, TL, TDL, CP, CL, GP, GL> = (number: number) => () => number;

// Helper function to create a TileWithState
function createWalkableTileWithState(name: string): TileDefinition<AT, AD, TP, TL, TDL, CP, CL, GP, GL> {
  return {
    name,
    cost: {move: flatNumber(10)},
    definitionLoopData: {},
  };
}

function createSameNTileTileMap(width: number, height: number, tileDefinition?: TileDefinition<AT, AD, TP, TL, TDL, CP, CL, GP, GL>): TileMap<AT, AD, TP, TL, TDL, CP, CL, GP, GL> {
  const finalTileDefinition: TileDefinition<AT, AD, TP, TL, TDL, CP, CL, GP, GL> = tileDefinition ?? createWalkableTileWithState("Grass");
  const tileID = 0;
  const cells: Cell<TP, TL>[][] = [];
  for (let y = 0; y < height; y++) {
    const row: Cell<TP, TL>[] = [];
    for (let x = 0; x < width; x++) {
      row.push({tiles: [{id: tileID, persistentData: {}, loopData: {}}]});
    }
    cells.push(row);
  }

  return {
    cells: [[cells]],
    tileDefinitions: {[tileID]: finalTileDefinition},
  };
}

//Helper function to create a State with a single character
function createSingleCharacterState(tileMap: TileMap<AT, AD, TP, TL, TDL, CP, CL, GP, GL>, actions: Action[] = [], actionDefinitions: { [id: number]: ActionDefinition<AT, AD> } = defaultActionDefinitions): BasicState {
  const state =  new State<AT, AD, TP, TL, TDL, CP, CL, GP, GL>(
    () => ({
      tileMap,
      characters: [{
        name: "Player",
        position: {i: 0, j: 0, x: 0, y: 0},
        actionList: {
          actions,
          possibleActions: actionDefinitions,
          index: 0,
          subIndex: 0,
          spentActionMana: 0,
        },
        persistentData: {},
        loopData: {}
      }],
      possibleActions: actionDefinitions,
      alwaysCallbacks: {
        onCompleteAction: {
          move: [({state, action}) => {
            const oP = state.characters[0].position;
            const dP = action.data;
            state.characters[0].position = {i: oP.i, j: oP.j, x: oP.x+dP.x, y: oP.y+dP.y};
            return false;
          }]
        }
      },
      persistentData: {},
      loopData: {},
    })
  )
  return state;
}

const moveActionRight: Action = {id: 0, repetitions: 1, global: true};
const moveActionLeft: Action = {id: 1, repetitions: 1, global: true};
const moveActionUp: Action = {id: 2, repetitions: 1, global: true};
const moveActionDown: Action = {id: 3, repetitions: 1, global: true};

const moveActionDefinitionRight: ActionDefinition<AT,AD> = {name: "Move Right", type: "move", data:{ x: 1, y: 0 }};
const moveActionDefinitionLeft: ActionDefinition<AT,AD> = {name: "Move Left", type: "move", data:{ x: -1, y: 0 }};
const moveActionDefinitionUp: ActionDefinition<AT,AD> = {name: "Move Up", type: "move", data:{ x: 0, y: -1 }};
const moveActionDefinitionDown: ActionDefinition<AT,AD> = {name: "Move Down", type: "move", data:{ x: 1, y: 1 }};

const defaultActionDefinitions: { [id: number]: ActionDefinition<AT, AD> } = {
  0: moveActionDefinitionRight,
  1: moveActionDefinitionLeft,
  2: moveActionDefinitionUp,
  3: moveActionDefinitionDown,
};

describe(`advanceState`, () => {
  it('should behave correctly on a move action with not enough mana', () => {
    const state: BasicState = createSingleCharacterState(createSameNTileTileMap(2, 1), [moveActionRight]);
    const response = state.advanceState(5);
    // Check that all the mana has been spent
    expect(response.leftoverMana).toBe(0);
    expect(response.spentMana).toBe(5);
    // CHeck that no action was completed
    expect(response.actionCompleted).toBe(false);
    // Check that the position has not been updated
    expect(state.characters[0].position).toEqual({i: 0, j: 0, x: 0, y: 0});
    // Check that the instruction list has not been updated
    expect(state.characters[0].actionList.index).toBe(0);
    // Check that the subIndex has not been updated
    expect(state.characters[0].actionList.subIndex).toBe(0);
    // Check that the spentActionMana has been updated
    expect(state.characters[0].actionList.spentActionMana).toBe(5);
  });
  it('should behave correctly on a move command with too much mana', () => {
    const state: BasicState = createSingleCharacterState(createSameNTileTileMap(2, 1), [moveActionRight]);
    const response = state.advanceState(15);
    // Check that there is remaining mana
    expect(response.spentMana).toBe(10);
    expect(response.leftoverMana).toBe(5);
    // Check that the position has been updated
    expect(state.characters[0].position).toEqual({i: 0, j: 0, x: 1, y: 0});
    // Check that the instruction list has been updated
    expect(state.characters[0].actionList.index).toBe(1);
    // Check that the subIndex has been updated
    expect(state.characters[0].actionList.subIndex).toBe(0);
    // Check that the spentActionMana has been updated
    expect(state.characters[0].actionList.spentActionMana).toBe(0);
  });
  it(`should behave correctly on a move command with exactly enough mana`, () => {
    const state: BasicState = createSingleCharacterState(createSameNTileTileMap(2, 1), [moveActionRight]);
    const response = state.advanceState(10);
    // Check that there is no remaining mana
    expect(response.leftoverMana).toBe(0);
    expect(response.spentMana).toBe(10);
    // Check that the position has been updated
    expect(state.characters[0].position).toEqual({i: 0, j: 0, x: 1, y: 0});
    // Check that the instruction list has been updated
    expect(state.characters[0].actionList.index).toBe(1);
    // Check that the subIndex has been updated
    expect(state.characters[0].actionList.subIndex).toBe(0);
    // Check that the spentActionMana has been updated
    expect(state.characters[0].actionList.spentActionMana).toBe(0);
  });
  it(`should return to the start on a two move command`, () => {
    const state: BasicState = createSingleCharacterState(createSameNTileTileMap(2, 1), [moveActionRight, moveActionLeft]);
    state.advanceState(10);
    state.advanceState(10);
    // Check that the position has been updated
    expect(state.characters[0].position).toEqual({i: 0, j: 0, x: 0, y: 0});
    // Check that the instruction list has been updated
    expect(state.characters[0].actionList.index).toBe(2);
    // Check that the subIndex has been updated
    expect(state.characters[0].actionList.subIndex).toBe(0);
    // Check that the spentActionMana has been updated
    expect(state.characters[0].actionList.spentActionMana).toBe(0);
  });
  it(`should behave correctly on a move command with a count of two`, () => {
    const state: BasicState = createSingleCharacterState(createSameNTileTileMap(3, 1), [{...moveActionRight, repetitions: 2}]);
    state.advanceState(10);
    state.advanceState(10);
    // Check that the position has been updated
    expect(state.characters[0].position).toEqual({i: 0, j: 0, x: 2, y: 0});
    // Check that the instruction list has been updated
    expect(state.characters[0].actionList.index).toBe(1);
    // Check that the subIndex has been updated
    expect(state.characters[0].actionList.subIndex).toBe(0);
    // Check that the spentActionMana has been updated
    expect(state.characters[0].actionList.spentActionMana).toBe(0);
  });
  it(`onPartialAction function should be called with the state and the target on a non-complete action`, () => {
    const state: BasicState = createSingleCharacterState(createSameNTileTileMap(2, 1), [moveActionRight]);
    const onPartialActionFunction = jest.fn();
    const tileRef = state.tileMap.cells[0][0][0][0].tiles[0]
    const tile = state.tileMap.tileDefinitions[tileRef.id]
    tile.callbacks = {
      onProgressAction: {move: [onPartialActionFunction]}
    };
    state.advanceState(5);
    const expectedFnInput = {
      state,
      action: {...moveActionRight, ...moveActionDefinitionRight},
      character: state.characters[0],
      target: {...tile, ...tileRef},
      targetPos: {i: 0, j: 0, x: 0, y: 0},
      spentMana: 5
    };
    expect(onPartialActionFunction).toHaveBeenCalledWith(expectedFnInput);
  });
  it(`onPartialAction function should not be called with the state and the target on a complete action`, () => {
    const state: BasicState = createSingleCharacterState(createSameNTileTileMap(2, 1), [moveActionRight]);
    const onPartialActionFunction = jest.fn();
    const tileRef = state.tileMap.cells[0][0][0][0].tiles[0]
    const tile = state.tileMap.tileDefinitions[tileRef.id]
    tile.callbacks = {
      onProgressAction: {move: [onPartialActionFunction]}
    };
    state.advanceState(15);
    const expectedFnInput = {
      state,
      action: {...moveActionRight, ...moveActionDefinitionRight},
      character: state.characters[0],
      target: {...tile, ...tileRef},
      targetPos: {i: 0, j: 0, x: 0, y: 0},
      spentMana: 10
    };
    expect(onPartialActionFunction).toHaveBeenCalledWith(expectedFnInput);
  });
  it(`onCompletedAction function should not be called on an incomplete action`, () => {
    const state: BasicState = createSingleCharacterState(createSameNTileTileMap(2, 1), [moveActionRight]);
    const onCompletedActionFunction = jest.fn();
    const tile = state.tileMap.tileDefinitions[state.tileMap.cells[0][0][0][0].tiles[0].id]
    tile.callbacks = {
      onCompleteAction: {move: [onCompletedActionFunction]}
    };
    state.advanceState(5);
    const expectedFnInput = {
      state,
      action: {...moveActionRight, ...moveActionDefinitionRight},
      character: state.characters[0],
      target: tile,
      targetPos: {i: 0, j: 0, x: 0, y: 0}
    };
    expect(onCompletedActionFunction).not.toHaveBeenCalledWith(expectedFnInput);
  });
  it(`should do nothing if the manaToSpend is negative or zero`, () => {
    const state: BasicState = createSingleCharacterState(createSameNTileTileMap(2, 1), [moveActionRight]);
    expect(state.advanceState(0)).toEqual({leftoverMana: 0, spentMana: 0, actionCompleted: false, whoCompleted: new Set()});
    expect(state.advanceState(-1)).toEqual({leftoverMana: 0, spentMana: 0, actionCompleted: false, whoCompleted: new Set()});
  });
  it(`should refund mana if the cost is less than the already spent mana`, () => {
    const state: BasicState = createSingleCharacterState(createSameNTileTileMap(2, 1), [moveActionRight]);
    state.characters[0].actionList.spentActionMana = 15;
    const {leftoverMana} = state.advanceState(5);
    expect(leftoverMana).toBe(10);
    expect(state.characters[0].position).toEqual({i: 0, j: 0, x: 1, y: 0});
  });
});

describe(`deserializePermanentState`, () => {
  it(`should deserialize the state, keeping permanentData from serializedState, and the rest from initialState`, () => {
    const state: BasicState = createSingleCharacterState(createSameNTileTileMap(2, 2), [moveActionRight]);

    state.characters[0].position = {i: 0, j: 0, x: 1, y: 0};

    const persistent = {shouldStay: 1};
    state.persistentData = persistent;
    const loop = {shouldChange: 1};
    state.loopData = loop;

    const serializedState = state.serializePermanentState();


    const initialState = createSingleCharacterState(createSameNTileTileMap(2, 2), [moveActionLeft]);

    initialState.characters[0].position = {i: 0, j: 0, x: 0, y: 1};

    const initialPersistent = {shouldStay: 2};
    initialState.persistentData = initialPersistent;
    const initialLoop = {shouldChange: 2};
    initialState.loopData = initialLoop;

    initialState.deserializePermanentState(serializedState);

    expect(initialState.characters[0].position).toEqual({i: 0, j: 0, x: 0, y: 1});

    expect(initialState.persistentData).toEqual(persistent);
    expect(initialState.persistentData).not.toBe(persistent);
    expect(initialState.loopData).toBe(initialLoop);
  });
});

describe(`resetLoop`, () => {
  it('should reset the state to its initial state', () => {
    const initialState: BasicState = createSingleCharacterState(createSameNTileTileMap(1, 1), [moveActionRight]);
    initialState.characters[0].position = {i: 0, j: 0, x: 1, y: 0};
    initialState.characters[0].actionList.index = 1;
    initialState.characters[0].actionList.actions = [moveActionLeft];
    const serializedState = initialState.serializePermanentState();
    initialState.resetLoop();
    expect(initialState.serializePermanentState()).toBe(serializedState);
    expect(initialState.characters[0].position).toEqual({i: 0, j: 0, x: 0, y: 0});
    expect(initialState.characters[0].actionList.index).toBe(0);
    expect(initialState.characters[0].actionList.actions).toEqual([moveActionRight]);
  });
});

describe(`getPaths`, () => {
  it(`should return an empty array if there are no characters`, () => {
    const state =  new State<AT, AD, TP, TL, TDL, CP, CL, GP, GL>(
      () => ({
        tileMap: createSameNTileTileMap(2, 1),
        characters: [],
        possibleActions: defaultActionDefinitions,
        alwaysCallbacks: {
          onCompleteAction: {
            move: [({state, action}) => {
              const oP = state.characters[0].position;
              const dP = action.data;
              state.characters[0].position = {i: oP.i, j: oP.j, x: oP.x+dP.x, y: oP.y+dP.y};
              return false;
            }]
          }
        },
        persistentData: {},
        loopData: {},
      })
    )
    expect(state.getPaths()).toEqual([]);
  });
  it(`should return an array with a single path if there is a single character`, () => {
    const state: BasicState = createSingleCharacterState(createSameNTileTileMap(2, 1), [moveActionRight]);
    expect(state.getPaths()).toEqual([{
      characterIndex: 0,
      path: [
        {
          actionName: "Start",
          index: -1,
          position: {i: 0, j: 0, x: 0, y: 0},
          type: undefined,
          actionCost: 0,
          totalCost: 0,
        },
        {
          actionName: "Move Right",
          index: 0,
          position: {i: 0, j: 0, x: 1, y: 0},
          type: "move",
          actionCost: 10,
          totalCost: 10,
        }
      ],
    }]);
  });
});