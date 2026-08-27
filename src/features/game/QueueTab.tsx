import React, { useState } from 'react';
import { GameState, Round, RoundType, Color } from '../../models/types';
import { Card, Button, Badge, Select } from '../../components/UI';
import { createRound } from '../../engine/GameEngine';

interface QueueTabProps {
  gameState: GameState;
  onUpdateRound: (roundIndex: number, updates: Partial<Round>) => void;
  onUpdateRoundsList: (rounds: Round[]) => void;
}

export const QueueTab: React.FC<QueueTabProps> = ({
  gameState,
  onUpdateRoundsList,
}) => {
  const [newType, setNewType] = useState<RoundType>('NORMAL');
  const [newColor, setNewColor] = useState<Color>('SUNS');

  const colorPillClass = (color: Color | null) => {
    if (!color) return 'neutral';
    const map: Record<Color, 'suns' | 'spades' | 'hearts' | 'diamonds' | 'clubs'> = {
      SUNS: 'suns',
      SPADES: 'spades',
      HEARTS: 'hearts',
      DIAMONDS: 'diamonds',
      CLUBS: 'clubs',
    };
    return map[color] || 'neutral';
  };

  const handleMoveUp = (index: number) => {
    if (index <= gameState.currentRoundIndex) return; // Cannot move played or current active round
    const updated = [...gameState.rounds];
    // Swap index and index - 1
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;

    // Fix display round numbering
    updated.forEach((r, idx) => {
      r.number = idx + 1;
    });

    onUpdateRoundsList(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index < gameState.currentRoundIndex || index === gameState.rounds.length - 1) return;
    const updated = [...gameState.rounds];
    // Swap index and index + 1
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;

    // Fix display round numbering
    updated.forEach((r, idx) => {
      r.number = idx + 1;
    });

    onUpdateRoundsList(updated);
  };

  const handleDeleteRound = (index: number) => {
    if (index < gameState.currentRoundIndex) return; // Cannot delete played rounds
    if (window.confirm('Are you sure you want to remove this round from the queue?')) {
      const updated = gameState.rounds.filter((_, idx) => idx !== index);
      // Fix numbering
      updated.forEach((r, idx) => {
        r.number = idx + 1;
      });
      onUpdateRoundsList(updated);
    }
  };

  const handleAddRound = () => {
    const nextNum = gameState.rounds.length + 1;
    const colorVal = newType === 'COLOR' ? newColor : null;
    const roundObj = createRound(nextNum, newType, colorVal, gameState.players, 'Manually Added');
    onUpdateRoundsList([...gameState.rounds, roundObj]);
  };

  return (
    <div className="space-y-6">
      <Card title="Dynamic Round Queue" subtitle="Manage the timeline of rounds. Future rounds can be reordered or deleted.">
        
        {/* Timeline wrapper */}
        <div className="space-y-2 mt-4 max-h-[450px] overflow-y-auto custom-scroll pr-2 border border-ink/5 p-2 rounded-xl bg-felt-0/10">
          {gameState.rounds.map((r, idx) => {
            const isCurrent = idx === gameState.currentRoundIndex;
            const isPlayed = r.played;
            const canModify = idx > gameState.currentRoundIndex;

            return (
              <div
                key={r.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? 'bg-gold/10 border-gold shadow-md'
                    : isPlayed
                    ? 'bg-white/40 border-ink/5 opacity-60'
                    : 'bg-white border-ink/10 shadow-sm'
                }`}
              >
                <span className="font-mono text-xs font-bold text-ink-dim w-8">
                  #{r.number}
                </span>

                <Badge color={r.type === 'DOUBLE' ? 'gold' : r.type === 'COLOR' ? colorPillClass(r.currentColor) : 'neutral'}>
                  {r.type}
                </Badge>

                {r.mainColor && (
                  <span className="text-xs font-serif text-ink font-semibold">
                    {r.currentColor}
                    {r.colorChanged && (
                      <span className="text-[10px] text-loss ml-1 font-sans font-normal uppercase tracking-wider bg-loss/10 px-1.5 py-0.5 rounded">
                        changed
                      </span>
                    )}
                  </span>
                )}

                {r.source && (
                  <span className="text-[10px] text-ink-dim font-mono italic max-w-[200px] truncate hidden md:inline" title={r.source}>
                    ({r.source})
                  </span>
                )}

                <div className="ml-auto flex items-center gap-2">
                  {isPlayed ? (
                    <span className="text-xs text-win font-semibold flex items-center gap-1">
                      ✓ played
                    </span>
                  ) : isCurrent ? (
                    <span className="text-xs text-gold font-bold uppercase tracking-wider animate-pulse">
                      → playing
                    </span>
                  ) : (
                    <span className="text-xs text-ink-dim">queued</span>
                  )}

                  {/* Reorder and Delete controls */}
                  {canModify && (
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === gameState.currentRoundIndex + 1}
                        className="p-1 px-2 text-xs border border-ink/10 rounded bg-white hover:bg-gold/10 hover:border-gold disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-ink/10 cursor-pointer"
                        title="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === gameState.rounds.length - 1}
                        className="p-1 px-2 text-xs border border-ink/10 rounded bg-white hover:bg-gold/10 hover:border-gold disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-ink/10 cursor-pointer"
                        title="Move Down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => handleDeleteRound(idx)}
                        className="p-1 px-2 text-xs border border-loss/20 text-loss rounded bg-white hover:bg-loss/10 cursor-pointer"
                        title="Delete Round"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Append a round */}
        <div className="mt-6 border-t border-ink/5 pt-6">
          <h3 className="font-serif text-lg text-ink mb-4">Add Custom Round to Queue</h3>
          <div className="flex flex-col md:flex-row gap-4 items-end bg-felt-0/5 p-4 rounded-xl">
            <Select
              label="Round Type"
              value={newType}
              onChange={(e) => setNewType(e.target.value as RoundType)}
              options={[
                { value: 'NORMAL', label: 'Normal Round' },
                { value: 'DOUBLE', label: 'Double Round' },
                { value: 'COLOR', label: 'Color Round' },
              ]}
            />

            {newType === 'COLOR' && (
              <Select
                label="Color Suit"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value as Color)}
                options={[
                  { value: 'SUNS', label: 'Suns' },
                  { value: 'SPADES', label: 'Spades' },
                  { value: 'HEARTS', label: 'Hearts' },
                  { value: 'DIAMONDS', label: 'Diamonds' },
                  { value: 'CLUBS', label: 'Clubs' },
                ]}
              />
            )}

            <Button variant="gold" className="w-full md:w-auto h-10" onClick={handleAddRound}>
              Add Round to End
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
