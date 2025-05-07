export enum LoopFrameworkErrorCode {
  NoAction = "NoAction",
  ActionNotFound = "ActionNotFound",
  NoCost = "NoCost",
  InfiniteCost = "InfiniteCost",

  EndLoop = "EndLoop",
}

export interface LoopFrameworkError extends Error {
  code: LoopFrameworkErrorCode;
}