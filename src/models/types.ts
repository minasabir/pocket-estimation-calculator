export type RoundType = 'NORMAL' | 'DOUBLE' | 'COLOR' | 'SKIPPED';

export type Color = 'SUNS' | 'SPADES' | 'HEARTS' | 'DIAMONDS' | 'CLUBS';

export type RoundStatus = 'UNDER' | 'OVER' | 'INVALID';

export type SpecialDeclaration = 'NONE' | 'DASH' | 'DASH_CALL';

export interface RiskLevel {
  id: string;
  name: string;
  enabled: boolean;
  successBonus: number;
  failurePenalty: number;
}

export interface RulesConfig {
  game: {
    players: number;
    tricksPerRound: number;
    normalRounds: number;
    doubleRounds: number;
    colorRounds: Color[];
  };
  calls: {
    minimum: number;
    maximum: number;
  };
  roundStatus: {
    underThreshold: number;
    overThreshold: number;
    allowExactly13: boolean;
  };
  base: {
    successScore: number;
    failurePenalty: number;
  };
  caller: {
    successScore: number;
    failurePenalty: number;
  };
  withRule: {
    successScore: number;
    failurePenalty: number;
  };
  risk: {
    levels: RiskLevel[];
  };
  dash: {
    enabled: boolean;
    underSuccessScore: number;
    overSuccessScore: number;
    underFailurePenalty: number;
    overFailurePenalty: number;
  };
  dashCall: {
    enabled: boolean;
    underSuccessScore: number;
    overSuccessScore: number;
    underFailurePenalty: number;
    overFailurePenalty: number;
  };
  onlyWinner: {
    enabled: boolean;
    bonus: number;
  };
  onlyLoser: {
    enabled: boolean;
    penalty: number;
  };
  saaydeh: {
    enabled: boolean;
    firstMultiplier: number;
    secondMultiplier: number;
    stackingEnabled: boolean;
  };
  doubleRound: {
    enabled: boolean;
    multiplier: number;
  };
  colorChange: {
    enabled: boolean;
    minimumCall: number;
    repeatMainColor: boolean;
  };
  colorAllLoseByTwo: {
    enabled: boolean;
    requiredDifference: number;
    allPlayersMustLose: boolean;
    repeatMainColor: boolean;
    repeatAtEnd: boolean;
  };
}

export interface RulePreset {
  id: string;
  name: string;
  config: RulesConfig;
  isDefault?: boolean;
}

export interface PlayerRoundState {
  playerId: string;
  name: string;
  call: number | null;
  callColor: Color | null;
  actualTricks: number | null;
  result: 'WIN' | 'LOSS' | null;
  isCaller: boolean;
  isWith: boolean;
  declaration: SpecialDeclaration;
  riskLevelId: string;
  calculatedScore: number;
  manualScoreOverride: number | null;
  finalScore: number;
  scoreBreakdown: ScoreBreakdownItem[];
}

export interface ScoreBreakdownItem {
  type: string;
  description: string;
  amount: number;
}

export interface SpecialEvent {
  id: string;
  type: 'COLOR_CHANGE' | 'COLOR_ALL_LOSE_BY_TWO' | 'SA_AYDEH' | 'MULTIPLIER_CHANGE' | 'MANUAL_OVERRIDE';
  description: string;
  playerId?: string;
  at?: string;
}

export interface Round {
  id: string;
  number: number;
  type: RoundType;
  mainColor: Color | null;
  currentColor: Color | null;
  colorChanged: boolean;
  colorChangedByPlayerId?: string;
  colorChangeCall?: number;
  callerPlayerId: string | null;
  totalCalls: number;
  status: RoundStatus | null;
  players: PlayerRoundState[];
  incomingMultiplier: number;
  multiplier: number; // Final applied multiplier (double round, sa'aydeh stack)
  specialEvents: SpecialEvent[];
  source?: string; // e.g. 'color-change-repeat', 'all-lose-by-two-repeat'
  played: boolean;
}

export interface Player {
  id: string;
  name: string;
}

export interface GameState {
  id: string;
  date: string;
  players: Player[];
  rounds: Round[];
  currentRoundIndex: number;
  pendingMultiplier: number;
  lastRoundWasSaaydeh: boolean;
  rules: RulesConfig;
  presetId: string;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface GameHistoryItem {
  id: string;
  date: string;
  playerNames: string[];
  presetName: string;
  finalScores: number[];
  winnerName: string;
  roundCount: number;
  status: 'ACTIVE' | 'COMPLETED';
}
