import React, { useState } from 'react';
import { RulesConfig, RulePreset, GameState, RiskLevel } from '../../models/types';
import { Card, Button, Input, Select } from '../../components/UI';
import { POCKET_DEFAULT_CONFIG } from './defaultPresets';

interface SettingsScreenProps {
  gameState: GameState | null;
  presets: RulePreset[];
  onSavePreset: (preset: RulePreset) => void;
  onDeletePreset: (id: string) => void;
  onApplyRulesToActiveGame?: (config: RulesConfig) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  gameState,
  presets,
  onSavePreset,
  onDeletePreset,
  onApplyRulesToActiveGame,
}) => {
  // Current edited config
  const [config, setConfig] = useState<RulesConfig>(
    gameState?.rules || presets[0]?.config || POCKET_DEFAULT_CONFIG
  );

  const [presetName, setPresetName] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'scoring' | 'special' | 'risk' | 'color' | 'presets'>('general');

  const handlePresetSelect = (presetId: string) => {
    const selected = presets.find(p => p.id === presetId);
    if (selected) {
      setConfig({ ...selected.config });
    }
  };

  const handleUpdate = (section: keyof RulesConfig, key: string, value: any) => {
    setConfig(prev => {
      const sec = prev[section] as any;
      return {
        ...prev,
        [section]: {
          ...sec,
          [key]: value,
        },
      };
    });
  };

  const handleUpdateNested = (section: keyof RulesConfig, subSection: string, key: string, value: any) => {
    setConfig(prev => {
      const sec = prev[section] as any;
      const sub = sec[subSection] as any;
      return {
        ...prev,
        [section]: {
          ...sec,
          [subSection]: {
            ...sub,
            [key]: value,
          },
        },
      };
    });
  };

  const handleSaveAsPreset = () => {
    if (!presetName.trim()) {
      alert('Please enter a name for the new preset.');
      return;
    }
    const newPreset: RulePreset = {
      id: Math.random().toString(36).substring(2, 9),
      name: presetName.trim(),
      config: { ...config },
    };
    onSavePreset(newPreset);
    setPresetName('');
    alert(`Preset "${newPreset.name}" has been saved successfully.`);
  };

  const handleApplyToActive = () => {
    if (onApplyRulesToActiveGame) {
      onApplyRulesToActiveGame(config);
      alert('Scoring rules applied to the current active game. Scores and round queues have been recalculated!');
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all values to the default Pocket Estimation rules?')) {
      setConfig({ ...POCKET_DEFAULT_CONFIG });
    }
  };

  const updateRiskLevel = (index: number, updates: Partial<RiskLevel>) => {
    const updatedLevels = [...config.risk.levels];
    updatedLevels[index] = { ...updatedLevels[index], ...updates };
    handleUpdate('risk', 'levels', updatedLevels);
  };

  const addRiskLevel = () => {
    const newLvl: RiskLevel = {
      id: Math.random().toString(36).substring(2, 9),
      name: 'New Tier',
      enabled: true,
      successBonus: 10,
      failurePenalty: -10,
    };
    handleUpdate('risk', 'levels', [...config.risk.levels, newLvl]);
  };

  const removeRiskLevel = (index: number) => {
    const updated = config.risk.levels.filter((_, idx) => idx !== index);
    handleUpdate('risk', 'levels', updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4 bg-felt-0/10 p-3 rounded-xl border border-ink/5">
        <h2 className="font-serif text-2xl text-cardbg">Ref Settings Panel</h2>
        <div className="flex gap-2 flex-wrap">
          {gameState && (
            <Button variant="gold" onClick={handleApplyToActive}>
              Apply &amp; Recalculate Game
            </Button>
          )}
          <Button variant="felt" onClick={handleResetToDefault}>
            Reset Defaults
          </Button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex gap-2 overflow-x-auto custom-scroll pb-2">
        {(['general', 'scoring', 'special', 'risk', 'color', 'presets'] as const).map(tab => (
          <button
            key={tab}
            className={`font-mono text-xs uppercase tracking-wider px-4 py-2 border rounded-lg cursor-pointer transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-gold border-gold text-felt-0 font-bold'
                : 'bg-felt-2 text-cardbg border-felt-1 hover:border-gold hover:text-gold-bright'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card title="General &amp; Bidding Config" subtitle="Game structures, call thresholds, and general round constraints.">
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Tricks per Round (Deck size constraint)"
                type="number"
                value={config.game.tricksPerRound}
                onChange={e => handleUpdateNested('game', 'game', 'tricksPerRound', parseInt(e.target.value) || 0)}
              />
              <Input
                label="Normal Rounds (Default 13)"
                type="number"
                value={config.game.normalRounds}
                onChange={e => handleUpdateNested('game', 'game', 'normalRounds', parseInt(e.target.value) || 0)}
              />
              <Input
                label="Double Rounds (Default 1)"
                type="number"
                value={config.game.doubleRounds}
                onChange={e => handleUpdateNested('game', 'game', 'doubleRounds', parseInt(e.target.value) || 0)}
              />
            </div>

            <hr className="border-ink/5" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Minimum Allowed Bid Call"
                type="number"
                value={config.calls.minimum}
                onChange={e => handleUpdateNested('calls', 'calls', 'minimum', parseInt(e.target.value) || 0)}
              />
              <Input
                label="Maximum Allowed Bid Call"
                type="number"
                value={config.calls.maximum}
                onChange={e => handleUpdateNested('calls', 'calls', 'maximum', parseInt(e.target.value) || 0)}
              />
            </div>

            <hr className="border-ink/5" />

            <div className="space-y-4">
              <h3 className="font-serif text-base text-ink font-semibold">Under/Over Status Definitions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Under Threshold (< this value = UNDER)"
                  type="number"
                  value={config.roundStatus.underThreshold}
                  onChange={e => handleUpdateNested('roundStatus', 'roundStatus', 'underThreshold', parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Over Threshold (> this value = OVER)"
                  type="number"
                  value={config.roundStatus.overThreshold}
                  onChange={e => handleUpdateNested('roundStatus', 'roundStatus', 'overThreshold', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-center gap-2 p-2 border border-ink/10 rounded-lg bg-white">
                <input
                  type="checkbox"
                  id="allowExactly13"
                  className="w-4 h-4 cursor-pointer"
                  checked={config.roundStatus.allowExactly13}
                  onChange={e => handleUpdateNested('roundStatus', 'roundStatus', 'allowExactly13', e.target.checked)}
                />
                <label htmlFor="allowExactly13" className="text-sm text-ink cursor-pointer select-none">
                  Allow total calls to equal 13 (Standard rule says total calls cannot equal tricks per round).
                </label>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Scoring Settings */}
      {activeTab === 'scoring' && (
        <Card title="Scoring Formulas" subtitle="Configure additive values for player results, Caller, and With statuses.">
          <div className="space-y-6 mt-4">
            <div>
              <h3 className="font-serif text-base text-ink font-semibold mb-3">Base Success/Failure Points</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Flat Score on Success Estimation"
                  type="number"
                  value={config.base.successScore}
                  onChange={e => handleUpdateNested('base', 'base', 'successScore', parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Flat Penalty on Failed Estimation"
                  type="number"
                  value={config.base.failurePenalty}
                  onChange={e => handleUpdateNested('base', 'base', 'failurePenalty', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <hr className="border-ink/5" />

            <div>
              <h3 className="font-serif text-base text-ink font-semibold mb-3">Caller &amp; With Bonuses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Caller Success Bonus"
                  type="number"
                  value={config.caller.successScore}
                  onChange={e => handleUpdateNested('caller', 'caller', 'successScore', parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Caller Failure Penalty"
                  type="number"
                  value={config.caller.failurePenalty}
                  onChange={e => handleUpdateNested('caller', 'caller', 'failurePenalty', parseInt(e.target.value) || 0)}
                />
                <Input
                  label="With Success Bonus"
                  type="number"
                  value={config.withRule.successScore}
                  onChange={e => handleUpdateNested('withRule', 'withRule', 'successScore', parseInt(e.target.value) || 0)}
                />
                <Input
                  label="With Failure Penalty"
                  type="number"
                  value={config.withRule.failurePenalty}
                  onChange={e => handleUpdateNested('withRule', 'withRule', 'failurePenalty', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <hr className="border-ink/5" />

            <div>
              <h3 className="font-serif text-base text-ink font-semibold mb-3">Only Winner &amp; Only Loser</h3>
              <div className="flex gap-4 flex-wrap mb-3">
                <label className="flex items-center gap-1.5 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={config.onlyWinner.enabled}
                    onChange={e => handleUpdateNested('onlyWinner', 'onlyWinner', 'enabled', e.target.checked)}
                  />
                  Enable Only Winner Bonus
                </label>
                <label className="flex items-center gap-1.5 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={config.onlyLoser.enabled}
                    onChange={e => handleUpdateNested('onlyLoser', 'onlyLoser', 'enabled', e.target.checked)}
                  />
                  Enable Only Loser Penalty
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Only Winner Bonus (Default +10)"
                  type="number"
                  disabled={!config.onlyWinner.enabled}
                  value={config.onlyWinner.bonus}
                  onChange={e => handleUpdateNested('onlyWinner', 'onlyWinner', 'bonus', parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Only Loser Penalty (Default -10)"
                  type="number"
                  disabled={!config.onlyLoser.enabled}
                  value={config.onlyLoser.penalty}
                  onChange={e => handleUpdateNested('onlyLoser', 'onlyLoser', 'penalty', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Special Declarations */}
      {activeTab === 'special' && (
        <Card title="Special Declarations &amp; Multipliers" subtitle="Define scores for Dash, Dash Call, and Zero from Hand declarations.">
          <div className="space-y-6 mt-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-base text-ink font-semibold">Dash Declarations (Blind Call of 0)</h3>
                <label className="flex items-center gap-1.5 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={config.dash.enabled}
                    onChange={e => handleUpdateNested('dash', 'dash', 'enabled', e.target.checked)}
                  />
                  Enabled
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Dash Success Score"
                  type="number"
                  disabled={!config.dash.enabled}
                  value={config.dash.successScore}
                  onChange={e => handleUpdateNested('dash', 'dash', 'successScore', parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Dash Failure Penalty"
                  type="number"
                  disabled={!config.dash.enabled}
                  value={config.dash.failurePenalty}
                  onChange={e => handleUpdateNested('dash', 'dash', 'failurePenalty', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <hr className="border-ink/5" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-base text-ink font-semibold">Dash Call Declarations (Open Call of 0)</h3>
                <label className="flex items-center gap-1.5 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={config.dashCall.enabled}
                    onChange={e => handleUpdateNested('dashCall', 'dashCall', 'enabled', e.target.checked)}
                  />
                  Enabled
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Dash Call Success Score (Under)"
                  type="number"
                  disabled={!config.dashCall.enabled}
                  value={config.dashCall.underSuccessScore}
                  onChange={e => handleUpdateNested('dashCall', 'dashCall', 'underSuccessScore', parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Dash Call Success Score (Over)"
                  type="number"
                  disabled={!config.dashCall.enabled}
                  value={config.dashCall.overSuccessScore}
                  onChange={e => handleUpdateNested('dashCall', 'dashCall', 'overSuccessScore', parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Dash Call Failure Penalty (Under)"
                  type="number"
                  disabled={!config.dashCall.enabled}
                  value={config.dashCall.underFailurePenalty}
                  onChange={e => handleUpdateNested('dashCall', 'dashCall', 'underFailurePenalty', parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Dash Call Failure Penalty (Over)"
                  type="number"
                  disabled={!config.dashCall.enabled}
                  value={config.dashCall.overFailurePenalty}
                  onChange={e => handleUpdateNested('dashCall', 'dashCall', 'overFailurePenalty', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <hr className="border-ink/5" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-base text-ink font-semibold">Zero From Hand Declarations</h3>
                <label className="flex items-center gap-1.5 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={config.zeroFromHand.enabled}
                    onChange={e => handleUpdateNested('zeroFromHand', 'zeroFromHand', 'enabled', e.target.checked)}
                  />
                  Enabled
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Zero From Hand Success Score (Under - Default +20)"
                  type="number"
                  disabled={!config.zeroFromHand.enabled}
                  value={config.zeroFromHand.underSuccessScore}
                  onChange={e => handleUpdateNested('zeroFromHand', 'zeroFromHand', 'underSuccessScore', parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Zero From Hand Success Score (Over - Default +10)"
                  type="number"
                  disabled={!config.zeroFromHand.enabled}
                  value={config.zeroFromHand.overSuccessScore}
                  onChange={e => handleUpdateNested('zeroFromHand', 'zeroFromHand', 'overSuccessScore', parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Zero From Hand Failure Penalty (Under)"
                  type="number"
                  disabled={!config.zeroFromHand.enabled}
                  value={config.zeroFromHand.underFailurePenalty}
                  onChange={e => handleUpdateNested('zeroFromHand', 'zeroFromHand', 'underFailurePenalty', parseInt(e.target.value) || 0)}
                />
                <Input
                  label="Zero From Hand Failure Penalty (Over)"
                  type="number"
                  disabled={!config.zeroFromHand.enabled}
                  value={config.zeroFromHand.overFailurePenalty}
                  onChange={e => handleUpdateNested('zeroFromHand', 'zeroFromHand', 'overFailurePenalty', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <hr className="border-ink/5" />

            <div>
              <h3 className="font-serif text-base text-ink font-semibold mb-3">Sa'aydeh &amp; Double Round Multipliers</h3>
              <div className="flex gap-4 flex-wrap mb-3">
                <label className="flex items-center gap-1.5 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={config.saaydeh.enabled}
                    onChange={e => handleUpdateNested('saaydeh', 'saaydeh', 'enabled', e.target.checked)}
                  />
                  Enable Sa'aydeh Multiplier Carrying
                </label>
                <label className="flex items-center gap-1.5 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={config.saaydeh.stackingEnabled}
                    onChange={e => handleUpdateNested('saaydeh', 'saaydeh', 'stackingEnabled', e.target.checked)}
                  />
                  Enable Sa'aydeh Stacking (consecutive Sa'aydehs increase multiplier)
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="First Sa'aydeh Multiplier (e.g. 2)"
                  type="number"
                  disabled={!config.saaydeh.enabled}
                  value={config.saaydeh.firstMultiplier}
                  onChange={e => handleUpdateNested('saaydeh', 'saaydeh', 'firstMultiplier', parseInt(e.target.value) || 1)}
                />
                <Input
                  label="Second consecutive Multiplier (e.g. 4)"
                  type="number"
                  disabled={!config.saaydeh.enabled || !config.saaydeh.stackingEnabled}
                  value={config.saaydeh.secondMultiplier}
                  onChange={e => handleUpdateNested('saaydeh', 'saaydeh', 'secondMultiplier', parseInt(e.target.value) || 1)}
                />
                <Input
                  label="Double Round Multiplier"
                  type="number"
                  value={config.doubleRound.multiplier}
                  onChange={e => handleUpdateNested('doubleRound', 'doubleRound', 'multiplier', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Risk Tiers */}
      {activeTab === 'risk' && (
        <Card title="Risk Levels Engine" subtitle="Add, modify, or delete risk tiers. Players select their tier per round.">
          <div className="space-y-4 mt-4">
            {config.risk.levels.map((lvl, index) => (
              <div key={lvl.id} className="p-4 border border-ink/10 rounded-xl bg-white shadow-sm flex flex-col md:flex-row md:items-end gap-3">
                <Input
                  label="Tier Name"
                  type="text"
                  value={lvl.name}
                  onChange={e => updateRiskLevel(index, { name: e.target.value })}
                />
                <Input
                  label="Success Bonus"
                  type="number"
                  value={lvl.successBonus}
                  onChange={e => updateRiskLevel(index, { successBonus: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Failure Penalty"
                  type="number"
                  value={lvl.failurePenalty}
                  onChange={e => updateRiskLevel(index, { failurePenalty: parseInt(e.target.value) || 0 })}
                />
                
                <div className="flex gap-2 md:mb-3">
                  <label className="flex items-center gap-1.5 text-xs text-ink whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={lvl.enabled}
                      onChange={e => updateRiskLevel(index, { enabled: e.target.checked })}
                    />
                    Active
                  </label>
                  {lvl.id !== 'normal' && (
                    <Button variant="danger" size="sm" onClick={() => removeRiskLevel(index)}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            <div className="pt-2">
              <Button variant="felt" onClick={addRiskLevel}>
                + Add Risk Tier
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Color Round Rules */}
      {activeTab === 'color' && (
        <Card title="Color Change &amp; Repeat Rules" subtitle="Configure color shifts, minimum triggers, and repeat insertion timing.">
          <div className="space-y-6 mt-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-base text-ink font-semibold">Color Changes (Switching Suit)</h3>
                <label className="flex items-center gap-1.5 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={config.colorChange.enabled}
                    onChange={e => handleUpdateNested('colorChange', 'colorChange', 'enabled', e.target.checked)}
                  />
                  Enabled
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Minimum call required to trigger change (Default 8)"
                  type="number"
                  disabled={!config.colorChange.enabled}
                  value={config.colorChange.minimumCall}
                  onChange={e => handleUpdateNested('colorChange', 'colorChange', 'minimumCall', parseInt(e.target.value) || 0)}
                />
                <div className="flex items-center gap-2 md:mt-6">
                  <input
                    type="checkbox"
                    id="ccRepeat"
                    disabled={!config.colorChange.enabled}
                    checked={config.colorChange.repeatMainColor}
                    onChange={e => handleUpdateNested('colorChange', 'colorChange', 'repeatMainColor', e.target.checked)}
                  />
                  <label htmlFor="ccRepeat" className="text-xs text-ink cursor-pointer select-none">
                    Repeat original Main Color round at end of game queue.
                  </label>
                </div>
              </div>
            </div>

            <hr className="border-ink/5" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-base text-ink font-semibold">Color Round All-Lose-By-Two</h3>
                <label className="flex items-center gap-1.5 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={config.colorAllLoseByTwo.enabled}
                    onChange={e => handleUpdateNested('colorAllLoseByTwo', 'colorAllLoseByTwo', 'enabled', e.target.checked)}
                  />
                  Enabled
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Required difference from call to count as 'by two' (Default 2)"
                  type="number"
                  disabled={!config.colorAllLoseByTwo.enabled}
                  value={config.colorAllLoseByTwo.requiredDifference}
                  onChange={e => handleUpdateNested('colorAllLoseByTwo', 'colorAllLoseByTwo', 'requiredDifference', parseInt(e.target.value) || 0)}
                />
                <div className="space-y-2 md:mt-2">
                  <label className="flex items-center gap-1.5 text-xs text-ink">
                    <input
                      type="checkbox"
                      disabled={!config.colorAllLoseByTwo.enabled}
                      checked={config.colorAllLoseByTwo.allPlayersMustLose}
                      onChange={e => handleUpdateNested('colorAllLoseByTwo', 'colorAllLoseByTwo', 'allPlayersMustLose', e.target.checked)}
                    />
                    Require all 4 players to lose
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-ink">
                    <input
                      type="checkbox"
                      disabled={!config.colorAllLoseByTwo.enabled}
                      checked={config.colorAllLoseByTwo.repeatMainColor}
                      onChange={e => handleUpdateNested('colorAllLoseByTwo', 'colorAllLoseByTwo', 'repeatMainColor', e.target.checked)}
                    />
                    Repeated round uses original Main Color
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-ink">
                    <input
                      type="checkbox"
                      disabled={!config.colorAllLoseByTwo.enabled}
                      checked={config.colorAllLoseByTwo.repeatAtEnd}
                      onChange={e => handleUpdateNested('colorAllLoseByTwo', 'colorAllLoseByTwo', 'repeatAtEnd', e.target.checked)}
                    />
                    Repeat at very end of game (off = insert right after current)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Preset management */}
      {activeTab === 'presets' && (
        <Card title="Rule Presets Manager" subtitle="Load existing presets or save your current configurations as new custom rulesets.">
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-ink/10 rounded-xl bg-white shadow-sm">
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-base text-ink">Load Preset</h4>
                <Select
                  label="Select Preset to Load"
                  options={presets.map(p => ({ value: p.id, label: p.name + (p.isDefault ? ' (Default)' : '') }))}
                  onChange={(e) => handlePresetSelect(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-base text-ink">Save Current Settings as New Preset</h4>
                <Input
                  label="New Preset Name"
                  type="text"
                  placeholder="e.g. Tournament Rules, Mina's Circle"
                  value={presetName}
                  onChange={e => setPresetName(e.target.value)}
                />
                <Button variant="gold" className="w-full" onClick={handleSaveAsPreset}>
                  Save Custom Preset
                </Button>
              </div>
            </div>

            <div className="border-t border-ink/5 pt-4">
              <h4 className="font-serif font-bold text-base text-ink mb-3">Saved Rule Presets</h4>
              <div className="space-y-2">
                {presets.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 border border-ink/5 bg-white rounded-lg shadow-xs">
                    <div>
                      <span className="font-serif text-sm font-semibold text-ink">{p.name}</span>
                      {p.isDefault && <span className="text-[10px] bg-gold/10 text-gold-bright px-1.5 py-0.5 rounded font-mono uppercase font-bold ml-2">default</span>}
                    </div>
                    {!p.isDefault && (
                      <Button variant="danger" size="sm" onClick={() => onDeletePreset(p.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
