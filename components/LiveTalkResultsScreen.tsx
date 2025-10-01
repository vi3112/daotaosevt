import React from 'react';
import { Language, LanguageCode, TranscriptionEntry, Assessment } from '../types';
import { getUIText } from '../constants';
import AssessmentDisplay from './AssessmentDisplay';

interface LiveTalkResultsScreenProps {
    transcriptionHistory: TranscriptionEntry[];
    onRestart: () => void;
    language: Language;
    assessment: Assessment | null;
    onGenerateAssessment: () => void;
}

const LiveTalkResultsScreen: React.FC<LiveTalkResultsScreenProps> = ({ transcriptionHistory, onRestart, language, assessment, onGenerateAssessment }) => {
    const langCode = language.split('-')[0] as LanguageCode;
    const UI_TEXT = getUIText(langCode);

    return (
        <div className="max-w-4xl mx-auto p-8 bg-slate-800 rounded-2xl shadow-lg animate-fade-in space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-green-400">{UI_TEXT.liveResults.title}</h2>
            </div>

            <div className="w-full h-80 bg-slate-900/50 rounded-lg p-4 overflow-y-auto space-y-4">
                {transcriptionHistory.map((entry, index) => (
                    <div key={index} className={`flex flex-col ${entry.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-lg p-3 rounded-lg ${entry.speaker === 'user' ? 'bg-sky-700 text-white' : 'bg-slate-600 text-slate-100'}`}>
                            <p className="text-sm font-bold capitalize mb-1">{entry.speaker === 'user' ? UI_TEXT.liveResults.user : UI_TEXT.liveResults.model}</p>
                            <p>{entry.text}</p>
                        </div>
                    </div>
                ))}
                {transcriptionHistory.length === 0 && (
                    <p className="text-slate-400 text-center">No transcription was recorded.</p>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    onClick={onGenerateAssessment}
                    disabled={!!assessment}
                    className="flex-1 py-3 px-6 text-lg font-bold bg-sky-600 hover:bg-sky-700 rounded-lg transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    {UI_TEXT.buttons.generateLiveAssessment}
                </button>
                <button
                    onClick={onRestart}
                    className="flex-1 py-3 px-6 text-lg font-bold bg-slate-600 hover:bg-slate-700 rounded-lg transition-all duration-200"
                >
                    {UI_TEXT.buttons.restart}
                </button>
            </div>

            {assessment && <AssessmentDisplay assessment={assessment} langCode={langCode} />}
        </div>
    );
};

export default LiveTalkResultsScreen;
