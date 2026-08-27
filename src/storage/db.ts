import { GameState, GameHistoryItem, RulePreset } from '../models/types';
import { DEFAULT_PRESETS } from '../features/settings/defaultPresets';

const STORAGE_KEYS = {
  ACTIVE_GAME: 'pocket_estimation_active_game',
  GAME_HISTORY: 'pocket_estimation_game_history',
  PRESETS: 'pocket_estimation_rule_presets',
};

export const StorageService = {
  // Active Game
  saveActiveGame(game: GameState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_GAME, JSON.stringify(game));
    } catch (e) {
      console.error('Error saving active game:', e);
    }
  },

  getActiveGame(): GameState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_GAME);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error loading active game:', e);
      return null;
    }
  },

  clearActiveGame(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_GAME);
    } catch (e) {
      console.error('Error clearing active game:', e);
    }
  },

  // Game History
  getHistory(): GameHistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading history:', e);
      return [];
    }
  },

  saveHistory(history: GameHistoryItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Error saving history:', e);
    }
  },

  addGameToHistory(game: GameState): void {
    const history = this.getHistory();
    
    // Calculate final scores
    const finalScores = game.players.map((_, idx) => {
      return game.rounds.reduce((sum, r) => {
        if (!r.played) return sum;
        const playerState = r.players[idx];
        return sum + (playerState ? playerState.finalScore : 0);
      }, 0);
    });

    // Find winner
    let maxScore = -Infinity;
    let winnerName = 'No Player';
    game.players.forEach((p, idx) => {
      if (finalScores[idx] > maxScore) {
        maxScore = finalScores[idx];
        winnerName = p.name;
      }
    });

    const presetName = this.getPresets().find(p => p.id === game.presetId)?.name || 'Custom Preset';

    const historyItem: GameHistoryItem = {
      id: game.id,
      date: game.date,
      playerNames: game.players.map(p => p.name),
      presetName,
      finalScores,
      winnerName,
      roundCount: game.rounds.filter(r => r.played).length,
      status: game.status,
    };

    // Remove if already exists (updating)
    const filtered = history.filter(h => h.id !== game.id);
    this.saveHistory([historyItem, ...filtered]);
  },

  deleteGameFromHistory(id: string): void {
    const history = this.getHistory();
    this.saveHistory(history.filter(h => h.id !== id));
  },

  // Rule Presets
  getPresets(): RulePreset[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRESETS);
      if (!data) {
        // Initialize with defaults if empty
        this.savePresets(DEFAULT_PRESETS);
        return DEFAULT_PRESETS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error loading presets:', e);
      return DEFAULT_PRESETS;
    }
  },

  savePresets(presets: RulePreset[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
    } catch (e) {
      console.error('Error saving presets:', e);
    }
  },

  addPreset(preset: RulePreset): void {
    const presets = this.getPresets();
    const filtered = presets.filter(p => p.id !== preset.id);
    this.savePresets([...filtered, preset]);
  },

  deletePreset(id: string): void {
    const presets = this.getPresets();
    // Don't delete default
    const target = presets.find(p => p.id === id);
    if (target?.isDefault) return;
    this.savePresets(presets.filter(p => p.id !== id));
  },
};
