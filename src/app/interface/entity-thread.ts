import { TieringType } from "../enum/tiering-type";

export interface EntityThread {
  entity: string;
  thread: string;
  taxYear: number;
}

export interface ThreadRelation {
  lowerTier: string;
  upperTier: string;
  tieringType?: TieringType;
}

export interface RollForwardRelation {
  mainThread: string;
  rollForward: string;
  type?: TieringType;
}
