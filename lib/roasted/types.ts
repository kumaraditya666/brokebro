export type Language = "hinglish" | "hindi" | "english" | "auto";
export type RoastStyle =
  | "desi"
  | "bhai"
  | "savage"
  | "cricket"
  | "bollywood"
  | "parents"
  | "student"
  | "foodie"
  | "indianlife";
export type RoastTarget = "me" | "friend" | "bestfriend" | "group" | "random";

export interface RoastRequest {
  style: RoastStyle;
  language: Language;
  target: RoastTarget;
  context?: string;
  name?: string;
  hasImage?: boolean;
}

export interface RoastResult {
  id: string;
  text: string;
  hinglish?: string;
  hindi?: string;
  english?: string;
  style: RoastStyle;
  language: Exclude<Language, "auto">;
  character: string;
  tags: string[];
  createdAt: number;
}

export interface MemeResult {
  id: string;
  top: string;
  bottom: string;
  caption: string;
  hinglish: string;
  hindi: string;
  english: string;
  template: string;
  situation: string;
}

export interface ChatAward {
  emoji: string;
  title: string;
  desc: string;
  winner: string;
}

export interface WrappedStats {
  totalMessages: number;
  bhaiCount: number;
  cryCount: number;
  foodCount: number;
  midnightCount: number;
  topWords: { word: string; count: number }[];
  awards: ChatAward[];
  headline: string;
}

export interface SituationCategory {
  id: string;
  emoji: string;
  label: string;
  hint: string;
}
