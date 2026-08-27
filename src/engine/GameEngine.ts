import { GameState, Round, RulesConfig, Player, PlayerRoundState, Color, RoundType, SpecialEvent } from '../models/types';
import { evaluateRound, computeCallsTotal } from './RuleEngine';
import { calculateRoundScores } from './ScoreEngine';

const uid = () => Math.random().toString(36).substring(2, 9);

/**
 * Creates a blank PlayerRoundState object.
 */
export function createPlayerRoundState(playerId: string, name: string): PlayerRoundState {
  return {
    playerId,
    name,
    call: null,
    actualTricks: null,
    result: null,
    isCaller: false,
    isWith: false,
    declaration: 'NONE',
    riskLevelId: 'normal',
    calculatedScore: 0,
    manualScoreOverride: null,
    finalScore: 0,
    scoreBreakdown: [],
  };
}

/**
 * Creates a blank Round object.
 */
export function createRound(
  number: number,
  type: RoundType,
  mainColor: Color | null = null,
  players: Player[] = [],
  source?: string
): Round {
  return {
    id: uid(),
    number,
    type,
    mainColor,
    currentColor: mainColor,
    colorChanged: false,
    callerPlayerId: null,
    callSuit: null,
    totalCalls: 0,
    status: null,
    players: players.map(p => createPlayerRoundState(p.id, p.name)),
    incomingMultiplier: 1,
    multiplier: 1,
    specialEvents: [],
    source,
    played: false,
  };
}

/**
 * Builds the initial 19-round queue.
 */
export function buildInitialQueue(rules: RulesConfig, players: Player[]): Round[] {
  const queue: Round[] = [];
  let num = 1;

  // 13 Normal rounds
  for (let i = 0; i < rules.game.normalRounds; i++) {
    queue.push(createRound(num++, 'NORMAL', null, players));
  }

  // 1 Double round
  for (let i = 0; i < rules.game.doubleRounds; i++) {
    queue.push(createRound(num++, 'DOUBLE', null, players));
  }

  // 5 Color rounds
  rules.game.colorRounds.forEach((color) => {
    queue.push(createRound(num++, 'COLOR', color, players));
  });

  return queue;
}

/**
 * Bootstraps a new game state.
 */
export function createNewGame(playerNames: string[], rules: RulesConfig, presetId: string): GameState {
  const players: Player[] = playerNames.map(name => ({
    id: uid(),
    name: name.trim() || 'Unnamed Player',
  }));

  const rounds = buildInitialQueue(rules, players);

  return {
    id: uid(),
    date: new Date().toISOString(),
    players,
    rounds,
    currentRoundIndex: 0,
    pendingMultiplier: 1,
    lastRoundWasSaaydeh: false,
    rules,
    presetId,
    status: 'ACTIVE',
  };
}

/**
 * Skips the current round (all players passed).
 * Marks round as skipped and sets next round to double score.
 */
export function skipRound(state: GameState, roundIndex: number): GameState {
  let updatedState = { ...state, rounds: state.rounds.map(r => ({ ...r })) };
  let round = updatedState.rounds[roundIndex];

  // Mark round as skipped
  round.type = 'SKIPPED';
  round.played = true;
  round.specialEvents = [{
    id: uid(),
    type: 'MULTIPLIER_CHANGE',
    description: 'All players passed. Round skipped. Next round will have doubled scores.',
  }];

  updatedState.rounds[roundIndex] = round;

  // Move to next round
  if (roundIndex === updatedState.currentRoundIndex) {
    updatedState.currentRoundIndex++;
  }

  // Set next round to double if it exists
  if (updatedState.currentRoundIndex < updatedState.rounds.length) {
    const nextRound = updatedState.rounds[updatedState.currentRoundIndex];
    nextRound.type = 'DOUBLE';
    nextRound.multiplier = 2;
    updatedState.rounds[updatedState.currentRoundIndex] = nextRound;
  }

  // Check if game is completed
  const allPlayed = updatedState.rounds.every(r => r.played);
  if (allPlayed) {
    updatedState.status = 'COMPLETED';
  }

  return updatedState;
}

