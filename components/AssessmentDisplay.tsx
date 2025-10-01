import React from 'react';
import { Assessment, LanguageCode } from '../types';
import { getUIText } from '../constants';

interface AssessmentDisplayProps {
    assessment: Assessment;
    langCode: LanguageCode;
}

const CheckIcon = () => (
    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
    </svg>
);

const AssessmentDisplay: React.FC<AssessmentDisplayProps> = ({ assessment, langCode }) => {
    const UI_TEXT = getUIText(langCode);

    const getLevelFontSize = (text: string) => {
        if (text.length > 30) return 'text-2xl';
        if (text.length > 18) return 'text-3xl';
        return 'text-4xl';
    };

    const levelFontSize = getLevelFontSize(assessment.estimatedLevel);

    return (
        <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 space-y-6">
            <h3 className="text-2xl font-semibold text-sky-400 text-center">{UI_TEXT.results.assessmentTitle}</h3>
            
            <div className="grid md:grid-cols-3 gap-6 text-center">
                 <div className="bg-slate-800 p-4 rounded-lg flex flex-col justify-center">
                    <h4 className="font-bold text-lg text-slate-300">{UI_TEXT.results.estimatedLevel}</h4>
                    <p className={`font-extrabold text-sky-300 mt-2 ${levelFontSize}`}>{assessment.estimatedLevel}</p>
                </div>
                <div className="md:col-span-2 bg-slate-800 p-4 rounded-lg text-left">
                     <h4 className="font-bold text-lg text-slate-300 mb-2">{UI_TEXT.results.feedback}</h4>
                    <p className="text-slate-200 whitespace-pre-wrap">{assessment.feedback}</p>
                </div>
            </div>

            <div>
                 <h4 className="font-bold text-lg text-slate-300 mb-3">{UI_TEXT.results.suggestions}</h4>
                 <ul className="space-y-3">
                    {assessment.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-3 bg-slate-800 p-3 rounded-md">
                            <CheckIcon />
                            <span className="text-slate-200">{suggestion}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AssessmentDisplay;