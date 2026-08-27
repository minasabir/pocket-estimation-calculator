import React, { useState, useEffect } from 'react';
import { GameState, GameHistoryItem, RulePreset, PlayerRoundState, Round } from './models/types';
import { StorageService } from './storage/db';
import { createNewGame, finalizeRound, skipRound, recalculateGameState, calculatePlayerTotals } from './engine/GameEngine';
import { DEFAULT_PRESETS } from './features/settings/defaultPresets';
import { PlayRoundTab } from './features/game/PlayRoundTab';
import { QueueTab } from './features/game/QueueTab';
import { ScoreboardTab } from './features/game/ScoreboardTab';
import { HistoryTab } from './features/game/HistoryTab';
import { EventsTab } from './features/game/EventsTab';
import { HistoryScreen } from './features/history/HistoryScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { Card, Button, Badge, Input } from './components/UI';

type AppView = 'NEW_GAME' | 'GAME' | 'HISTORY' | 'SETTINGS';
type GameTab = 'PLAY' | 'QUEUE' | 'SCOREBOARD' | 'HISTORY' | 'EVENTS';

function App() {
  const [view, setView] = useState<AppView>('NEW_GAME');
  const [gameTab, setGameTab] = useState<GameTab>('PLAY');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [presets, setPresets] = useState<RulePreset[]>(DEFAULT_PRESETS);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEFAULT_PRESETS[0].id);
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2', 'Player 3', 'Player 4']);

  // Load data from LocalStorage on mount
  useEffect(() => {
    const loadedHistory = StorageService.getHistory();
    const loadedPresets = StorageService.getPresets();
    const loadedGame = StorageService.getActiveGame();

    setHistory(loadedHistory);
    setPresets(loadedPresets);
    
    if (loadedGame) {
      setGameState(loadedGame);
      setView('GAME');
    }
  }, []);

  // Save game state to LocalStorage whenever it changes
  useEffect(() => {
    if (gameState) {
      StorageService.saveActiveGame(gameState);
      // Update history entry
      StorageService.addGameToHistory(gameState);
      setHistory(StorageService.getHistory());
    }
  }, [gameState]);

  const handleStartNewGame = () => {
    const preset = presets.find(p => p.id === selectedPresetId) || presets[0];
    const newGame = createNewGame(playerNames, preset.config, preset.id);
    setGameState(newGame);
    setGameTab('PLAY');
    setView('GAME');
  };

  const handleContinueGame = (gameId: string) => {
    // In a real app, we'd load from history. For now, use active game
    const loadedGame = StorageService.getActiveGame();
    if (loadedGame && loadedGame.id === gameId) {
      setGameState(loadedGame);
      setView('GAME');
    }
  };

  const handleDeleteGame = (gameId: string) => {
    StorageService.deleteGameFromHistory(gameId);
    setHistory(StorageService.getHistory());
    if (gameState?.id === gameId) {
      setGameState(null);
      setView('NEW_GAME');
    }
  };

  const handleFinalizeRound = () => {
    if (!gameState) return;
    
    const updatedState = finalizeRound(gameState, gameState.currentRoundIndex);
    setGameState(updatedState);
    
    // Auto-switch to scoreboard after finalizing
    setGameTab('SCOREBOARD');
  };

  const handleSkipRound = () => {
    if (!gameState) return;
    
    const updatedState = skipRound(gameState, gameState.currentRoundIndex);
    setGameState(updatedState);
    
    // Auto-switch to scoreboard after skipping
    setGameTab('SCOREBOARD');
  };

  const handleUpdatePlayer = (playerIndex: number, updates: Partial<PlayerRoundState>) => {
    if (!gameState) return;
    
    const updatedState = { ...gameState };
    const round = updatedState.rounds[updatedState.currentRoundIndex];
    round.players[playerIndex] = { ...round.players[playerIndex], ...updates };
    setGameState(updatedState);
  };

  const handleUpdateRound = (updates: Partial<Round>) => {
    if (!gameState) return;
    
    const updatedState = { ...gameState };
    updatedState.rounds[updatedState.currentRoundIndex] = { 
      ...updatedState.rounds[updatedState.currentRoundIndex], 
      ...updates 
    };
    setGameState(updatedState);
  };

  const handleUpdateRoundsList = (rounds: Round[]) => {
    if (!gameState) return;
    
    const updatedState = { ...gameState, rounds };
    setGameState(updatedState);
  };

  const handleEditRound = (roundIndex: number) => {
    if (!gameState) return;
    
    // Reset to the round being edited
    const updatedState = { ...gameState, currentRoundIndex: roundIndex };
    
    // Recalculate all rounds from this point
    const recalculatedState = recalculateGameState(updatedState);
    setGameState(recalculatedState);
    setGameTab('PLAY');
  };

  const handleSavePreset = (preset: RulePreset) => {
    StorageService.addPreset(preset);
    setPresets(StorageService.getPresets());
  };

  const handleDeletePreset = (id: string) => {
    StorageService.deletePreset(id);
    setPresets(StorageService.getPresets());
  };

  const handleApplyRulesToActiveGame = (config: any) => {
    if (!gameState) return;
    
    const updatedState = { ...gameState, rules: config };
    const recalculatedState = recalculateGameState(updatedState);
    setGameState(recalculatedState);
  };

  const handleEndGame = () => {
    if (!gameState) return;
    
    if (window.confirm('Are you sure you want to end this game? This will mark it as completed.')) {
      const updatedState = { ...gameState, status: 'COMPLETED' as const };
      setGameState(updatedState);
      StorageService.addGameToHistory(updatedState);
      setHistory(StorageService.getHistory());
      StorageService.clearActiveGame();
      setView('HISTORY');
    }
  };

  const handleStartNewFromSettings = () => {
    setGameState(null);
    StorageService.clearActiveGame();
    setView('NEW_GAME');
  };

  // New Game Setup View
  if (view === 'NEW_GAME') {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="font-serif text-4xl md:text-5xl text-cardbg font-normal">Pocket Estimation Referee</h1>
            <p className="text-gold-bright font-mono text-sm tracking-widest uppercase">Card Game Score Calculator</p>
          </div>

          {/* Player Setup */}
          <Card title="Player Setup" subtitle="Enter the names of the 4 players.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {playerNames.map((name, idx) => (
                <Input
                  key={idx}
                  label={`Player ${idx + 1}`}
                  value={name}
                  onChange={(e) => {
                    const updated = [...playerNames];
                    updated[idx] = e.target.value;
                    setPlayerNames(updated);
                  }}
                />
              ))}
            </div>
          </Card>

          {/* Rules Preset Selection */}
          <Card title="Rules Preset" subtitle="Choose the scoring rules for this game.">
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedPresetId === preset.id
                        ? 'border-gold bg-gold/10 shadow-md'
                        : 'border-ink/10 bg-white hover:border-gold/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-serif font-bold text-ink">{preset.name}</h4>
                        {preset.isDefault && (
                          <Badge color="gold" className="mt-1">Default</Badge>
                        )}
                      </div>
                      {selectedPresetId === preset.id && (
                        <span className="text-gold font-bold">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button variant="gold" size="lg" onClick={handleStartNewGame}>
              Start New Game
            </Button>
            <Button variant="felt" size="lg" onClick={() => setView('HISTORY')}>
              View Game History
            </Button>
            <Button variant="felt" size="lg" onClick={() => setView('SETTINGS')}>
              Settings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Game View
  if (view === 'GAME' && gameState) {
    const totals = calculatePlayerTotals(gameState);
    const isGameComplete = gameState.status === 'COMPLETED';

    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Game Header */}
          <div className="bg-cardbg rounded-xl p-4 md:p-6 shadow-xl border border-ink/5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="font-serif text-2xl md:text-3xl text-ink font-normal">
                  Pocket Estimation Referee
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge color={isGameComplete ? 'win' : 'gold'}>
                    {isGameComplete ? 'COMPLETED' : 'ACTIVE'}
                  </Badge>
                  <span className="text-sm text-ink-dim font-mono">
                    {gameState.rounds.filter(r => r.played).length} / {gameState.rounds.length} rounds
                  </span>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button variant="felt" size="sm" onClick={() => setView('HISTORY')}>
                  History
                </Button>
                <Button variant="felt" size="sm" onClick={() => setView('SETTINGS')}>
                  Settings
                </Button>
                {!isGameComplete && (
                  <Button variant="danger" size="sm" onClick={handleEndGame}>
                    End Game
                  </Button>
                )}
              </div>
            </div>

            {/* Player Scores Mini-Display */}
            <div className="mt-4 pt-4 border-t border-ink/10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {gameState.players.map((player, idx) => (
                  <div key={player.id} className="text-center p-2 bg-felt-0/5 rounded-lg">
                    <div className="text-xs text-ink-dim font-mono uppercase tracking-wider">{player.name}</div>
                    <div className={`text-lg font-bold font-serif ${totals[idx] >= 0 ? 'text-win' : 'text-loss'}`}>
                      {totals[idx] >= 0 ? '+' : ''}{totals[idx]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Game Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto custom-scroll pb-2">
            {(['PLAY', 'QUEUE', 'SCOREBOARD', 'HISTORY', 'EVENTS'] as GameTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setGameTab(tab)}
                className={`font-mono text-xs uppercase tracking-wider px-4 py-2 border rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                  gameTab === tab
                    ? 'bg-gold border-gold text-felt-0 font-bold'
                    : 'bg-felt-2 text-cardbg border-felt-1 hover:border-gold hover:text-gold-bright'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Game Tab Content */}
          {gameTab === 'PLAY' && (
            <PlayRoundTab
              gameState={gameState}
              onUpdatePlayer={handleUpdatePlayer}
              onUpdateRound={handleUpdateRound}
              onFinalize={handleFinalizeRound}
              onSkipRound={handleSkipRound}
            />
          )}

          {gameTab === 'QUEUE' && (
            <QueueTab
              gameState={gameState}
              onUpdateRound={(index, updates) => {
                const updatedState = { ...gameState };
                updatedState.rounds[index] = { ...updatedState.rounds[index], ...updates };
                setGameState(updatedState);
              }}
              onUpdateRoundsList={handleUpdateRoundsList}
            />
          )}

          {gameTab === 'SCOREBOARD' && (
            <ScoreboardTab gameState={gameState} />
          )}

          {gameTab === 'HISTORY' && (
            <HistoryTab gameState={gameState} onEditRound={handleEditRound} />
          )}

          {gameTab === 'EVENTS' && (
            <EventsTab gameState={gameState} />
          )}
        </div>
      </div>
    );
  }

  // History View
  if (view === 'HISTORY') {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="font-serif text-3xl text-cardbg font-normal">Game History</h1>
            <Button variant="gold" onClick={() => setView('NEW_GAME')}>
              New Game
            </Button>
          </div>

          <HistoryScreen
            history={history}
            onOpenGame={handleContinueGame}
            onDeleteGame={handleDeleteGame}
          />
        </div>
      </div>
    );
  }

  // Settings View
  if (view === 'SETTINGS') {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="font-serif text-3xl text-cardbg font-normal">Settings</h1>
            <div className="flex gap-2">
              {gameState && (
                <Button variant="felt" onClick={() => setView('GAME')}>
                  Back to Game
                </Button>
              )}
              <Button variant="gold" onClick={gameState ? handleStartNewFromSettings : () => setView('NEW_GAME')}>
                {gameState ? 'Start New Game' : 'Back to Setup'}
              </Button>
            </div>
          </div>

          <SettingsScreen
            gameState={gameState}
            presets={presets}
            onSavePreset={handleSavePreset}
            onDeletePreset={handleDeletePreset}
            onApplyRulesToActiveGame={handleApplyRulesToActiveGame}
          />
        </div>
      </div>
    );
  }

  return null;
}

export default App;
