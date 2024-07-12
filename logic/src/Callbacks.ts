import { FullAction } from "./Action";
import { Character } from "./Character";
import { State } from "./State";
import { Coordinates, FullTile } from "./TileMap";

export type PerActionType<ActionType extends string, T> = { [key in ActionType]?: T };;
export type Callbacks<T, U> = { 
  onStartAction?: T,
  onProgressAction?: U,
  onCompleteAction?: T,
};
export type FnInput<ActionType extends string, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> = {
  state: State<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>, 
  action: FullAction<ActionType, ActionData>, 
  character: Character<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>, 
  target: FullTile<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>, 
  targetPos: Coordinates
};
export type PartialFnInput<ActionType extends string, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> = FnInput<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> & { spentMana: number };
export type GenericCalc<ActionType extends string, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> = (input: FnInput<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>) => number;
export type OnPartialFunc<ActionType extends string, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> = (input: PartialFnInput<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>) => boolean | void;
export type OnCompleteFunc<ActionType extends string, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> = (input: FnInput<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>) => boolean | void;

export type CostType<ActionType extends string, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> = PerActionType<ActionType, GenericCalc<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>>;
export type PerActionCallbacksType<ActionType extends string, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> = Callbacks<
  PerActionType<ActionType, OnCompleteFunc<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>[]>, 
  PerActionType<ActionType, OnPartialFunc<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>[]>
>;
export type GenericCallbacksType<ActionType extends string, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData> = Callbacks<
  OnCompleteFunc<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>[] | undefined,
  OnPartialFunc<ActionType, ActionData, TilePersistentData, TileLoopData, TileDefinitionLoopData, CharacterPersistentData, CharacterLoopData, GlobalPersistentData, GlobalLoopData>[] | undefined
>;