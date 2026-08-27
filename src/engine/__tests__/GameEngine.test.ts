import { describe, it, expect } from 'vitest';
import { 
  createPlayerRoundState, 
  createRound, 
  buildInitialQueue, 
  createNewGame, 
  finalizeRound,
  recalculateGameState,
  calculatePlayerTotals 
} from '../GameEngine';
import { POCKET_DEFAULT_CONFIG } from '../../features/settings/defaultPresets';

describe('GameEngine', () => {
  describe('createPlayerRoundState', () => {
    it('should create a blank player round state', () => {
      const state = createPlayerRoundState('p1', 'Player 1');
      
      expect(state.playerId).toBe('p1');
      expect(state.name).toBe('Player 1');
      expect(state.call).toBeNull();
      expect(state.actualTricks).toBeNull();
      expect(state.result).toBeNull();
      expect(state.isCaller).toBe(false);
      expect(state.isWith).toBe(false);
      expect(state.declaration).toBe('NONE');
      expect(state.riskLevelId).toBe('normal');
      expect(state.calculatedScore).toBe(0);
      expect(state.manualScoreOverride).toBeNull();
      expect(state.finalScore).toBe(0);
      expect(state.scoreBreakdown).toEqual([]);
    });
  });

  describe('createRound', () => {
    it('should create a blank round', () => {
      const round = createRound(1, 'NORMAL', null, []);
      
      expect(round.number).toBe(1);
      expect(round.type).toBe('NORMAL');
      expect(round.mainColor).toBeNull();
      expect(round.currentColor).toBeNull();
      expect(round.colorChanged).toBe(false);
      expect(round.callerPlayerId).toBeNull();
      expect(round.callSuit).toBeNull();
      expect(round.totalCalls).toBe(0);
      expect(round.status).toBeNull();
      expect(round.players).toEqual([]);
      expect(round.incomingMultiplier).toBe(1);
      expect(round.multiplier).toBe(1);
      expect(round.specialEvents).toEqual([]);
      expect(round.played).toBe(false);
    });

    it('should create a color round with main color', () => {
      const round = createRound(5, 'COLOR', 'HEARTS', []);
      
      expect(round.type).toBe('COLOR');
      expect(round.mainColor).toBe('HEARTS');
      expect(round.currentColor).toBe('HEARTS');
    });

    it('should include source when provided', () => {
      const round = createRound(1, 'NORMAL', null, [], 'test-source');
      
      expect(round.source).toBe('test-source');
    });
  });

  describe('buildInitialQueue', () => {
    it('should build 19 round queue with default config', () => {
      const players = [
        { id: 'p1', name: 'P1' },
        { id: 'p2', name: 'P2' },
        { id: 'p3', name: 'P3' },
        { id: 'p4', name: 'P4' },
      ];
      
      const queue = buildInitialQueue(POCKET_DEFAULT_CONFIG, players);
      
      expect(queue.length).toBe(19);
      expect(queue[0].type).toBe('NORMAL');
      expect(queue[12].type).toBe('NORMAL'); // 13th normal round
      expect(queue[13].type).toBe('DOUBLE'); // Double round
      expect(queue[14].type).toBe('COLOR'); // First color round
      expect(queue[18].type).toBe('COLOR'); // Last color round
    });

    it('should assign correct colors to color rounds', () => {
      const players = [
        { id: 'p1', name: 'P1' },
        { id: 'p2', name: 'P2' },
        { id: 'p3', name: 'P3' },
        { id: 'p4', name: 'P4' },
      ];
      
      const queue = buildInitialQueue(POCKET_DEFAULT_CONFIG, players);
      
      expect(queue[14].mainColor).toBe('SUNS');
      expect(queue[15].mainColor).toBe('SPADES');
      expect(queue[16].mainColor).toBe('HEARTS');
      expect(queue[17].mainColor).toBe('DIAMONDS');
      expect(queue[18].mainColor).toBe('CLUBS');
    });

    it('should include players in each round', () => {
      const players = [
        { id: 'p1', name: 'P1' },
        { id: 'p2', name: 'P2' },
      ];
      
      const queue = buildInitialQueue(POCKET_DEFAULT_CONFIG, players);
      
      queue.forEach(round => {
        expect(round.players.length).toBe(2);
        expect(round.players[0].playerId).toBe('p1');
        expect(round.players[1].playerId).toBe('p2');
      });
    });
  });

  describe('createNewGame', () => {
    it('should create a new game state', () => {
      const game = createNewGame(['Alice', 'Bob', 'Charlie', 'Dave'], POCKET_DEFAULT_CONFIG, 'pocket-default');
      
      expect(game.id).toBeDefined();
      expect(game.players.length).toBe(4);
      expect(game.players[0].name).toBe('Alice');
      expect(game.rounds.length).toBe(19);
      expect(game.currentRoundIndex).toBe(0);
      expect(game.pendingMultiplier).toBe(1);
      expect(game.lastRoundWasSaaydeh).toBe(false);
      expect(game.status).toBe('ACTIVE');
      expect(game.presetId).toBe('pocket-default');
    });

    it('should trim player names', () => {
      const game = createNewGame(['  Alice  ', '  Bob  '], POCKET_DEFAULT_CONFIG, 'test');
      
      expect(game.players[0].name).toBe('Alice');
      expect(game.players[1].name).toBe('Bob');
    });

    it('should use default name for empty player name', () => {
      const game = createNewGame(['', 'Bob'], POCKET_DEFAULT_CONFIG, 'test');
      
      expect(game.players[0].name).toBe('Unnamed Player');
      expect(game.players[1].name).toBe('Bob');
    });
  });

  describe('calculatePlayerTotals', () => {
    it('should calculate cumulative scores for all players', () => {
      const game = createNewGame(['P1', 'P2', 'P3', 'P4'], POCKET_DEFAULT_CONFIG, 'test');
      
      // Simulate some played rounds
      game.rounds[0].played = true;
      game.rounds[0].players[0].finalScore = 10;
      game.rounds[0].players[1].finalScore = -5;
      game.rounds[0].players[2].finalScore = 15;
      game.rounds[0].players[3].finalScore = -10;
      
      game.rounds[1].played = true;
      game.rounds[1].players[0].finalScore = 5;
      game.rounds[1].players[1].finalScore = 10;
      game.rounds[1].players[2].finalScore = -5;
      game.rounds[1].players[3].finalScore = 0;
      
      const totals = calculatePlayerTotals(game);
      
      expect(totals).toEqual([15, 5, 10, -10]);
    });

    it('should only count played rounds', () => {
      const game = createNewGame(['P1', 'P2'], POCKET_DEFAULT_CONFIG, 'test');
      
      game.rounds[0].played = true;
      game.rounds[0].players[0].finalScore = 10;
      game.rounds[0].players[1].finalScore = 5;
      
      game.rounds[1].played = false;
      game.rounds[1].players[0].finalScore = 100;
      game.rounds[1].players[1].finalScore = 50;
      
      const totals = calculatePlayerTotals(game);
      
      expect(totals).toEqual([10, 5]);
    });

    it('should return zeros when no rounds played', () => {
      const game = createNewGame(['P1', 'P2', 'P3'], POCKET_DEFAULT_CONFIG, 'test');
      
      const totals = calculatePlayerTotals(game);
      
      expect(totals).toEqual([0, 0, 0]);
    });
  });

  describe('finalizeRound', () => {
    it('should mark round as played and increment index', () => {
      const game = createNewGame(['P1', 'P2', 'P3', 'P4'], POCKET_DEFAULT_CONFIG, 'test');
      
      // Set up a playable round
      game.rounds[0].callerPlayerId = 'p1';
      game.rounds[0].players.forEach(p => {
        p.call = 3;
        p.actualTricks = 3;
      });
      
      const updated = finalizeRound(game, 0);
      
      expect(updated.rounds[0].played).toBe(true);
      expect(updated.currentRoundIndex).toBe(1);
    });

    it('should set game status to COMPLETED when all rounds played', () => {
      const game = createNewGame(['P1', 'P2'], POCKET_DEFAULT_CONFIG, 'test');
      
      // Mark all rounds as played
      game.rounds.forEach(r => r.played = true);
      game.currentRoundIndex = game.rounds.length;
      
      const updated = finalizeRound(game, 0);
      
      expect(updated.status).toBe('COMPLETED');
    });

    it('should not increment index when finalizing non-current round', () => {
      const game = createNewGame(['P1', 'P2'], POCKET_DEFAULT_CONFIG, 'test');
      game.currentRoundIndex = 2;
      
      const updated = finalizeRound(game, 0);
      
      expect(updated.currentRoundIndex).toBe(2);
    });
  });

  describe('recalculateGameState', () => {
    it('should rebuild game state from scratch', () => {
      const game = createNewGame(['P1', 'P2', 'P3', 'P4'], POCKET_DEFAULT_CONFIG, 'test');
      
      // Play some rounds
      game.rounds[0].played = true;
      game.rounds[0].callerPlayerId = 'p1';
      game.rounds[0].players.forEach(p => {
        p.call = 3;
        p.actualTricks = 3;
      });
      
      game.currentRoundIndex = 1;
      
      const recalculated = recalculateGameState(game);
      
      expect(recalculated.currentRoundIndex).toBe(1);
      expect(recalculated.rounds.length).toBe(19);
      expect(recalculated.status).toBe('ACTIVE');
    });

    it('should reset to round 0 and replay all played rounds', () => {
      const game = createNewGame(['P1', 'P2'], POCKET_DEFAULT_CONFIG, 'test');
      
      // Play first round
      game.rounds[0].played = true;
      game.rounds[0].callerPlayerId = 'p1';
      game.rounds[0].players[0].call = 5;
      game.rounds[0].players[0].actualTricks = 5;
      game.rounds[0].players[1].call = 4;
      game.rounds[0].players[1].actualTricks = 4;
      
      game.currentRoundIndex = 1;
      
      const recalculated = recalculateGameState(game);
      
      expect(recalculated.currentRoundIndex).toBe(1);
      expect(recalculated.rounds[0].played).toBe(true);
      expect(recalculated.rounds[0].players[0].call).toBe(5);
    });

    it('should stop replaying at first unplayed round', () => {
      const game = createNewGame(['P1', 'P2'], POCKET_DEFAULT_CONFIG, 'test');
      
      // Play first round only
      game.rounds[0].played = true;
      game.rounds[0].callerPlayerId = 'p1';
      game.rounds[0].players.forEach(p => {
        p.call = 3;
        p.actualTricks = 3;
      });
      
      // Second round has data but not marked played
      game.rounds[1].callerPlayerId = 'p2';
      game.rounds[1].players.forEach(p => {
        p.call = 4;
        p.actualTricks = 4;
      });
      
      game.currentRoundIndex = 1;
      
      const recalculated = recalculateGameState(game);
      
      expect(recalculated.currentRoundIndex).toBe(1);
      expect(recalculated.rounds[0].played).toBe(true);
      expect(recalculated.rounds[1].played).toBe(false);
    });
  });
});
