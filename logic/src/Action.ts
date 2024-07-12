export interface FullAction<ActionType extends string, ActionData> extends ActionDefinition<ActionType, ActionData>, Action {}

export interface ActionDefinition<ActionType extends string, ActionData> {
  name: string;
  type: ActionType;
  data: ActionData;
}

export interface Action {
  // This is the index in the possibleActions array, or the global possibleActions array if global is true
  id: number;
  global: boolean;
  repetitions: number;
}

export interface ActionList<ActionType extends string, ActionData> {
  actions: Action[];
  possibleActions?: { [id: number]: ActionDefinition<ActionType, ActionData> };
  index: number;
  subIndex: number;
  spentActionMana: number;
}