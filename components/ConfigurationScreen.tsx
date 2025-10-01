import React, { useState, useEffect } from 'react';
import { Language, Level, LanguageCode } from '../types';
import { getUIText } from '../constants';
import { getAvailableVoices } from '../services/ttsService';

interface ConfigurationScreenProps {
    onStartInterview: (language: Language, level: Level, selectedVoiceURI?: string) => void;
    onStartLiveTalk: (language: Language, selectedVoiceURI?: string) => void;
}

const ConfigurationScreen: React.FC<ConfigurationScreenProps> = ({ onStartInterview, onStartLiveTalk }) => {
    const [language, setLanguage] = useState<Language>(Language.EN);
    const [level, setLevel] = useState<Level>(Level.INTERMEDIATE_MID);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');

    const langCode = language.split('-')[0] as LanguageCode;
    const UI_TEXT = getUIText(langCode);

    useEffect(() => {
        const fetchVoices = async () => {
            const availableVoices = await getAvailableVoices(language);
            setVoices(availableVoices);
            setSelectedVoiceURI(''); // Reset voice selection when language changes
        };
        fetchVoices();
    }, [language]);
    
    const handleStartInterviewClick = () => {
        onStartInterview(language, level, selectedVoiceURI || undefined);
    };
    
    const handleStartLiveTalkClick = () => {
        onStartLiveTalk(language, selectedVoiceURI || undefined);
    };

    return (
        <div className="max-w-2xl mx-auto p-8 bg-slate-800 rounded-2xl shadow-lg animate-fade-in space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-sky-400">{UI_TEXT.config.title}</h1>
                <p className="text-slate-300 mt-2">{UI_TEXT.config.description}</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label htmlFor="language-select" className="block text-lg font-medium text-slate-300 mb-2">{UI_TEXT.config.selectLanguage}</label>
                    <select
                        id="language-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        className="w-full p-3 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-sky-500 focus:ring focus:ring-sky-500/50 transition"
                    >
                        <option value={Language.EN}>English</option>
                        <option value={Language.KO}>한국어 (Korean)</option>
                        <option value={Language.VI}>Tiếng Việt (Vietnamese)</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="level-select" className="block text-lg font-medium text-slate-300 mb-2">{UI_TEXT.config.selectLevel}</label>
                    <select
                        id="level-select"
                        value={level}
                        onChange={(e) => setLevel(e.target.value as Level)}
                        className="w-full p-3 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-sky-500 focus:ring focus:ring-sky-500/50 transition"
                    >
                        {Object.values(Level).map((lvl) => (
                           <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="voice-select" className="block text-lg font-medium text-slate-300 mb-2">{UI_TEXT.config.selectVoice}</label>
                    <select
                        id="voice-select"
                        value={selectedVoiceURI}
                        onChange={(e) => setSelectedVoiceURI(e.target.value)}
                        disabled={voices.length === 0}
                        className="w-full p-3 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-sky-500 focus:ring focus:ring-sky-500/50 transition disabled:opacity-50"
                    >
                        <option value="">{UI_TEXT.config.noVoice}</option>
                        {voices.map((voice) => (
                            <option key={voice.voiceURI} value={voice.voiceURI}>
                                {voice.name} ({voice.lang})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                 <button
                    onClick={handleStartInterviewClick}
                    className="w-full py-4 text-xl font-bold bg-sky-600 hover:bg-sky-700 rounded-lg transition-all duration-200"
                >
                    {UI_TEXT.config.startInterview}
                </button>
                 <div className="text-center">
                    <p className="text-slate-300 mt-4">{UI_TEXT.config.liveTalkDescription}</p>
                </div>
                 <button
                    onClick={handleStartLiveTalkClick}
                    className="w-full py-3 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all duration-200"
                >
                    {UI_TEXT.config.startLiveTalk}
                </button>
            </div>
        </div>
    );
};

export default ConfigurationScreen;
