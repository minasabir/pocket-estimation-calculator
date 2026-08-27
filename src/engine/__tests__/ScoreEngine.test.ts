import { describe, it, expect } from 'vitest';
import { calculateRoundScores } from '../ScoreEngine';
import { Round, RulesConfig } from '../../models/types';
import { POCKET_DEFAULT_CONFIG } from '../../features/settings/defaultPresets';

describe('ScoreEngine', () => {
  const createBaseRound = (): Round => ({
    id: '1',
    number: 1,
    type: 'NORMAL',
    mainColor: null,
    currentColor: null,
    colorChanged: false,
    callerPlayerId: 'p1',
    totalCalls: 12,
    status: 'UNDER',
    players: [
      { playerId: 'p1', name: 'P1', call: 4, callColor: null, actualTricks: 4, result: 'WIN', isCaller: true, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
      { playerId: 'p2', name: 'P2', call: 3, callColor: null, actualTricks: 3, result: 'WIN', isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
      { playerId: 'p3', name: 'P3', call: 4, callColor: null, actualTricks: 3, result: 'LOSS', isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
      { playerId: 'p4', name: 'P4', call: 1, callColor: null, actualTricks: 3, result: 'LOSS', isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
    ],
    incomingMultiplier: 1,
    multiplier: 1,
    specialEvents: [],
    played: false,
  });

  describe('Base Scoring', () => {
    it('should calculate base success score for WIN', () => {
      const round = createBaseRound();
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      expect(result.players[0].calculatedScore).toBeGreaterThan(0);
      const baseItem = result.players[0].scoreBreakdown.find(item => item.type === 'BASE');
      expect(baseItem?.amount).toBe(POCKET_DEFAULT_CONFIG.base.successScore);
    });

    it('should calculate base failure penalty for LOSS', () => {
      const round = createBaseRound();
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      expect(result.players[2].calculatedScore).toBeLessThan(0);
      const baseItem = result.players[2].scoreBreakdown.find(item => item.type === 'BASE');
      expect(baseItem?.amount).toBe(POCKET_DEFAULT_CONFIG.base.failurePenalty);
    });
  });

  describe('Caller Bonus/Penalty', () => {
    it('should add caller bonus for winning caller', () => {
      const round = createBaseRound();
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const callerItem = result.players[0].scoreBreakdown.find(item => item.type === 'CALLER');
      expect(callerItem?.amount).toBe(POCKET_DEFAULT_CONFIG.caller.successScore);
    });

    it('should add caller penalty for losing caller', () => {
      const round = createBaseRound();
      round.players[0].result = 'LOSS';
      round.players[0].actualTricks = 3;
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const callerItem = result.players[0].scoreBreakdown.find(item => item.type === 'CALLER');
      expect(callerItem?.amount).toBe(POCKET_DEFAULT_CONFIG.caller.failurePenalty);
    });
  });

  describe('With Bonus/Penalty', () => {
    it('should add with bonus for winning with player', () => {
      const round = createBaseRound();
      round.players[1].isWith = true;
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const withItem = result.players[1].scoreBreakdown.find(item => item.type === 'WITH');
      expect(withItem?.amount).toBe(POCKET_DEFAULT_CONFIG.withRule.successScore);
    });

    it('should add with penalty for losing with player', () => {
      const round = createBaseRound();
      round.players[1].isWith = true;
      round.players[1].result = 'LOSS';
      round.players[1].actualTricks = 2;
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const withItem = result.players[1].scoreBreakdown.find(item => item.type === 'WITH');
      expect(withItem?.amount).toBe(POCKET_DEFAULT_CONFIG.withRule.failurePenalty);
    });
  });

  describe('Risk Level Bonuses', () => {
    it('should apply risk bonus for winning player with risk level', () => {
      const round = createBaseRound();
      round.players[0].riskLevelId = 'risk';
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const riskItem = result.players[0].scoreBreakdown.find(item => item.type === 'RISK');
      const riskLevel = POCKET_DEFAULT_CONFIG.risk.levels.find(l => l.id === 'risk');
      expect(riskItem?.amount).toBe(riskLevel?.successBonus);
    });

    it('should apply risk penalty for losing player with risk level', () => {
      const round = createBaseRound();
      round.players[2].riskLevelId = 'risk';
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const riskItem = result.players[2].scoreBreakdown.find(item => item.type === 'RISK');
      const riskLevel = POCKET_DEFAULT_CONFIG.risk.levels.find(l => l.id === 'risk');
      expect(riskItem?.amount).toBe(riskLevel?.failurePenalty);
    });
  });

  describe('Special Declarations', () => {
    it('should apply DASH under success score when player wins with DASH in UNDER status', () => {
      const round = createBaseRound();
      round.players[0].declaration = 'DASH';
      round.players[0].call = 0;
      round.players[0].actualTricks = 0;
      round.status = 'UNDER';
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const dashItem = result.players[0].scoreBreakdown.find(item => item.type === 'DASH');
      expect(dashItem?.amount).toBe(POCKET_DEFAULT_CONFIG.dash.underSuccessScore);
    });

    it('should apply DASH over success score when player wins with DASH in OVER status', () => {
      const round = createBaseRound();
      round.players[0].declaration = 'DASH';
      round.players[0].call = 0;
      round.players[0].actualTricks = 0;
      round.status = 'OVER';
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const dashItem = result.players[0].scoreBreakdown.find(item => item.type === 'DASH');
      expect(dashItem?.amount).toBe(POCKET_DEFAULT_CONFIG.dash.overSuccessScore);
    });

    it('should apply DASH under failure penalty when player loses with DASH in UNDER status', () => {
      const round = createBaseRound();
      round.players[0].declaration = 'DASH';
      round.players[0].call = 0;
      round.players[0].actualTricks = 2;
      round.players[0].result = 'LOSS';
      round.status = 'UNDER';
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const dashItem = result.players[0].scoreBreakdown.find(item => item.type === 'DASH');
      expect(dashItem?.amount).toBe(POCKET_DEFAULT_CONFIG.dash.underFailurePenalty);
    });

    it('should apply DASH_CALL under success score when player wins in UNDER status', () => {
      const round = createBaseRound();
      round.players[0].declaration = 'DASH_CALL';
      round.players[0].call = 0;
      round.players[0].actualTricks = 0;
      round.status = 'UNDER';
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const dashCallItem = result.players[0].scoreBreakdown.find(item => item.type === 'DASH_CALL');
      expect(dashCallItem?.amount).toBe(POCKET_DEFAULT_CONFIG.dashCall.underSuccessScore);
    });

    it('should apply ZERO_FROM_HAND over success score when player wins in OVER status', () => {
      const round = createBaseRound();
      round.players[0].declaration = 'ZERO_FROM_HAND';
      round.players[0].call = 0;
      round.players[0].actualTricks = 0;
      round.status = 'OVER';
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const zeroItem = result.players[0].scoreBreakdown.find(item => item.type === 'ZERO_FROM_HAND');
      expect(zeroItem?.amount).toBe(POCKET_DEFAULT_CONFIG.zeroFromHand.overSuccessScore);
    });
  });

  describe('Only Winner/Loser Bonuses', () => {
    it('should apply only winner bonus when exactly one player wins', () => {
      const round = createBaseRound();
      round.players[1].result = 'LOSS';
      round.players[1].actualTricks = 2;
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const onlyWinnerItem = result.players[0].scoreBreakdown.find(item => item.type === 'ONLY_WINNER');
      expect(onlyWinnerItem?.amount).toBe(POCKET_DEFAULT_CONFIG.onlyWinner.bonus);
    });

    it('should apply only loser penalty when exactly one player loses', () => {
      const round = createBaseRound();
      round.players[2].result = 'WIN';
      round.players[2].actualTricks = 4;
      round.players[3].result = 'WIN';
      round.players[3].actualTricks = 2;
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const onlyLoserItem = result.players[1].scoreBreakdown.find(item => item.type === 'ONLY_LOSER');
      expect(onlyLoserItem?.amount).toBe(POCKET_DEFAULT_CONFIG.onlyLoser.penalty);
    });
  });

  describe('Multipliers', () => {
    it('should apply round multiplier when incomingMultiplier > 1', () => {
      const round = createBaseRound();
      round.incomingMultiplier = 2;
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      expect(result.multiplier).toBe(2);
      const multiplierItem = result.players[0].scoreBreakdown.find(item => item.type === 'MULTIPLIER');
      expect(multiplierItem).toBeDefined();
    });

    it('should apply double round multiplier when type is DOUBLE', () => {
      const round = createBaseRound();
      round.type = 'DOUBLE';
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      expect(result.multiplier).toBe(POCKET_DEFAULT_CONFIG.doubleRound.multiplier);
    });
  });

  describe('Manual Override', () => {
    it('should use manual score override when provided', () => {
      const round = createBaseRound();
      round.players[0].manualScoreOverride = 50;
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      expect(result.players[0].finalScore).toBe(50);
    });

    it('should use calculated score when no manual override', () => {
      const round = createBaseRound();
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      expect(result.players[0].finalScore).toBe(result.players[0].calculatedScore);
    });
  });

  describe('Score Breakdown', () => {
    it('should generate complete score breakdown for each player', () => {
      const round = createBaseRound();
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      result.players.forEach(player => {
        expect(player.scoreBreakdown.length).toBeGreaterThan(0);
        player.scoreBreakdown.forEach(item => {
          expect(item.type).toBeDefined();
          expect(item.description).toBeDefined();
          expect(typeof item.amount).toBe('number');
        });
      });
    });

    it('should ensure breakdown amounts sum to calculated score', () => {
      const round = createBaseRound();
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      result.players.forEach(player => {
        const breakdownSum = player.scoreBreakdown.reduce((sum, item) => sum + item.amount, 0);
        expect(breakdownSum).toBe(player.calculatedScore);
      });
    });
  });
});
