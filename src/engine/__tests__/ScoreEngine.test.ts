import { describe, it, expect } from 'vitest';
import { calculateRoundScores } from '../ScoreEngine';
import { POCKET_DEFAULT_CONFIG } from '../../features/settings/defaultPresets';
import { evaluateRound } from '../RuleEngine';
import { Round } from '../../models/types';

describe('ScoreEngine', () => {
  const createBaseRound = (): Round => ({
    id: '1',
    number: 1,
    type: 'NORMAL',
    mainColor: null,
    currentColor: null,
    colorChanged: false,
    callerPlayerId: 'p1',
    callSuit: null,
    totalCalls: 16,
    status: 'UNDER',
    players: [
      { playerId: 'p1', name: 'P1', call: 4,  actualTricks: 4, result: 'WIN', isCaller: true, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
      { playerId: 'p2', name: 'P2', call: 4,  actualTricks: 4, result: 'WIN', isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
      { playerId: 'p3', name: 'P3', call: 4,  actualTricks: 3, result: 'LOSS', isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
      { playerId: 'p4', name: 'P4', call: 4,  actualTricks: 2, result: 'LOSS', isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
    ],
    incomingMultiplier: 1,
    multiplier: 1,
    specialEvents: [],
    played: false,
  });

  describe('Call-Based Scoring', () => {
    it('should calculate call score for WIN (normal call 4 = 14)', () => {
      const round = createBaseRound();
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const callScoreItem = result.players[0].scoreBreakdown.find(item => item.type === 'CALL_SCORE');
      expect(callScoreItem?.amount).toBe(14); // 4 + 10
    });

    it('should calculate call score for LOSS (normal call 4, actual 3 = -1)', () => {
      const round = createBaseRound();
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const callScoreItem = result.players[2].scoreBreakdown.find(item => item.type === 'CALL_SCORE');
      expect(callScoreItem?.amount).toBe(-1); // |4-3| = -1
    });

    it('should calculate super call score for WIN (call 8 = 64)', () => {
      const round = createBaseRound();
      round.players[0].call = 8;
      round.players[0].actualTricks = 8;
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const callScoreItem = result.players[0].scoreBreakdown.find(item => item.type === 'CALL_SCORE');
      expect(callScoreItem?.amount).toBe(64); // 8 * 8
    });

    it('should calculate super call score for LOSS (call 8, actual 5 = -26)', () => {
      const round = createBaseRound();
      round.players[2].call = 8;
      round.players[2].actualTricks = 5;
      round.players[2].result = 'LOSS';
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const callScoreItem = result.players[2].scoreBreakdown.find(item => item.type === 'CALL_SCORE');
      expect(callScoreItem?.amount).toBe(-26); // (|8-5|+10)*2 = (3+10)*2 = -26
    });
  });

  describe('Caller Bonus/Penalty', () => {
    it('should add caller bonus for winning caller (+10)', () => {
      const round = createBaseRound();
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const callerItem = result.players[0].scoreBreakdown.find(item => item.type === 'CALLER');
      expect(callerItem?.amount).toBe(10);
    });

    it('should add caller penalty for losing caller (-10)', () => {
      const round = createBaseRound();
      round.players[0].result = 'LOSS';
      round.players[0].actualTricks = 3;
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const callerItem = result.players[0].scoreBreakdown.find(item => item.type === 'CALLER');
      expect(callerItem?.amount).toBe(-10);
    });
  });

  describe('With Bonus/Penalty', () => {
    it('should add with bonus for winning with player (+10)', () => {
      const round = createBaseRound();
      round.players[1].isWith = true;
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const withItem = result.players[1].scoreBreakdown.find(item => item.type === 'WITH');
      expect(withItem?.amount).toBe(10);
    });

    it('should add with penalty for losing with player (-10)', () => {
      const round = createBaseRound();
      round.players[1].isWith = true;
      round.players[1].result = 'LOSS';
      round.players[1].actualTricks = 2;
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const withItem = result.players[1].scoreBreakdown.find(item => item.type === 'WITH');
      expect(withItem?.amount).toBe(-10);
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

  });

  describe('Only Winner/Loser Bonuses', () => {
    it('should apply only winner bonus when exactly one player wins (+10)', () => {
      const round = createBaseRound();
      round.players[1].result = 'LOSS';
      round.players[1].actualTricks = 2;
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const onlyWinnerItem = result.players[0].scoreBreakdown.find(item => item.type === 'ONLY_WINNER');
      expect(onlyWinnerItem?.amount).toBe(10);
    });

    it('should NOT apply only winner bonus when multiple players win', () => {
      const round = createBaseRound();
      // 2 winners, 2 losers
      round.players[0].result = 'WIN';
      round.players[1].result = 'WIN';
      round.players[2].result = 'LOSS';
      round.players[2].actualTricks = 2;
      round.players[3].result = 'LOSS';
      round.players[3].actualTricks = 2;
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const onlyWinnerItem0 = result.players[0].scoreBreakdown.find(item => item.type === 'ONLY_WINNER');
      const onlyWinnerItem1 = result.players[1].scoreBreakdown.find(item => item.type === 'ONLY_WINNER');
      expect(onlyWinnerItem0).toBeUndefined();
      expect(onlyWinnerItem1).toBeUndefined();
    });

    it('should NOT apply only winner bonus with Dash Call and multiple winners', () => {
      const round = createBaseRound();
      round.status = 'UNDER';
      // 3omda: WIN (Caller, call 6, actual 6)
      round.players[0].call = 6;
      round.players[0].actualTricks = 6;
      round.players[0].isCaller = true;
      // saber: LOSE (call 3, actual 2)
      round.players[1].call = 3;
      round.players[1].actualTricks = 2;
      // mouner: WIN (Dash Call, call 0, actual 0)
      round.players[2].declaration = 'DASH_CALL';
      round.players[2].call = 0;
      round.players[2].actualTricks = 0;
      // mina: LOSE (call 2, actual 3)
      round.players[3].call = 2;
      round.players[3].actualTricks = 3;
      
      // First evaluate to determine WIN/LOSS results
      const evaluated = evaluateRound(round, POCKET_DEFAULT_CONFIG);
      
      // Then calculate scores
      const result = calculateRoundScores(evaluated, POCKET_DEFAULT_CONFIG);
      
      // Check winner count
      const winners = result.players.filter(p => p.result === 'WIN');
      expect(winners.length).toBe(2); // 3omda and mouner
      
      // Should NOT have Only Winner bonus
      const onlyWinnerItem0 = result.players[0].scoreBreakdown.find(item => item.type === 'ONLY_WINNER');
      const onlyWinnerItem2 = result.players[2].scoreBreakdown.find(item => item.type === 'ONLY_WINNER');
      expect(onlyWinnerItem0).toBeUndefined();
      expect(onlyWinnerItem2).toBeUndefined();
    });

    it('should apply only loser penalty when exactly one player loses (-10)', () => {
      const round = createBaseRound();
      round.players[0].result = 'WIN';
      round.players[1].result = 'LOSS';
      round.players[2].result = 'WIN';
      round.players[3].result = 'WIN';
      
      const result = calculateRoundScores(round, POCKET_DEFAULT_CONFIG);
      
      const onlyLoserItem = result.players[1].scoreBreakdown.find(item => item.type === 'ONLY_LOSER');
      expect(onlyLoserItem?.amount).toBe(-10);
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

  describe('Auto Double Multiplier', () => {
    it('should apply x2 multiplier when Caller + 2 With + Dash Call', () => {
      const round = createBaseRound();
      // Set up Caller + 2 With + Dash Call scenario
      round.players[0].call = 5;
      round.players[0].actualTricks = 5;
      round.players[0].declaration = 'DASH_CALL';
      round.players[1].call = 5;
      round.players[1].actualTricks = 5;
      round.players[1].isWith = true;
      round.players[2].call = 5;
      round.players[2].actualTricks = 5;
      round.players[2].isWith = true;
      round.players[3].call = 4;
      round.players[3].actualTricks = 3;
      
      // Evaluate round to set proper WIN/LOSS results
      const evaluatedRound = evaluateRound(round, POCKET_DEFAULT_CONFIG);
      
      const result = calculateRoundScores(evaluatedRound, POCKET_DEFAULT_CONFIG);
      
      // Should have x2 multiplier applied
      expect(result.multiplier).toBe(2);
    });

    it('should not apply x2 multiplier without Dash Call', () => {
      const round = createBaseRound();
      // Set up Caller + 2 With but no Dash Call
      round.players[0].call = 5;
      round.players[0].actualTricks = 5;
      round.players[1].call = 5;
      round.players[1].actualTricks = 5;
      round.players[1].isWith = true;
      round.players[2].call = 5;
      round.players[2].actualTricks = 5;
      round.players[2].isWith = true;
      round.players[3].call = 4;
      round.players[3].actualTricks = 3;
      
      const evaluatedRound = evaluateRound(round, POCKET_DEFAULT_CONFIG);
      
      const result = calculateRoundScores(evaluatedRound, POCKET_DEFAULT_CONFIG);
      
      // Should not have x2 multiplier
      expect(result.multiplier).toBe(1);
    });

    it('should not apply x2 multiplier with only 1 With', () => {
      const round = createBaseRound();
      // Set up Caller + 1 With + Dash Call
      round.players[0].call = 5;
      round.players[0].actualTricks = 5;
      round.players[0].declaration = 'DASH_CALL';
      round.players[1].call = 5;
      round.players[1].actualTricks = 5;
      round.players[1].isWith = true;
      round.players[2].call = 4;
      round.players[2].actualTricks = 4;
      round.players[3].call = 4;
      round.players[3].actualTricks = 3;
      
      const evaluatedRound = evaluateRound(round, POCKET_DEFAULT_CONFIG);
      
      const result = calculateRoundScores(evaluatedRound, POCKET_DEFAULT_CONFIG);
      
      // Should not have x2 multiplier
      expect(result.multiplier).toBe(1);
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
