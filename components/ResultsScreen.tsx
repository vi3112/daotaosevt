import React from 'react';
import { Question, Response, Assessment, Language, LanguageCode } from '../types';
import { getUIText } from '../constants';
import AssessmentDisplay from './AssessmentDisplay';
import ReplayItem from './ReplayItem';

interface ResultsScreenProps {
    questions: Question[];
    responses: Response[];
    onGenerateAssessment: () => void;
    assessment: Assessment | null;
    onRestart: () => void;
    language: Language;
    selectedVoiceURI?: string;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ questions, responses, onGenerateAssessment, assessment, onRestart, language, selectedVoiceURI }) => {
    const langCode = language.split('-')[0] as LanguageCode;
    const UI_TEXT = getUIText(langCode);

    const handleDownloadAll = () => {
        responses.forEach((response, index) => {
            const link = document.createElement('a');
            link.href = response.audioUrl;
            link.download = `OPIC_Practice_Q${index + 1}_${new Date().toISOString()}.webm`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-8 bg-slate-800 rounded-2xl shadow-lg animate-fade-in space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-green-400">{UI_TEXT.results.title}</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    onClick={onGenerateAssessment}
                    disabled={!!assessment}
                    className="flex-1 py-3 px-6 text-lg font-bold bg-sky-600 hover:bg-sky-700 rounded-lg transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    {UI_TEXT.buttons.generateAssessment}
                </button>
                 <button
                    onClick={handleDownloadAll}
                    className="flex-1 py-3 px-6 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all duration-200"
                >
                    {UI_TEXT.buttons.download}
                </button>
                <button
                    onClick={onRestart}
                    className="flex-1 py-3 px-6 text-lg font-bold bg-slate-600 hover:bg-slate-700 rounded-lg transition-all duration-200"
                >
                    {UI_TEXT.buttons.restart}
                </button>
            </div>

            {assessment && <AssessmentDisplay assessment={assessment} langCode={langCode} />}

            <div>
                <h3 className="text-2xl font-semibold text-sky-400 mb-4 border-b-2 border-slate-700 pb-2">{UI_TEXT.results.replayTitle}</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {responses.map((response, index) => (
                        <ReplayItem
                            key={index}
                            question={response.question}
                            response={response}
                            index={index}
                            language={language}
                            selectedVoiceURI={selectedVoiceURI}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ResultsScreen;