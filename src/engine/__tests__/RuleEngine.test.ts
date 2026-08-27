import { describe, it, expect } from 'vitest';
import { 
  computeCallsTotal, 
  computeActualTotal, 
  validateRound, 
  calculateRoundStatus,
  evaluateRound 
} from '../RuleEngine';
import { Round, RulesConfig, PlayerRoundState, Color } from '../../models/types';
import { POCKET_DEFAULT_CONFIG } from '../../features/settings/defaultPresets';

describe('RuleEngine', () => {
  describe('computeCallsTotal', () => {
    it('should sum all player calls', () => {
      const round: Round = {
        id: '1',
        number: 1,
        type: 'NORMAL',
        mainColor: null,
        currentColor: null,
        colorChanged: false,
        callerPlayerId: null,
        totalCalls: 0,
        status: null,
        players: [
          { playerId: 'p1', name: 'P1', call: 3, callColor: null, actualTricks: null, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p2', name: 'P2', call: 4, callColor: null, actualTricks: null, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p3', name: 'P3', call: 3, callColor: null, actualTricks: null, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p4', name: 'P4', call: 3, callColor: null, actualTricks: null, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
        ],
        incomingMultiplier: 1,
        multiplier: 1,
        specialEvents: [],
        played: false,
      };

      expect(computeCallsTotal(round)).toBe(13);
    });

    it('should handle null calls as 0', () => {
      const round: Round = {
        id: '1',
        number: 1,
        type: 'NORMAL',
        mainColor: null,
        currentColor: null,
        colorChanged: false,
        callerPlayerId: null,
        totalCalls: 0,
        status: null,
        players: [
          { playerId: 'p1', name: 'P1', call: null, callColor: null, actualTricks: null, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p2', name: 'P2', call: 5, callColor: null, actualTricks: null, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
        ],
        incomingMultiplier: 1,
        multiplier: 1,
        specialEvents: [],
        played: false,
      };

      expect(computeCallsTotal(round)).toBe(5);
    });
  });

  describe('computeActualTotal', () => {
    it('should sum all actual tricks', () => {
      const round: Round = {
        id: '1',
        number: 1,
        type: 'NORMAL',
        mainColor: null,
        currentColor: null,
        colorChanged: false,
        callerPlayerId: null,
        totalCalls: 0,
        status: null,
        players: [
          { playerId: 'p1', name: 'P1', call: null, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p2', name: 'P2', call: null, callColor: null, actualTricks: 4, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p3', name: 'P3', call: null, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p4', name: 'P4', call: null, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
        ],
        incomingMultiplier: 1,
        multiplier: 1,
        specialEvents: [],
        played: false,
      };

      expect(computeActualTotal(round)).toBe(13);
    });
  });

  describe('validateRound', () => {
    it('should return no errors for valid round', () => {
      const round: Round = {
        id: '1',
        number: 1,
        type: 'NORMAL',
        mainColor: null,
        currentColor: null,
        colorChanged: false,
        callerPlayerId: 'p1',
        totalCalls: 12,
        status: null,
        players: [
          { playerId: 'p1', name: 'P1', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p2', name: 'P2', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p3', name: 'P3', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p4', name: 'P4', call: 3, callColor: null, actualTricks: 4, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
        ],
        incomingMultiplier: 1,
        multiplier: 1,
        specialEvents: [],
        played: false,
      };

      const errors = validateRound(round, POCKET_DEFAULT_CONFIG);
      expect(errors).toHaveLength(0);
    });

    it('should return error for missing caller', () => {
      const round: Round = {
        id: '1',
        number: 1,
        type: 'NORMAL',
        mainColor: null,
        currentColor: null,
        colorChanged: false,
        callerPlayerId: null,
        totalCalls: 12,
        status: null,
        players: [
          { playerId: 'p1', name: 'P1', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p2', name: 'P2', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p3', name: 'P3', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p4', name: 'P4', call: 3, callColor: null, actualTricks: 4, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
        ],
        incomingMultiplier: 1,
        multiplier: 1,
        specialEvents: [],
        played: false,
      };

      const errors = validateRound(round, POCKET_DEFAULT_CONFIG);
      expect(errors).toContain('A Caller must be selected for the round.');
    });

    it('should return error for invalid actual tricks sum', () => {
      const round: Round = {
        id: '1',
        number: 1,
        type: 'NORMAL',
        mainColor: null,
        currentColor: null,
        colorChanged: false,
        callerPlayerId: 'p1',
        totalCalls: 12,
        status: null,
        players: [
          { playerId: 'p1', name: 'P1', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p2', name: 'P2', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p3', name: 'P3', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p4', name: 'P4', call: 3, callColor: null, actualTricks: 2, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
        ],
        incomingMultiplier: 1,
        multiplier: 1,
        specialEvents: [],
        played: false,
      };

      const errors = validateRound(round, POCKET_DEFAULT_CONFIG);
      expect(errors.some(e => e.includes('Sum of actual tricks'))).toBe(true);
    });

    it('should return error for exactly 13 calls when not allowed', () => {
      const round: Round = {
        id: '1',
        number: 1,
        type: 'NORMAL',
        mainColor: null,
        currentColor: null,
        colorChanged: false,
        callerPlayerId: 'p1',
        totalCalls: 13,
        status: null,
        players: [
          { playerId: 'p1', name: 'P1', call: 4, callColor: null, actualTricks: 4, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p2', name: 'P2', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p3', name: 'P3', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p4', name: 'P4', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
        ],
        incomingMultiplier: 1,
        multiplier: 1,
        specialEvents: [],
        played: false,
      };

      const errors = validateRound(round, POCKET_DEFAULT_CONFIG);
      expect(errors.some(e => e.includes('exactly 13'))).toBe(true);
    });
  });

  describe('calculateRoundStatus', () => {
    it('should return UNDER when total calls < underThreshold', () => {
      const round: Round = {
        id: '1',
        number: 1,
        type: 'NORMAL',
        mainColor: null,
        currentColor: null,
        colorChanged: false,
        callerPlayerId: 'p1',
        totalCalls: 10,
        status: null,
        players: [
          { playerId: 'p1', name: 'P1', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p2', name: 'P2', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p3', name: 'P3', call: 2, callColor: null, actualTricks: 2, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p4', name: 'P4', call: 2, callColor: null, actualTricks: 5, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
        ],
        incomingMultiplier: 1,
        multiplier: 1,
        specialEvents: [],
        played: false,
      };

      expect(calculateRoundStatus(round, POCKET_DEFAULT_CONFIG)).toBe('UNDER');
    });

    it('should return OVER when total calls >= underThreshold', () => {
      const round: Round = {
        id: '1',
        number: 1,
        type: 'NORMAL',
        mainColor: null,
        currentColor: null,
        colorChanged: false,
        callerPlayerId: 'p1',
        totalCalls: 14,
        status: null,
        players: [
          { playerId: 'p1', name: 'P1', call: 4, callColor: null, actualTricks: 4, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p2', name: 'P2', call: 4, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p3', name: 'P3', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p4', name: 'P4', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
        ],
        incomingMultiplier: 1,
        multiplier: 1,
        specialEvents: [],
        played: false,
      };

      expect(calculateRoundStatus(round, POCKET_DEFAULT_CONFIG)).toBe('OVER');
    });

    it('should return INVALID when total calls equals tricks per round and not allowed', () => {
      const round: Round = {
        id: '1',
        number: 1,
        type: 'NORMAL',
        mainColor: null,
        currentColor: null,
        colorChanged: false,
        callerPlayerId: 'p1',
        totalCalls: 13,
        status: null,
        players: [
          { playerId: 'p1', name: 'P1', call: 4, callColor: null, actualTricks: 4, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p2', name: 'P2', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p3', name: 'P3', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p4', name: 'P4', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
        ],
        incomingMultiplier: 1,
        multiplier: 1,
        specialEvents: [],
        played: false,
      };

      expect(calculateRoundStatus(round, POCKET_DEFAULT_CONFIG)).toBe('INVALID');
    });
  });

  describe('evaluateRound', () => {
    it('should correctly set caller and with designations', () => {
      const round: Round = {
        id: '1',
        number: 1,
        type: 'NORMAL',
        mainColor: null,
        currentColor: null,
        colorChanged: false,
        callerPlayerId: 'p1',
        totalCalls: 12,
        status: null,
        players: [
          { playerId: 'p1', name: 'P1', call: 4, callColor: null, actualTricks: 4, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p2', name: 'P2', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p3', name: 'P3', call: 4, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p4', name: 'P4', call: 1, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
        ],
        incomingMultiplier: 1,
        multiplier: 1,
        specialEvents: [],
        played: false,
      };

      const evaluated = evaluateRound(round, POCKET_DEFAULT_CONFIG);
      
      expect(evaluated.players[0].isCaller).toBe(true);
      expect(evaluated.players[2].isWith).toBe(true); // Same call as caller
      expect(evaluated.players[1].isWith).toBe(false);
      expect(evaluated.players[3].isWith).toBe(false);
    });

    it('should set WIN result when call equals actual tricks', () => {
      const round: Round = {
        id: '1',
        number: 1,
        type: 'NORMAL',
        mainColor: null,
        currentColor: null,
        colorChanged: false,
        callerPlayerId: 'p1',
        totalCalls: 12,
        status: null,
        players: [
          { playerId: 'p1', name: 'P1', call: 4, callColor: null, actualTricks: 4, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p2', name: 'P2', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p3', name: 'P3', call: 4, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p4', name: 'P4', call: 1, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
        ],
        incomingMultiplier: 1,
        multiplier: 1,
        specialEvents: [],
        played: false,
      };

      const evaluated = evaluateRound(round, POCKET_DEFAULT_CONFIG);
      
      expect(evaluated.players[0].result).toBe('WIN');
      expect(evaluated.players[1].result).toBe('WIN');
      expect(evaluated.players[2].result).toBe('LOSS');
      expect(evaluated.players[3].result).toBe('LOSS');
    });

    it('should set WIN for DASH declaration when actual tricks is 0', () => {
      const round: Round = {
        id: '1',
        number: 1,
        type: 'NORMAL',
        mainColor: null,
        currentColor: null,
        colorChanged: false,
        callerPlayerId: 'p1',
        totalCalls: 12,
        status: null,
        players: [
          { playerId: 'p1', name: 'P1', call: 0, callColor: null, actualTricks: 0, result: null, isCaller: false, isWith: false, declaration: 'DASH', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p2', name: 'P2', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p3', name: 'P3', call: 4, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p4', name: 'P4', call: 5, callColor: null, actualTricks: 7, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
        ],
        incomingMultiplier: 1,
        multiplier: 1,
        specialEvents: [],
        played: false,
      };

      const evaluated = evaluateRound(round, POCKET_DEFAULT_CONFIG);
      expect(evaluated.players[0].result).toBe('WIN');
    });

    it('should set LOSS for DASH declaration when actual tricks is not 0', () => {
      const round: Round = {
        id: '1',
        number: 1,
        type: 'NORMAL',
        mainColor: null,
        currentColor: null,
        colorChanged: false,
        callerPlayerId: 'p1',
        totalCalls: 12,
        status: null,
        players: [
          { playerId: 'p1', name: 'P1', call: 0, callColor: null, actualTricks: 2, result: null, isCaller: false, isWith: false, declaration: 'DASH', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p2', name: 'P2', call: 3, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p3', name: 'P3', call: 4, callColor: null, actualTricks: 3, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
          { playerId: 'p4', name: 'P4', call: 5, callColor: null, actualTricks: 5, result: null, isCaller: false, isWith: false, declaration: 'NONE', riskLevelId: 'normal', calculatedScore: 0, manualScoreOverride: null, finalScore: 0, scoreBreakdown: [] },
        ],
        incomingMultiplier: 1,
        multiplier: 1,
        specialEvents: [],
        played: false,
      };

      const evaluated = evaluateRound(round, POCKET_DEFAULT_CONFIG);
      expect(evaluated.players[0].result).toBe('LOSS');
    });
  });
});
