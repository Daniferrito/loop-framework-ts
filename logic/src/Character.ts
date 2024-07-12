import { ActionList } from "./Action";
import { CostType, GenericCallbacksType, PerActionCallbacksType } from "./Callbacks";
import { Coordinates } from "./TileMap";

export interface Character<ActionType extends string, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> {
  disabled?: boolean;

  name: string

  position: Coordinates;
  actionList: ActionList<ActionType, ActionData>;

  cost?: CostType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  callbacks?: PerActionCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  alwaysCallbacks?: PerActionCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  genericCallbacks?: GenericCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;
  alwaysGenericCallbacks?: GenericCallbacksType<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>;


  persistentData: CharacterPersistentData;
  loopData: CharacterLoopData;
}