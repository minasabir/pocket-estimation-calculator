import { useState, useEffect } from 'react';
import { GameState, Round, PlayerRoundState, RulesConfig, RulePreset, GameHistoryItem } from '../models/types';
import { StorageService } from '../storage/db';
import { createNewGame as apiCreateNewGame, finalizeRound, recalculateGameState } from '../engine/GameEngine';

export function useGameState() {
  const [activeGame, setActiveGame] = useState<GameState | null>(null);
  const [presets, setPresets] = useState<RulePreset[]>([]);
  const [history, setHistory] = useState<GameHistoryItem[]>([]);

  // Load initial data from storage
  useEffect(() => {
    const game = StorageService.getActiveGame();
    if (game) setActiveGame(game);

    setPresets(StorageService.getPresets());
    setHistory(StorageService.getHistory());
  }, []);

  // Save active game to storage whenever it changes
  const saveGame = (game: GameState | null) => {
    setActiveGame(game);
    if (game) {
      StorageService.saveActiveGame(game);
      // Sync history if game status changes to COMPLETED or was updated
      if (game.status === 'COMPLETED' || game.rounds.some(r => r.played)) {
        StorageService.addGameToHistory(game);
        setHistory(StorageService.getHistory());
      }
    } else {
      StorageService.clearActiveGame();
    }
  };

  const createGame = (playerNames: string[], presetId: string, customConfig?: RulesConfig) => {
    const selectedPreset = presets.find(p => p.id === presetId);
    const config = customConfig || selectedPreset?.config || presets[0].config;
    const newGame = apiCreateNewGame(playerNames, config, presetId);
    saveGame(newGame);
  };

  const updateRoundPlayer = (roundIndex: number, playerIndex: number, updates: Partial<PlayerRoundState>) => {
    if (!activeGame) return;

    const updatedRounds = activeGame.rounds.map((r, rIdx) => {
      if (rIdx !== roundIndex) return r;
      const updatedPlayers = r.players.map((p, pIdx) => {
        if (pIdx !== playerIndex) return p;
        return { ...p, ...updates };
      });
      return { ...r, players: updatedPlayers };
    });

    saveGame({ ...activeGame, rounds: updatedRounds });
  };

  const updateRound = (roundIndex: number, updates: Partial<Round>) => {
    if (!activeGame) return;

    const updatedRounds = activeGame.rounds.map((r, rIdx) => {
      if (rIdx !== roundIndex) return r;
      return { ...r, ...updates };
    });

    saveGame({ ...activeGame, rounds: updatedRounds });
  };

  const finalizeActiveRound = () => {
    if (!activeGame) return;
    const nextGame = finalizeRound(activeGame, activeGame.currentRoundIndex);
    saveGame(nextGame);
  };

  const editPreviousRound = (roundIndex: number) => {
    if (!activeGame) return;

    // Reset played state for target and all future rounds
    const updatedRounds = activeGame.rounds.map((r, idx) => {
      if (idx >= roundIndex) {
        return {
          ...r,
          played: false,
          players: r.players.map(p => ({
            ...p,
            result: null,
            calculatedScore: 0,
            scoreBreakdown: [],
          })),
        };
      }
      return r;
    });

    saveGame({
      ...activeGame,
      rounds: updatedRounds,
      currentRoundIndex: roundIndex,
      status: 'ACTIVE',
    });
  };

  const recalculateGame = () => {
    if (!activeGame) return;
    const recalculated = recalculateGameState(activeGame);
    saveGame(recalculated);
  };

  const resetGame = () => {
    saveGame(null);
  };

  const deleteHistoryGame = (id: string) => {
    StorageService.deleteGameFromHistory(id);
    setHistory(StorageService.getHistory());
  };

  const savePreset = (preset: RulePreset) => {
    StorageService.addPreset(preset);
    setPresets(StorageService.getPresets());
  };

  const deletePreset = (id: string) => {
    StorageService.deletePreset(id);
    setPresets(StorageService.getPresets());
  };

  return {
    activeGame,
    presets,
    history,
    createGame,
    updateRoundPlayer,
    updateRound,
    finalizeActiveRound,
    editPreviousRound,
    recalculateGame,
    resetGame,
    deleteHistoryGame,
    savePreset,
    deletePreset,
    refreshPresets: () => setPresets(StorageService.getPresets()),
  };
}
