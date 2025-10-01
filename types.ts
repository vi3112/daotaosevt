
export enum Language {
    EN = 'en-US',
    KO = 'ko-KR',
    VI = 'vi-VN',
}

export type LanguageCode = 'en' | 'ko' | 'vi';

export enum Level {
    NOVICE_HIGH = 'Novice High',
    INTERMEDIATE_LOW = 'Intermediate Low',
    INTERMEDIATE_MID = 'Intermediate Mid',
    INTERMEDIATE_HIGH = 'Intermediate High',
    ADVANCED_LOW = 'Advanced Low',
}

export interface Question {
    id: string;
    text: string;
}

export interface Response {
    question: Question;
    transcript: string;
    audioUrl: string;
}

export interface Assessment {
    estimatedLevel: string;
    feedback: string;
    suggestions: string[];
}

export interface TranscriptionEntry {
  speaker: 'user' | 'model';
  text: string;
}
