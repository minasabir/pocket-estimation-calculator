import React, { useState } from 'react';
import { GameState, Round, Color, SpecialDeclaration, PlayerRoundState } from '../../models/types';
import { Card, Button, Badge, Input, Select } from '../../components/UI';
import { computeCallsTotal, validateRound, calculateRoundStatus } from '../../engine/RuleEngine';

interface PlayRoundTabProps {
  gameState: GameState;
  onUpdatePlayer: (playerIndex: number, updates: Partial<PlayerRoundState>) => void;
  onUpdateRound: (updates: Partial<Round>) => void;
  onFinalize: () => void;
  onSkipRound: () => void;
}

export const PlayRoundTab: React.FC<PlayRoundTabProps> = ({
  gameState,
  onUpdatePlayer,
  onUpdateRound,
  onFinalize,
  onSkipRound,
}) => {
  const round = gameState.rounds[gameState.currentRoundIndex];
  
  // State for Color Change panel
  const [ccPlayerId, setCcPlayerId] = useState(gameState.players[0]?.id || '');
  const [ccCall, setCcCall] = useState<number>(gameState.rules.colorChange.minimumCall);
  const [ccColor, setCcColor] = useState<Color>('SUNS');

  if (!round) {
    return (
      <Card title="Game Complete">
        <div className="text-center py-8">
          <p className="text-ink-dim italic">No rounds remaining. View the final Scoreboard!</p>
        </div>
      </Card>
    );
  }

  // Handle skipped round
  if (round.type === 'SKIPPED') {
    return (
      <Card title="Round Skipped">
        <div className="text-center py-8">
          <p className="text-ink-dim italic">All players passed. This round was skipped.</p>
          <p className="text-sm text-gold mt-2">Next round will have doubled scores.</p>
        </div>
      </Card>
    );
  }

  const totalCalls = computeCallsTotal(round);
  const liveStatus = calculateRoundStatus(round, gameState.rules);

  const getColorBadge = (colorName: Color | null) => {
    if (!colorName) return null;
    const map: Record<Color, { label: string; color: 'suns' | 'spades' | 'hearts' | 'diamonds' | 'clubs' }> = {
      SUNS: { label: 'Suns ☀️', color: 'suns' },
      SPADES: { label: 'Spades ♠️', color: 'spades' },
      HEARTS: { label: 'Hearts ♥️', color: 'hearts' },
      DIAMONDS: { label: 'Diamonds ♦️', color: 'diamonds' },
      CLUBS: { label: 'Clubs ♣️', color: 'clubs' },
    };
    const info = map[colorName];
    return (
      <Badge color={info.color as any}>{info.label}</Badge>
    );
  };

  const handleColorChange = () => {
    if (ccCall < gameState.rules.colorChange.minimumCall) {
      alert(`Color change requires a call of at least ${gameState.rules.colorChange.minimumCall}.`);
      return;
    }

    const playerIdx = gameState.players.findIndex(p => p.id === ccPlayerId);
    if (playerIdx === -1) return;

    // Apply color change
    onUpdateRound({
      colorChanged: true,
      currentColor: ccColor,
      colorChangedByPlayerId: ccPlayerId,
      colorChangeCall: ccCall,
    });

    // Update the changing player's call to the ccCall value
    onUpdatePlayer(playerIdx, { call: ccCall });
  };

  const handleRemoveColorChange = () => {
    onUpdateRound({
      colorChanged: false,
      currentColor: round.mainColor,
      colorChangedByPlayerId: undefined,
      colorChangeCall: undefined,
    });
  };

  // Perform round validation
  const validationErrors = validateRound(round, gameState.rules);
  const showValidationWarning = validationErrors.length > 0;

  return (
    <div className="space-y-6">
      <Card
        title={
          <div className="flex items-center gap-2 flex-wrap">
            <span>Round #{round.number}</span>
            <Badge color="gold">{round.type}</Badge>
            {round.mainColor && (
              <>
                <span className="text-sm text-ink-dim">Main:</span>
                {getColorBadge(round.mainColor)}
              </>
            )}
            {round.colorChanged && round.currentColor && (
              <>
                <span className="text-sm text-ink-dim">→ Current:</span>
                {getColorBadge(round.currentColor)}
              </>
            )}
          </div>
        }
        subtitle={
          round.source ? `Added round. Source: ${round.source}` : 'Standard game round'
        }
        extra={
          <div className="flex flex-col items-end">
            <Badge color={liveStatus === 'INVALID' ? 'loss' : liveStatus === 'UNDER' ? 'neutral' : 'gold'}>
              {liveStatus} ({totalCalls} calls)
            </Badge>
            {round.incomingMultiplier > 1 && (
              <span className="text-xs text-gold font-mono mt-1">Carry x{round.incomingMultiplier} (Sa'aydeh)</span>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* Metadata entry */}
          <div className="space-y-4">
            <Select
              label="Select Caller Player"
              value={round.callerPlayerId || ''}
              onChange={(e) => onUpdateRound({ callerPlayerId: e.target.value })}
              options={[
                { value: '', label: '-- Select Caller --' },
                ...gameState.players.map(p => ({ value: p.id, label: p.name })),
              ]}
            />

            {/* Color Change Tools */}
            {round.type === 'COLOR' && gameState.rules.colorChange.enabled && (
              <div className="p-4 border border-gold/20 rounded-xl bg-felt-0/30">
                <h4 className="font-serif text-sm font-semibold text-gold-bright mb-2">Color Change (Bidding 8+)</h4>
                
                {round.colorChanged ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-ink-dim">
                      Changed to <b className="text-ink">{round.currentColor}</b> by{' '}
                      <b>{gameState.players.find(p => p.id === round.colorChangedByPlayerId)?.name}</b> (Call: {round.colorChangeCall})
                    </p>
                    <Button variant="danger" size="sm" onClick={handleRemoveColorChange}>
                      Reset Color Change
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <Select
                        label="Player"
                        value={ccPlayerId}
                        onChange={(e) => setCcPlayerId(e.target.value)}
                        options={gameState.players.map(p => ({ value: p.id, label: p.name }))}
                      />
                      <Input
                        label={`Call (≥ ${gameState.rules.colorChange.minimumCall})`}
                        type="number"
                        min={gameState.rules.colorChange.minimumCall}
                        max={13}
                        value={ccCall}
                        onChange={(e) => setCcCall(parseInt(e.target.value) || 0)}
                      />
                      <Select
                        label="New Color"
                        value={ccColor}
                        onChange={(e) => setCcColor(e.target.value as Color)}
                        options={[
                          { value: 'SUNS', label: 'Suns' },
                          { value: 'SPADES', label: 'Spades' },
                          { value: 'HEARTS', label: 'Hearts' },
                          { value: 'DIAMONDS', label: 'Diamonds' },
                          { value: 'CLUBS', label: 'Clubs' },
                        ]}
                      />
                    </div>
                    <Button variant="gold" size="sm" className="w-full" onClick={handleColorChange}>
                      Record Color Change
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-ink-dim bg-felt-0/5 p-4 rounded-xl space-y-1.5 self-start">
            <span className="font-semibold block uppercase tracking-wider text-ink">Round Helper Info:</span>
            <p>1. Enter estimated **Calls** for each player.</p>
            <p>2. Choose the **Caller** who won bidding.</p>
            <p>3. If bidding call reached **{gameState.rules.colorChange.minimumCall}+** in a Color round, use the change tool to schedule a main color repeat round.</p>
            <p>4. Play tricks and enter **Actual Tricks** (must sum to {gameState.rules.game.tricksPerRound}).</p>
            <p>5. Click **Calculate &amp; Finalize** to save.</p>
          </div>
        </div>

        {/* Player Forms */}
        <div className="mt-6 border-t border-ink/5 pt-6">
          <h3 className="font-serif text-lg text-ink mb-4">Player Scores &amp; Declarations</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {round.players.map((player, pIdx) => {
              const isPlayerCaller = player.playerId === round.callerPlayerId;
              
              // Check if they are a 'With' (same call as caller, and not the caller)
              const callerPlayerState = round.players.find(p => p.playerId === round.callerPlayerId);
              const isPlayerWith = !isPlayerCaller && 
                                   player.call !== null && 
                                   callerPlayerState?.call !== null && 
                                   player.call === callerPlayerState?.call;

              return (
                <div key={player.playerId} className="p-4 border border-ink/10 rounded-xl bg-white space-y-3 shadow-sm relative">
                  <div className="flex justify-between items-baseline">
                    <span className="font-serif font-semibold text-base text-ink truncate max-w-[120px]" title={player.name}>
                      {player.name}
                    </span>
                    <div className="flex gap-1">
                      {isPlayerCaller && <Badge color="gold">Caller</Badge>}
                      {isPlayerWith && <Badge color="neutral">With</Badge>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Call"
                      type="number"
                      min={gameState.rules.calls.minimum}
                      max={gameState.rules.calls.maximum}
                      value={player.call ?? ''}
                      onChange={(e) => onUpdatePlayer(pIdx, { call: e.target.value === '' ? null : parseInt(e.target.value) })}
                    />
                    <Select
                      label="Suit"
                      value={player.callColor || ''}
                      onChange={(e) => onUpdatePlayer(pIdx, { callColor: e.target.value as Color || null })}
                      options={[
                        { value: '', label: 'None' },
                        { value: 'SUNS', label: 'Suns ☀️' },
                        { value: 'SPADES', label: 'Spades ♠️' },
                        { value: 'HEARTS', label: 'Hearts ♥️' },
                        { value: 'DIAMONDS', label: 'Diamonds ♦️' },
                        { value: 'CLUBS', label: 'Clubs ♣️' },
                      ]}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Input
                      label="Tricks"
                      type="number"
                      min={0}
                      max={gameState.rules.game.tricksPerRound}
                      value={player.actualTricks ?? ''}
                      onChange={(e) => onUpdatePlayer(pIdx, { actualTricks: e.target.value === '' ? null : parseInt(e.target.value) })}
                    />
                  </div>

                  <Select
                    label="Special Declaration"
                    value={player.declaration}
                    onChange={(e) => {
                      const newDeclaration = e.target.value as SpecialDeclaration;
                      // Auto-set call to 0 for Dash or Dash Call
                      if (newDeclaration === 'DASH' || newDeclaration === 'DASH_CALL') {
                        onUpdatePlayer(pIdx, { declaration: newDeclaration, call: 0 });
                      } else {
                        onUpdatePlayer(pIdx, { declaration: newDeclaration });
                      }
                    }}
                    options={[
                      { value: 'NONE', label: 'None' },
                      { value: 'DASH', label: 'Dash' },
                      { value: 'DASH_CALL', label: 'Dash Call' },
                    ]}
                  />

                  <Select
                    label="Risk Level"
                    value={player.riskLevelId}
                    onChange={(e) => onUpdatePlayer(pIdx, { riskLevelId: e.target.value })}
                    options={gameState.rules.risk.levels
                      .filter(l => l.enabled)
                      .map(l => ({ value: l.id, label: l.name }))}
                  />

                  <Input
                    label="Score Override"
                    type="number"
                    placeholder="Auto"
                    value={player.manualScoreOverride ?? ''}
                    onChange={(e) => onUpdatePlayer(pIdx, { manualScoreOverride: e.target.value === '' ? null : parseInt(e.target.value) })}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation Errors banner */}
        {showValidationWarning && (
          <div className="mt-6 p-4 border border-loss/20 bg-loss/5 rounded-xl text-loss text-sm space-y-1">
            <span className="font-bold uppercase tracking-wider block text-xs">Finalization Blockers:</span>
            {validationErrors.map((err, idx) => (
              <p key={idx}>• {err}</p>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="ghost"
            size="lg"
            className="w-full md:w-auto"
            onClick={onSkipRound}
          >
            Skip Round (All Pass)
          </Button>
          <Button
            variant="gold"
            size="lg"
            className="w-full md:w-auto"
            onClick={onFinalize}
            disabled={showValidationWarning}
          >
            Calculate &amp; Finalize Round
          </Button>
        </div>
      </Card>

      {/* Show score breakdown for the previously played round if available */}
      {gameState.currentRoundIndex > 0 && (
        <Card title="Previous Round Score Breakdown" subtitle={`Scores from Round #${gameState.currentRoundIndex}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            {gameState.rounds[gameState.currentRoundIndex - 1]?.players.map((p) => (
              <div key={p.playerId} className="p-4 border border-ink/5 rounded-xl bg-white shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="font-serif font-bold text-ink">{p.name}</span>
                    <Badge color={p.result === 'WIN' ? 'win' : 'loss'}>
                      {p.result}
                    </Badge>
                  </div>
                  <div className="text-xs text-ink-dim mb-3">
                    Call: {p.call} | Tricks: {p.actualTricks}
                    {p.declaration !== 'NONE' && ` | ${p.declaration}`}
                  </div>
                  
                  <div className="border-t border-dashed border-ink/10 pt-2 space-y-1">
                    {p.scoreBreakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs font-mono">
                        <span className="text-ink-dim truncate max-w-[130px]">{item.description}</span>
                        <span className={item.amount >= 0 ? 'text-win' : 'text-loss'}>
                          {item.amount >= 0 ? '+' : ''}{item.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-ink/10 flex justify-between font-serif font-bold text-base text-ink">
                  <span>Score:</span>
                  <span className={p.finalScore >= 0 ? 'text-win' : 'text-loss'}>
                    {p.finalScore >= 0 ? '+' : ''}{p.finalScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
