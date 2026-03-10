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

export type CharacterHeaderState = {
  name: string;
  archetype: string;
  origin: string;
  playerName: string;
  level: number;
  partyName?: string;
  tier?: string;
};

export type CharacterSheetState = {
  header: CharacterHeaderState;
  marks: MarksState;
  experience: ExperienceState;
  tokens: TokenPoolState[];
  armor: ArmorPieceState[];
  potentials: PotentialState[];
};
