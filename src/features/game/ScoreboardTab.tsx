import React from 'react';
import { GameState, Color } from '../../models/types';
import { Card, Badge } from '../../components/UI';
import { calculatePlayerTotals } from '../../engine/GameEngine';

interface ScoreboardTabProps {
  gameState: GameState;
}

export const ScoreboardTab: React.FC<ScoreboardTabProps> = ({ gameState }) => {
  const totals = calculatePlayerTotals(gameState);
  
  // Create ranked players array
  const ranked = gameState.players
    .map((player, idx) => ({
      id: player.id,
      name: player.name,
      score: totals[idx] || 0,
      index: idx,
    }))
    .sort((a, b) => b.score - a.score);

  // Statistics
  const leader = ranked[0];
  const trailer = ranked[ranked.length - 1];
  const scoreDiff = leader && trailer ? leader.score - trailer.score : 0;
  
  const playedRounds = gameState.rounds.filter(r => r.played).length;
  const totalRounds = gameState.rounds.length;
  const remainingRounds = totalRounds - playedRounds;

  // Helper functions
  const getSuitIcon = (color: Color) => {
    const c = color.toLowerCase();
    if (c.includes('suns')) return '☀️';
    if (c.includes('spade')) return '♠️';
    if (c.includes('heart')) return '♥️';
    if (c.includes('diamond')) return '♦️';
    if (c.includes('club')) return '♣️';
    return '';
  };

  const getPlayerStatusBadge = (player: any) => {
    if (player.declaration === 'DASH_CALL') return <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded font-bold">DC</span>;
    if (player.declaration === 'DASH') return <span className="text-[9px] bg-gray-100 text-gray-700 px-1 rounded font-bold">D</span>;
    if (player.isCaller) return <span className="text-[9px] bg-gold/20 text-gold-bright px-1 rounded font-bold">C</span>;
    if (player.isWith) return <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-bold">W</span>;
    if (player.riskLevelId === 'risk') return <span className="text-[9px] bg-orange-100 text-orange-700 px-1 rounded font-bold">R</span>;
    if (player.riskLevelId === 'double') return <span className="text-[9px] bg-red-100 text-red-700 px-1 rounded font-bold">2R</span>;
    if (player.riskLevelId === 'triple') return <span className="text-[9px] bg-red-200 text-red-800 px-1 rounded font-bold">3R</span>;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-cardbg text-ink p-5 rounded-xl shadow-lg border border-ink/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-ink-dim">Current Leader</span>
          <span className="font-serif text-2xl font-normal mt-1 truncate">{leader?.name || '—'}</span>
          <span className="text-sm font-mono text-win font-bold mt-2">
            {leader?.score >= 0 ? '+' : ''}{leader?.score ?? 0} pts
          </span>
        </div>

        <div className="bg-cardbg text-ink p-5 rounded-xl shadow-lg border border-ink/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-ink-dim">Score Difference</span>
          <span className="font-serif text-2xl font-normal mt-1">{scoreDiff} pts</span>
          <span className="text-xs text-ink-dim mt-2">Leader vs Last place</span>
        </div>

        <div className="bg-cardbg text-ink p-5 rounded-xl shadow-lg border border-ink/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-ink-dim">Rounds Progress</span>
          <span className="font-serif text-2xl font-normal mt-1">
            {playedRounds} / {totalRounds}
          </span>
          <span className="text-xs text-ink-dim mt-2">
            {remainingRounds} round{remainingRounds === 1 ? '' : 's'} left
          </span>
        </div>

        <div className="bg-cardbg text-ink p-5 rounded-xl shadow-lg border border-ink/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-ink-dim">Round Multiplier</span>
          <span className="font-serif text-2xl font-normal mt-1">x{gameState.pendingMultiplier}</span>
          <span className="text-xs text-gold-bright font-mono font-semibold mt-2 uppercase tracking-wide">
            {gameState.lastRoundWasSaaydeh ? "Sa'aydeh Multiplier!" : 'Standard'}
          </span>
        </div>
      </div>

      {/* Main Scoreboard Card */}
      <Card title="Scoreboard" subtitle="Rankings based on cumulative round scores.">
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ink/10">
                <th className="py-3 px-4 font-mono text-xs uppercase text-ink-dim font-bold w-16 text-center">Rank</th>
                <th className="py-3 px-4 font-serif text-sm uppercase text-ink font-semibold">Player</th>
                <th className="py-3 px-4 font-mono text-xs uppercase text-ink-dim font-bold text-right">Total Score</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((p, idx) => {
                const isLeader = idx === 0;
                const isTrailer = idx === ranked.length - 1;

                return (
                  <tr
                    key={p.id}
                    className={`border-b border-ink/5 transition-colors hover:bg-ink/5 ${
                      isLeader ? 'bg-gold/5' : ''
                    }`}
                  >
                    <td className="py-4 px-4 text-center font-mono font-bold text-sm">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-4 font-serif text-base text-ink flex items-center gap-2">
                      <span className="font-semibold">{p.name}</span>
                      {isLeader && <Badge color="gold">Leader</Badge>}
                      {isTrailer && <Badge color="neutral">Trailer</Badge>}
                    </td>
                    <td className={`py-4 px-4 font-mono font-bold text-lg text-right ${p.score >= 0 ? 'text-win' : 'text-loss'}`}>
                      {p.score >= 0 ? '+' : ''}{p.score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Round Summary List */}
        <div className="mt-8 border-t border-ink/10 pt-6">
          <h3 className="font-serif text-lg text-ink mb-4">Round-by-Round Breakdown</h3>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scroll pr-1 border border-ink/5 p-2 rounded-xl bg-felt-0/5">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-ink/10 bg-white">
                  <th className="py-2 px-2 text-ink font-bold">Round</th>
                  <th className="py-2 px-2 text-ink font-bold">Type</th>
                  <th className="py-2 px-2 text-ink font-bold">Status</th>
                  {gameState.players.map(p => (
                    <th key={p.id} className="py-2 px-2 text-ink font-bold text-center min-w-[80px]">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gameState.rounds
                  .filter(r => r.played)
                  .map((r, roundIdx) => {
                    // Calculate running totals up to this round
                    const runningTotals = gameState.players.map((_, pIdx) => {
                      return gameState.rounds
                        .filter((_, idx) => idx <= roundIdx)
                        .reduce((sum, round) => sum + (round.players[pIdx]?.finalScore ?? 0), 0);
                    });
                    
                    const maxScore = Math.max(...runningTotals);
                    const minScore = Math.min(...runningTotals);
                    
                    return (
                      <tr key={r.id} className="border-b border-ink/5 hover:bg-white/40">
                        <td className="py-2 px-2 text-ink font-semibold">#{r.number}</td>
                        <td className="py-2 px-2 text-ink-dim">
                          <div className="flex flex-col gap-0.5">
                            <span>{r.type}</span>
                            {r.callSuit && (
                              <span className="text-[9px]">{getSuitIcon(r.callSuit)}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <span className={`text-[9px] px-1 rounded font-bold ${
                            r.status === 'UNDER' ? 'bg-green-100 text-green-700' : 
                            r.status === 'OVER' ? 'bg-red-100 text-red-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {r.status || '—'}
                          </span>
                        </td>
                        {gameState.players.map((_, pIdx) => {
                          const player = r.players[pIdx];
                          const score = player?.finalScore ?? 0;
                          const runningTotal = runningTotals[pIdx];
                          const isHighest = runningTotal === maxScore && runningTotals.filter(s => s === maxScore).length === 1;
                          const isLowest = runningTotal === minScore && runningTotals.filter(s => s === minScore).length === 1;
                          
                          return (
                            <td key={pIdx} className="py-2 px-2 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="flex items-center gap-1">
                                  {isHighest && <span className="text-xs">👑</span>}
                                  {isLowest && <span className="text-xs">😢</span>}
                                  <span className={`font-bold ${score >= 0 ? 'text-win' : 'text-loss'}`}>
                                    {score >= 0 ? '+' : ''}{score}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-ink-dim">{player?.call ?? '—'}</span>
                                  {player?.isCaller && r.callSuit && (
                                    <span className="text-[9px]">{getSuitIcon(r.callSuit)}</span>
                                  )}
                                  {player && getPlayerStatusBadge(player)}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                {playedRounds === 0 && (
                  <tr>
                    <td colSpan={gameState.players.length + 3} className="text-center py-6 text-ink-dim italic">
                      No rounds played yet. Final scores will appear here!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};
