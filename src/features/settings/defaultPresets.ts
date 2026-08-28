import { RulesConfig, RulePreset } from '../../models/types';

export const POCKET_DEFAULT_CONFIG: RulesConfig = {
  game: {
    players: 4,
    tricksPerRound: 13,
    normalRounds: 13,
    doubleRounds: 1,
    colorRounds: ['SUNS', 'SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS'],
  },
  calls: {
    minimum: 4,
    maximum: 13,
  },
  roundStatus: {
    underThreshold: 13,
    overThreshold: 13,
    allowExactly13: false,
  },
  base: {
    successScore: 10,
    failurePenalty: -10,
  },
  caller: {
    successScore: 10,
    failurePenalty: -10,
  },
  withRule: {
    successScore: 10,
    failurePenalty: -10,
  },
  risk: {
    levels: [
      { id: 'normal', name: 'Normal', enabled: true, successBonus: 0, failurePenalty: 0 },
      { id: 'risk', name: 'Risk', enabled: true, successBonus: 10, failurePenalty: -10 },
      { id: 'double', name: 'Double Risk', enabled: true, successBonus: 20, failurePenalty: -20 },
      { id: 'triple', name: 'Triple Risk', enabled: true, successBonus: 30, failurePenalty: -30 },
    ],
  },
  dash: {
    enabled: true,
    underSuccessScore: 20,
    overSuccessScore: 10,
    underFailurePenalty: -10,
    overFailurePenalty: -10,
  },
  dashCall: {
    enabled: true,
    underSuccessScore: 30,
    overSuccessScore: 20,
    underFailurePenalty: -20,
    overFailurePenalty: -20,
  },
  onlyWinner: {
    enabled: true,
    bonus: 10,
  },
  onlyLoser: {
    enabled: true,
    penalty: -10,
  },
  saaydeh: {
    enabled: true,
    firstMultiplier: 2,
    secondMultiplier: 4,
    stackingEnabled: true,
  },
  doubleRound: {
    enabled: true,
    multiplier: 2,
  },
  colorChange: {
    enabled: true,
    minimumCall: 8,
    repeatMainColor: true,
  },
  colorAllLoseByTwo: {
    enabled: true,
    requiredDifference: 2,
    allPlayersMustLose: true,
    repeatMainColor: true,
    repeatAtEnd: true,
  },
};

export const DEFAULT_PRESETS: RulePreset[] = [
  {
    id: 'pocket-default',
    name: 'Pocket Estimation Default',
    config: POCKET_DEFAULT_CONFIG,
    isDefault: true,
  },
  {
    id: 'aggressive-risk',
    name: 'Aggressive Risk Tournament',
    config: {
      ...POCKET_DEFAULT_CONFIG,
      risk: {
        levels: [
          { id: 'normal', name: 'Normal', enabled: true, successBonus: 0, failurePenalty: 0 },
          { id: 'risk', name: 'Risk', enabled: true, successBonus: 15, failurePenalty: -15 },
          { id: 'double', name: 'Double Risk', enabled: true, successBonus: 30, failurePenalty: -30 },
          { id: 'triple', name: 'Triple Risk', enabled: true, successBonus: 45, failurePenalty: -45 },
        ],
      },
    },
  },
];