/**
 * Finalizes the active round.
 * Evaluates rules, calculates scores, sets multipliers, triggers color repeats, etc.
 */
export function finalizeRound(state: GameState, roundIndex: number): GameState {
  let updatedState = { ...state, rounds: state.rounds.map(r => ({ ...r })) };
  let round = updatedState.rounds[roundIndex];

  // Set incoming multiplier
  round.incomingMultiplier = updatedState.pendingMultiplier;

  // 1. Evaluate results and Caller/With
  round = evaluateRound(round, updatedState.rules);

  // 2. Compute calls total
  round.totalCalls = computeCallsTotal(round);

  // 3. Score round
  round = calculateRoundScores(round, updatedState.rules);

  // 4. Sa'aydeh Check
  const winnersCount = round.players.filter(p => p.result === 'WIN').length;
  const isSaaydeh = winnersCount === 0 && updatedState.rules.saaydeh.enabled;

  const specialEvents: SpecialEvent[] = [...round.specialEvents];

  if (isSaaydeh) {
    const nextMultiplier = updatedState.lastRoundWasSaaydeh
      ? updatedState.rules.saaydeh.secondMultiplier
      : updatedState.rules.saaydeh.firstMultiplier;

    updatedState.pendingMultiplier = nextMultiplier;
    updatedState.lastRoundWasSaaydeh = true;

    specialEvents.push({
      id: uid(),
      type: 'SA_AYDEH',
      description: `Sa'aydeh occurred! Next round multiplier is set to x${nextMultiplier}.`,
    });
  } else {
    updatedState.pendingMultiplier = 1;
    updatedState.lastRoundWasSaaydeh = false;
  }

  // 5. Color Change Repeat Rule
  if (
    round.type === 'COLOR' &&
    round.colorChanged &&
    round.mainColor &&
    updatedState.rules.colorChange.enabled &&
    updatedState.rules.colorChange.repeatMainColor
  ) {
    // Append repeat main color round to end of queue
    const repeatRoundNum = updatedState.rounds.length + 1;
    const repeatRound = createRound(
      repeatRoundNum,
      'COLOR',
      round.mainColor,
      updatedState.players,
      `color-change-repeat (Round #${round.number})`
    );
    updatedState.rounds.push(repeatRound);

    specialEvents.push({
      id: uid(),
      type: 'COLOR_CHANGE',
      description: `Color changed to ${round.currentColor}. Re-queued main color ${round.mainColor} round at the end.`,
    });
  }

  // 6. Color All-Lose-By-Two Rule
  if (
    round.type === 'COLOR' &&
    updatedState.rules.colorAllLoseByTwo.enabled &&
    round.mainColor
  ) {
    const allPlayersLost = round.players.every(p => p.result === 'LOSS');
    const allByTwo = round.players.every((p) => {
      const call = p.call ?? 0;
      const actual = p.actualTricks ?? 0;
      return Math.abs(call - actual) >= updatedState.rules.colorAllLoseByTwo.requiredDifference;
    });

    if (allPlayersLost && allByTwo) {
      const repeatRoundNum = updatedState.rounds.length + 1;
      const repeatRound = createRound(
        repeatRoundNum,
        'COLOR',
        round.mainColor,
        updatedState.players,
        `all-lose-by-two-repeat (Round #${round.number})`
      );

      if (updatedState.rules.colorAllLoseByTwo.repeatAtEnd) {
        updatedState.rounds.push(repeatRound);
      } else {
        // Insert right after the current round
        updatedState.rounds.splice(roundIndex + 1, 0, repeatRound);
        // Re-number remaining rounds
        for (let i = roundIndex + 1; i < updatedState.rounds.length; i++) {
          updatedState.rounds[i].number = i + 1;
        }
      }

      specialEvents.push({
        id: uid(),
        type: 'COLOR_ALL_LOSE_BY_TWO',
        description: `All players lost by ${updatedState.rules.colorAllLoseByTwo.requiredDifference} or more. Re-queued ${round.mainColor} color round.`,
      });
    }
  }

  // Check manual overrides
  round.players.forEach((p) => {
    if (p.manualScoreOverride !== null) {
      specialEvents.push({
        id: uid(),
        type: 'MANUAL_OVERRIDE',
        description: `Manual score override of ${p.finalScore} applied to ${p.name}.`,
        playerId: p.playerId,
      });
    }
  });

  round.specialEvents = specialEvents;
  round.played = true;

  updatedState.rounds[roundIndex] = round;

  // Move index forward if we finalized the active round
  if (roundIndex === updatedState.currentRoundIndex) {
    updatedState.currentRoundIndex++;
  }

  // Check if game is completed
  const allPlayed = updatedState.rounds.every(r => r.played);
  if (allPlayed) {
    updatedState.status = 'COMPLETED';
  }

  return updatedState;
}

