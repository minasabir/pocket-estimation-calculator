import { Round, RulesConfig, RoundStatus } from '../models/types';

/**
 * Computes the total calls in a round.
 */
export function computeCallsTotal(round: Round): number {
  return round.players.reduce((sum, p) => sum + (p.call ?? 0), 0);
}

/**
 * Computes the total actual tricks in a round.
 */
export function computeActualTotal(round: Round): number {
  return round.players.reduce((sum, p) => sum + (p.actualTricks ?? 0), 0);
}

/**
 * Validates a round's entries and returns list of error messages, if any.
 */
export function validateRound(round: Round, config: RulesConfig): string[] {
  const errors: string[] = [];
  const totalCalls = computeCallsTotal(round);
  const totalActual = computeActualTotal(round);

  round.players.forEach((p) => {
    // DASH and DASH_CALL declarations allow call of 0
    const isDashDeclaration = p.declaration === 'DASH' || p.declaration === 'DASH_CALL';
    const isCaller = p.playerId === round.callerPlayerId;
    
    if (p.call === null) {
      errors.push(`${p.name}: Call is required.`);
    } else if (isDashDeclaration) {
      // For DASH/DASH_CALL, call must be 0
      if (p.call !== 0) {
        errors.push(`${p.name}: Call must be 0 for ${p.declaration} declaration.`);
      }
    } else if (isCaller) {
      // Only the caller must have a call between minimum and maximum
      if (p.call < config.calls.minimum || p.call > config.calls.maximum) {
        errors.push(`${p.name}: Caller's call must be between ${config.calls.minimum} and ${config.calls.maximum}.`);
      }
    } else {
      // Non-callers can have any call from 0 to maximum
      if (p.call < 0 || p.call > config.calls.maximum) {
        errors.push(`${p.name}: Call must be between 0 and ${config.calls.maximum}.`);
      }
    }

    if (p.actualTricks === null) {
      errors.push(`${p.name}: Actual tricks is required.`);
    } else if (p.actualTricks < 0 || p.actualTricks > config.game.tricksPerRound) {
      errors.push(`${p.name}: Actual tricks must be between 0 and ${config.game.tricksPerRound}.`);
    }
  });

  if (errors.length > 0) return errors;

  // Validate Under/Over
  if (totalCalls === config.game.tricksPerRound && !config.roundStatus.allowExactly13) {
    errors.push(`Total calls cannot equal ${config.game.tricksPerRound} (exactly 13 is not allowed).`);
  }

  // Validate tricks sum
  if (totalActual !== config.game.tricksPerRound) {
    errors.push(`Sum of actual tricks must equal ${config.game.tricksPerRound} (currently ${totalActual}).`);
  }

  // Caller validation
  if (!round.callerPlayerId) {
    errors.push('A Caller must be selected for the round.');
  } else {
    // Validate that no player has a call higher than the Caller
    const callerPlayer = round.players.find(p => p.playerId === round.callerPlayerId);
    if (callerPlayer && callerPlayer.call !== null) {
      const callerCall = callerPlayer.call;
      round.players.forEach((p) => {
        if (p.playerId !== round.callerPlayerId && p.call !== null && p.call > callerCall) {
          errors.push(`${p.name}: Call cannot be higher than Caller's call (${callerCall}).`);
        }
      });
    }
  }

  return errors;
}

/**
 * Evaluates the status (UNDER / OVER / INVALID) of a round based on calls.
 */
export function calculateRoundStatus(round: Round, config: RulesConfig): RoundStatus {
  const totalCalls = computeCallsTotal(round);
  if (totalCalls === config.game.tricksPerRound) {
    return config.roundStatus.allowExactly13 ? 'UNDER' : 'INVALID'; // Default fall back
  }
  return totalCalls < config.roundStatus.underThreshold ? 'UNDER' : 'OVER';
}

/**
 * Pure function to evaluate a round's game states:
 * results, caller/with status, status, and special events.
 */
export function evaluateRound(round: Round, config: RulesConfig): Round {
  const evaluatedRound = { ...round, players: round.players.map(p => ({ ...p })) };
  
  // Calculate status
  evaluatedRound.status = calculateRoundStatus(evaluatedRound, config);

  // Set Caller/With status
  evaluatedRound.players.forEach((p) => {
    p.isCaller = p.playerId === evaluatedRound.callerPlayerId;
    p.isWith = false;
  });

  const callerPlayer = evaluatedRound.players.find((p) => p.isCaller);
  if (callerPlayer && callerPlayer.call !== null) {
    evaluatedRound.players.forEach((p) => {
      if (!p.isCaller && p.call !== null && p.call === callerPlayer.call) {
        p.isWith = true;
      }
    });
  }

  // Determine WIN/LOSS results
  evaluatedRound.players.forEach((p) => {
    if (p.call !== null && p.actualTricks !== null) {
      if (p.declaration === 'DASH' || p.declaration === 'DASH_CALL') {
        p.result = p.actualTricks === 0 ? 'WIN' : 'LOSS';
      } else {
        p.result = p.call === p.actualTricks ? 'WIN' : 'LOSS';
      }
    } else {
      p.result = null;
    }
  });

  return evaluatedRound;
}

/**
 * Checks if the round should have an automatic x2 multiplier due to special conditions:
 * Caller + 2 With + Dash Call
 */
export function shouldApplyAutoDoubleMultiplier(round: Round): boolean {
  // Check if there is a Dash Call declaration
  const hasDashCall = round.players.some(p => p.declaration === 'DASH_CALL');
  if (!hasDashCall) return false;

  // Count With players (excluding Caller)
  const withCount = round.players.filter(p => p.isWith && !p.isCaller).length;
  
  // Condition: Caller + exactly 2 With + Dash Call
  return withCount === 2;
}
