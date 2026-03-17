import type { InventoryState } from './inventory.ts'
import type { AssignedPerkMap, PerkId } from "../lib/rolling/types.ts";
import type {ArchetypeData, ArchetypeId, DomainData, DomainId} from "../lib/sheet-data.ts";

export type PotentialPerkSlot = {
  perkId: PerkId,
};

export type PotentialKey =
  | "might"
  | "finesse"
  | "nerve"
  | "seep"
  | "instinct"
  | "wit"
  | "heart"
  | "tether";

export type SkillDef = {
  name: string;
  summary: string;
  proficient?: boolean;
};

export type PotentialState = {
  key: PotentialKey;
  title: string;
  score: number;
  stress: number;
  resistance: number;
  volatilityDieMax: 4 | 6 | 8 | 10 | 12;
  charged?: boolean;
  skills: SkillDef[];
  perks?: Record<number, { label?: string; color?: string }>;
  resolverPerks?: AssignedPerkMap;
};

export type MarksState = {
  total: number;
  taken: number;
};

export type ExperienceState = {
  beats: number;
  strings: number;
  milestones: number;
};

export type TokenPoolState = {
  id: string;
  label: string;
  current: number;
  max: number;
  tone?: "gold" | "purple" | "emerald" | "slate";
  description?: string;
  communal?: boolean;
};

export type ArmorRefreshRule = "move" | "manual" | "resistance";
export type ArmorKind = "light" | "heavy" | "shield" | "other";

export type ArmorPieceState = {
  id: string;
  location: string;
  name: string;
  kind: ArmorKind;
  protectionMax: number;
  protectionOpen: number;
  refresh: ArmorRefreshRule;
  refreshPotential?: PotentialKey;
  notes?: string;
};

export type GoalTier = "minor" | "major" | "heroic" | "flaw";
export type GoalReward = "string" | "milestone" | "zenith" | "flavor";

export type GoalState = {
  id: string;
  title: string;
  tier: GoalTier;
  reward: GoalReward;
  completed?: boolean;
  notes?: string;
};

export const REWARD_FROM_GOAL = new Map<GoalTier, GoalReward>([
    ["flaw", 'flavor'],
    ['heroic', 'zenith'],
    ['major', 'milestone'],
    ['minor', 'string']
]);

export type DomainState = {
  id: DomainId;
  proficient: boolean;
};

export type KnackState = {
  id: string;
  name: string;
  summary?: string;
  linkedSkills?: string[];
};

export type AttackState = {
  id: string;
  name: string;
  potential: PotentialKey;
  skillName: string;
  damage: string;
  targetPotential: PotentialKey;
  range: string;
  properties?: string[];
  notes?: string;
  equipped?: boolean;
};

export type CharacterHeaderState = {
  name: string;
  archetypes: ArchetypeData[];
  origin: string;
  playerName: string;
  level: number;
  partyName?: string;
  tier?: string;
};

export type RollMode = "normal" | "advantage" | "disadvantage";
export type RiskinessLevel = "uncertain" | "risky" | "dire" | "desperate";

export type RollComposerDraft = {
  potentialKey: PotentialKey;
  skillName: string;
  mode: RollMode;
  riskiness: RiskinessLevel;
  extraVolatility: number;
  selectedKnacks: string[];
  selectedDomains: string[];
};

export type CharacterSheetState = {
  header: CharacterHeaderState;
  marks: MarksState;
  experience: ExperienceState;
  tokens: TokenPoolState[];
  armor: ArmorPieceState[];
  potentials: PotentialState[];
  goals: GoalState[];
  domains: DomainData[];
  knacks: KnackState[];
  attacks: AttackState[];
  inventory: InventoryState;
};
