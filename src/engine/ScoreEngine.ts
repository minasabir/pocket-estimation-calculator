import { Round, RulesConfig, ScoreBreakdownItem } from '../models/types';
import { shouldApplyAutoDoubleMultiplier } from './RuleEngine';
/**
 * Calculates the score components and final scores for each player in the round.
 */
export function calculateRoundScores(round: Round, config: RulesConfig): Round {
  const evaluatedRound = { ...round, players: round.players.map(p => ({ ...p })) };
  
  const readyPlayers = evaluatedRound.players.filter(p => p.call !== null && p.actualTricks !== null);
  if (readyPlayers.length < evaluatedRound.players.length) {
    // Not all players entered yet, score remains 0
    return evaluatedRound;
  }

  const status = evaluatedRound.status;
  if (!status || status === 'INVALID') {
    return evaluatedRound;
  }

  // Calculate winners and losers
  const winners = evaluatedRound.players.filter(p => p.result === 'WIN');
  const winnerCount = winners.length;
  const loserCount = evaluatedRound.players.length - winnerCount;

  // Calculate applied multiplier
  let roundMultiplier = evaluatedRound.incomingMultiplier;
  if (evaluatedRound.type === 'DOUBLE' && config.doubleRound.enabled) {
    roundMultiplier *= config.doubleRound.multiplier;
  }
  
  // Apply automatic x2 multiplier for Caller + 2 With + Dash Call
  if (shouldApplyAutoDoubleMultiplier(evaluatedRound)) {
    roundMultiplier *= 2;
  }
  
  evaluatedRound.multiplier = roundMultiplier;

  evaluatedRound.players.forEach((player) => {
    const breakdown: ScoreBreakdownItem[] = [];
    const isWin = player.result === 'WIN';
    const call = player.call ?? 0;

    // 1. Call-based Score (Win: call+10 for 1-7, call² for 8-13; Lose: |call-actual| for 1-7, (call²)/2 for 8-13)
    let callScore: number;
    const actualTricks = player.actualTricks ?? 0;
    const difference = Math.abs(call - actualTricks);
    
    if (isWin) {
      if (call >= 8) {
        // Super call: 8→64, 9→81, 10→100, 11→121, 12→144, 13→169
        callScore = call * call;
      } else {
        // Normal call: 1→11, 2→12, 3→13, 4→14, 5→15, 6→16, 7→17
        callScore = call + 10;
      }
    } else {
      if (call >= 8) {
        // Super call lose: (call * call) / 2 integer (8→32, 9→40, 10→50, 11→60, 12→72, 13→84)
        callScore = -Math.floor((call * call) / 2);
      } else {
        // Normal call lose: |call - actualTricks| (e.g., if call=5 and actual=3, lose=-2)
        callScore = -difference;
      }
    }
    breakdown.push({
      type: 'CALL_SCORE',
      description: `Call Score (${call} tricks)`,
      amount: callScore,
    });

    // 2. Caller Bonus/Penalty (fixed: win +10, lose -10)
    if (player.isCaller) {
      const callerVal = isWin ? 10 : -10;
      breakdown.push({
        type: 'CALLER',
        description: `Caller ${isWin ? 'Bonus' : 'Penalty'}`,
        amount: callerVal,
      });
    }

    // 3. With Bonus/Penalty (fixed: win +10, lose -10)
    if (player.isWith) {
      const withVal = isWin ? 10 : -10;
      breakdown.push({
        type: 'WITH',
        description: `With ${isWin ? 'Bonus' : 'Penalty'}`,
        amount: withVal,
      });
    }

    // 4. Risk Level
    const riskLevel = config.risk.levels.find(l => l.id === player.riskLevelId);
    if (riskLevel && (riskLevel.successBonus !== 0 || riskLevel.failurePenalty !== 0)) {
      const riskVal = isWin ? riskLevel.successBonus : riskLevel.failurePenalty;
      breakdown.push({
        type: 'RISK',
        description: `${riskLevel.name} ${isWin ? 'Bonus' : 'Penalty'}`,
        amount: riskVal,
      });
    }

    // 5. Special Declarations (DASH, DASH_CALL)
    if (player.declaration === 'DASH' && config.dash.enabled) {
      const isUnder = status === 'UNDER';
      const dashVal = isWin
        ? (isUnder ? config.dash.underSuccessScore : config.dash.overSuccessScore)
        : (isUnder ? config.dash.underFailurePenalty : config.dash.overFailurePenalty);
      breakdown.push({
        type: 'DASH',
        description: `Dash ${isWin ? 'Success' : 'Failure'} (${status})`,
        amount: dashVal,
      });
    } else if (player.declaration === 'DASH_CALL' && config.dashCall.enabled) {
      const isUnder = status === 'UNDER';
      const dashCallVal = isWin
        ? (isUnder ? config.dashCall.underSuccessScore : config.dashCall.overSuccessScore)
        : (isUnder ? config.dashCall.underFailurePenalty : config.dashCall.overFailurePenalty);
      breakdown.push({
        type: 'DASH_CALL',
        description: `Dash Call ${isWin ? 'Success' : 'Failure'} (${status})`,
        amount: dashCallVal,
      });
    }

    // 6. Only Winner Bonus
    if (config.onlyWinner.enabled && winnerCount === 1 && isWin) {
      breakdown.push({
        type: 'ONLY_WINNER',
        description: 'Only Winner Bonus',
        amount: config.onlyWinner.bonus,
      });
    }

    // 7. Only Loser Penalty
    if (config.onlyLoser.enabled && loserCount === 1 && !isWin) {
      breakdown.push({
        type: 'ONLY_LOSER',
        description: 'Only Loser Penalty',
        amount: config.onlyLoser.penalty,
      });
    }

    // Calculate subtotal from additive components
    const subtotal = breakdown.reduce((sum, item) => sum + item.amount, 0);
    let calculated = subtotal;

    // Apply round multiplier
    if (roundMultiplier !== 1) {
      calculated = subtotal * roundMultiplier;
      breakdown.push({
        type: 'MULTIPLIER',
        description: `Round Multiplier x${roundMultiplier}`,
        amount: calculated - subtotal,
      });
    }

    player.scoreBreakdown = breakdown;
    player.calculatedScore = calculated;

    // Apply manual override if active
    if (player.manualScoreOverride !== null) {
      player.finalScore = player.manualScoreOverride;
    } else {
      player.finalScore = calculated;
    }
  });

  return evaluatedRound;
}
