import React from 'react';
import { GameState } from '../../models/types';
import { Card, Badge } from '../../components/UI';

interface EventsTabProps {
  gameState: GameState;
}

export const EventsTab: React.FC<EventsTabProps> = ({ gameState }) => {
  // Compile all special events from all rounds in order
  const events = gameState.rounds
    .filter(r => r.played)
    .flatMap(r => 
      r.specialEvents.map(ev => ({
        ...ev,
        roundNum: r.number,
      }))
    );

  const getTagColor = (type: string) => {
    switch (type) {
      case 'COLOR_CHANGE':
        return 'suns';
      case 'COLOR_ALL_LOSE_BY_TWO':
        return 'hearts';
      case 'SA_AYDEH':
        return 'big';
      case 'MANUAL_OVERRIDE':
        return 'gold';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Special Event Log" subtitle="Running log of critical referee rulings, color changes, Sa'aydehs, and manual adjustments.">
        
        {events.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-ink-dim italic">No special events logged yet in this game.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-ink/5 bg-white shadow-sm font-mono text-xs text-ink"
              >
                <Badge color={getTagColor(ev.type)}>
                  {ev.type.replace(/_/g, ' ')}
                </Badge>
                
                <span className="text-ink-dim font-bold min-w-[60px]">
                  Round #{ev.roundNum}
                </span>

                <span className="text-ink text-left">
                  {ev.description}
                </span>
                
                {ev.at && (
                  <span className="ml-auto text-[10px] text-ink-dim whitespace-nowrap self-center hidden sm:inline">
                    {ev.at}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
