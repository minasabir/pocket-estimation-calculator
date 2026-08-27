import React from 'react';
import { GameState, Round } from '../../models/types';
import { Card, Button, Badge } from '../../components/UI';

interface HistoryTabProps {
  gameState: GameState;
  onEditRound: (roundIndex: number) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ gameState, onEditRound }) => {
  const playedRounds = gameState.rounds
    .map((r, idx) => ({ round: r, index: idx }))
    .filter(item => item.round.played)
    .reverse(); // Newest first

  const handleEditClick = (roundIndex: number, roundNum: number) => {
    const confirmMessage = 
      `Warning: Editing Round #${roundNum} will discard all inputs for subsequent rounds and return you to this round. Do you want to proceed?`;
    
    if (window.confirm(confirmMessage)) {
      onEditRound(roundIndex);
    }
  };

  const colorPillClass = (color: string | null) => {
    if (!color) return 'neutral';
    const c = color.toLowerCase();
    if (c.includes('heart')) return 'hearts';
    if (c.includes('karo') || c.includes('diamond')) return 'karo';
    if (c.includes('treffel') || c.includes('club')) return 'treffel';
    if (c.includes('big')) return 'big';
    return 'suns';
  };

  return (
    <div className="space-y-6">
      <Card title="Round History" subtitle="View details of completed rounds. You can step back and edit any completed round.">
        
        {playedRounds.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-ink-dim italic">No rounds have been completed yet.</p>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {playedRounds.map(({ round, index }) => {
              const totalCalls = round.totalCalls;
              const callerName = gameState.players.find(p => p.id === round.callerPlayerId)?.name || 'None';

              return (
                <div key={round.id} className="p-4 border border-ink/10 rounded-xl bg-white shadow-sm space-y-4">
                  {/* Card Header */}
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-bold text-lg text-ink">Round #{round.number}</h4>
                      <Badge color="gold">{round.type}</Badge>
                      {round.mainColor && (
                        <Badge color={colorPillClass(round.currentColor)}>
                          {round.currentColor}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={round.status === 'UNDER' ? 'neutral' : round.status === 'OVER' ? 'big' : 'loss'}>
                        {round.status} ({totalCalls} calls)
                      </Badge>
                      {round.multiplier > 1 && (
                        <Badge color="big">x{round.multiplier}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Player Scores Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-ink/10">
                          <th className="py-2 px-2 text-ink-dim font-bold">Player</th>
                          <th className="py-2 px-2 text-ink-dim font-bold text-center">Call</th>
                          <th className="py-2 px-2 text-ink-dim font-bold text-center">Tricks</th>
                          <th className="py-2 px-2 text-ink-dim font-bold text-center">Declaration</th>
                          <th className="py-2 px-2 text-ink-dim font-bold text-center">Result</th>
                          <th className="py-2 px-2 text-ink-dim font-bold text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {round.players.map((p) => {
                          const isCaller = p.playerId === round.callerPlayerId;
                          return (
                            <tr key={p.playerId} className="border-b border-ink/5">
                              <td className="py-2 px-2 text-ink font-serif font-bold">
                                {p.name} {isCaller && <span className="text-[9px] text-gold font-sans font-normal border border-gold px-1 rounded ml-1">Caller</span>}
                              </td>
                              <td className="py-2 px-2 text-center text-ink">{p.call ?? '—'}</td>
                              <td className="py-2 px-2 text-center text-ink">{p.actualTricks ?? '—'}</td>
                              <td className="py-2 px-2 text-center text-ink-dim">{p.declaration !== 'NONE' ? p.declaration : '—'}</td>
                              <td className={`py-2 px-2 text-center font-bold ${p.result === 'WIN' ? 'text-win' : 'text-loss'}`}>
                                {p.result ?? '—'}
                              </td>
                              <td className={`py-2 px-2 text-right font-bold ${p.finalScore >= 0 ? 'text-win' : 'text-loss'}`}>
                                {p.finalScore >= 0 ? '+' : ''}{p.finalScore}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Special Events Details */}
                  {round.specialEvents.length > 0 && (
                    <details className="text-xs text-ink bg-felt-0/5 p-2 rounded-lg cursor-pointer">
                      <summary className="font-semibold text-gold-bright hover:underline">
                        Special Events ({round.specialEvents.length})
                      </summary>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-ink-dim font-mono">
                        {round.specialEvents.map((ev) => (
                          <li key={ev.id}>{ev.description}</li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {/* Action buttons */}
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(index, round.number)}
                    >
                      Edit This Round
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
