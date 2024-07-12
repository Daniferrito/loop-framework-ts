import { CostType, GenericCallbacksType, PerActionCallbacksType } from "./Callbacks";

export interface FullTile<ActionType extends string, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> extends Tile<TilePersistentData, TileLoopData>, TileDefinition<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> {}

export interface TileDefinition<ActionType extends string, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> {
  name: string;

  cost?: CostType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  callbacks?: PerActionCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  alwaysCallbacks?: PerActionCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  genericCallbacks?: GenericCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  alwaysGenericCallbacks?: GenericCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;

  definitionLoopData: TileDefinitionLoopData;
}

export interface Tile<TilePersistentData, TileLoopData> {
  disabled?: boolean;
  id: number;
  persistentData: TilePersistentData;
  loopData: TileLoopData;
}

export interface Cell<TilePersistentData, TileLoopData> {
  tiles: Tile<TilePersistentData, TileLoopData>[];
}

export interface Coordinates {
  i: number;
  j: number;
  x: number;
  y: number;
}

export interface TileMap<ActionType extends string, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> {
  cells: Cell<TilePersistentData, TileLoopData>[][][][];
  tileDefinitions: { [id: number]: TileDefinition<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> };
}