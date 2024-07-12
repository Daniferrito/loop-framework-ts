export enum LoopFrameworkErrorCode {
  NoAction = "NoAction",
  ActionNotFound = "ActionNotFound",
  NoCost = "NoCost",
}

export interface LoopFrameworkError extends Error {
  code: LoopFrameworkErrorCode;
}