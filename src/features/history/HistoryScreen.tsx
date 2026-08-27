import React from 'react';
import { GameHistoryItem } from '../../models/types';
import { Card, Button, Badge } from '../../components/UI';

interface HistoryScreenProps {
  history: GameHistoryItem[];
  onOpenGame: (gameId: string) => void;
  onDeleteGame: (gameId: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  history,
  onOpenGame,
  onDeleteGame,
}) => {
  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString();
    } catch {
      return isoStr;
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this game record from history?')) {
      onDeleteGame(id);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Game History" subtitle="View and manage historical or suspended Pocket Estimation games.">
        
        {history.length === 0 ? (
          <div className="text-center py-12 bg-white/5 border border-dashed border-ink/10 rounded-xl">
            <p className="text-ink-dim italic">No games saved in history yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {history.map((g) => {
              const maxScoreIdx = g.finalScores.indexOf(Math.max(...g.finalScores));

              return (
                <div
                  key={g.id}
                  onClick={() => onOpenGame(g.id)}
                  className="p-5 border border-ink/10 rounded-xl bg-white shadow-sm hover:border-gold hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <Badge color={g.status === 'COMPLETED' ? 'win' : 'neutral'}>
                        {g.status}
                      </Badge>
                      <span className="text-[10px] font-mono text-ink-dim">{formatDate(g.date)}</span>
                    </div>

                    <h4 className="font-serif text-lg font-bold text-ink mb-1 truncate">
                      Winner: {g.winnerName}
                    </h4>

                    <div className="text-xs text-ink-dim mb-3 font-sans">
                      Rules: <b>{g.presetName}</b> | Rounds: <b>{g.roundCount}</b>
                    </div>

                    {/* Scores row */}
                    <div className="grid grid-cols-4 gap-1 p-2 bg-felt-0/5 rounded-lg border border-ink/5 text-[11px] font-mono mb-4">
                      {g.playerNames.map((name, idx) => (
                        <div key={idx} className="flex flex-col text-center truncate">
                          <span className={`font-semibold ${idx === maxScoreIdx ? 'text-gold-bright' : 'text-ink-dim'}`}>
                            {name}
                          </span>
                          <span className={g.finalScores[idx] >= 0 ? 'text-win' : 'text-loss'}>
                            {g.finalScores[idx] >= 0 ? '+' : ''}{g.finalScores[idx]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="felt" size="sm" onClick={() => onOpenGame(g.id)}>
                      {g.status === 'ACTIVE' ? 'Continue Game' : 'Review details'}
                    </Button>
                    <Button variant="danger" size="sm" onClick={(e) => handleDelete(g.id, e)}>
                      Delete
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