/**
 * Recalculates the entire game state based on historical inputs.
 * Very useful when editing previous rounds to ensure everything updates cleanly.
 */
export function recalculateGameState(state: GameState): GameState {
  // 1. Rebuild a clean initial queue of 19 rounds
  const freshRounds = buildInitialQueue(state.rules, state.players);

  // 2. Clone active game but reset to round 0
  let recalculatedState: GameState = {
    ...state,
    rounds: freshRounds,
    currentRoundIndex: 0,
    pendingMultiplier: 1,
    lastRoundWasSaaydeh: false,
    status: 'ACTIVE',
  };

  // 3. Re-play each round that was marked played in the old state
  for (let i = 0; i < state.rounds.length; i++) {
    const oldRound = state.rounds[i];
    if (!oldRound.played) {
      // If we hit an unplayed round, we stop playing.
      // But wait: if we edit a previous round, it was played.
      // What about other rounds after it? If they were played, we want to play them too.
      break;
    }

    // Get the next round index in the recalculated state.
    // Usually it matches i, but due to dynamic rounds, it might be different!
    const activeIndex = recalculatedState.currentRoundIndex;
    
    // Safety check: if no rounds are available to play (shouldn't happen), break
    if (activeIndex >= recalculatedState.rounds.length) {
      break;
    }

    let activeRound = recalculatedState.rounds[activeIndex];

    // Restore play settings: calls, actuals, caller, overrides
    activeRound.callerPlayerId = oldRound.callerPlayerId;
    activeRound.callSuit = oldRound.callSuit;
    activeRound.currentColor = oldRound.currentColor;
    activeRound.colorChanged = oldRound.colorChanged;
    activeRound.colorChangedByPlayerId = oldRound.colorChangedByPlayerId;
    activeRound.colorChangeCall = oldRound.colorChangeCall;

    activeRound.players = activeRound.players.map((freshPlayer) => {
      const oldPlayer = oldRound.players.find(p => p.playerId === freshPlayer.playerId);
      if (oldPlayer) {
        return {
          ...freshPlayer,
          call: oldPlayer.call,
          actualTricks: oldPlayer.actualTricks,
          declaration: oldPlayer.declaration,
          riskLevelId: oldPlayer.riskLevelId,
          manualScoreOverride: oldPlayer.manualScoreOverride,
        };
      }
      return freshPlayer;
    });

    // Finalize this round using our standard logic!
    // This will compute scores, handle Sa'aydeh, and inject repeated rounds into recalculatedState.rounds.
    recalculatedState = finalizeRound(recalculatedState, activeIndex);
  }

  // Update game status
  const allPlayed = recalculatedState.rounds.every(r => r.played);
  if (allPlayed && recalculatedState.rounds.length > 0) {
    recalculatedState.status = 'COMPLETED';
  }

  return recalculatedState;
}

/**
 * Calculates cumulative total scores for all players in the game.
 */
export function calculatePlayerTotals(state: GameState): number[] {
  const totals = state.players.map(() => 0);
  state.rounds.forEach((round) => {
    if (!round.played) return;
    round.players.forEach((playerState, idx) => {
      totals[idx] += playerState.finalScore;
    });
  });
  return totals;
}
