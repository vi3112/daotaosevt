import React, { useRef } from 'react';
import { Question, Response, Language, LanguageCode } from '../types';
import { speak } from '../services/ttsService';
import { getUIText } from '../constants';

interface ReplayItemProps {
    question: Question;
    response: Response;
    index: number;
    language: Language;
    selectedVoiceURI?: string;
}

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ReplayItem: React.FC<ReplayItemProps> = ({ question, response, index, language, selectedVoiceURI }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const langCode = language.split('-')[0] as LanguageCode;
    const UI_TEXT = getUIText(langCode);

    const playQuestion = () => {
        speak(question.text, language, selectedVoiceURI)
            .catch(err => console.error("Replay TTS Error:", err));
    };

    const playResponse = () => {
        if (audioRef.current) {
            audioRef.current.play();
        }
    };

    return (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <p className="font-semibold text-sky-300">
                {UI_TEXT.interview.question} {index + 1}: {question.text}
            </p>
            <p className="text-sm text-slate-300 mt-2 pl-4 border-l-2 border-slate-600">
                <span className="font-medium text-slate-400">{UI_TEXT.results.yourAnswerWas}</span> "{response.transcript}"
            </p>
            <div className="flex gap-4 mt-3">
                 <button onClick={playQuestion} className="flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300 transition-colors">
                    <PlayIcon /> {UI_TEXT.results.replayQuestion}
                </button>
                <button onClick={playResponse} className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors">
                    <PlayIcon /> {UI_TEXT.results.replayAnswer}
                </button>
                <audio ref={audioRef} src={response.audioUrl} preload="auto" className="hidden"></audio>
            </div>
        </div>
    );
};

export default ReplayItem;