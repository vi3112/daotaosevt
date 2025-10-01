import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Language, Level, Question, Response, Assessment, TranscriptionEntry, LanguageCode } from './types';
import { generateQuestions, generateAssessment, generateLiveTalkAssessment } from './services/geminiService';
import ConfigurationScreen from './components/ConfigurationScreen';
import InterviewScreen from './components/InterviewScreen';
import ResultsScreen from './components/ResultsScreen';
import Loader from './components/Loader';
import LiveTalkScreen from './components/LiveTalkScreen';
import LiveTalkResultsScreen from './components/LiveTalkResultsScreen';
import { getUIText } from './constants';

type AppState = 'CONFIG' | 'LOADING' | 'INTERVIEW' | 'RESULTS' | 'LIVE_TALK' | 'LIVE_RESULTS';

const App: React.FC = () => {
    // Per guidelines, assume process.env.API_KEY is available and configured.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const [appState, setAppState] = useState<AppState>('CONFIG');
    const [language, setLanguage] = useState<Language>(Language.EN);
    const [level, setLevel] = useState<Level>(Level.INTERMEDIATE_MID);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>(undefined);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Interview state
    const [questions, setQuestions] = useState<Question[]>([]);
    const [responses, setResponses] = useState<Response[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [assessment, setAssessment] = useState<Assessment | null>(null);

    // Live Talk state
    const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);

    const getLangCode = (lang: Language): LanguageCode => lang.split('-')[0] as LanguageCode;

    const createLevelRange = useCallback((estimatedLevel: string): string => {
        const allLevels: string[] = [
            'Novice Low', 'Novice Mid', 'Novice High',
            'Intermediate Low', 'Intermediate Mid', 'Intermediate High',
            'Advanced Low'
        ];

        let currentIndex = -1;
        // Find the best matching level from our list
        for (let i = 0; i < allLevels.length; i++) {
            if (estimatedLevel.includes(allLevels[i])) {
                currentIndex = i;
                break;
            }
        }
        
        if (currentIndex === -1) {
            return estimatedLevel; // Fallback if level not found in our list
        }
        
        const langCode = getLangCode(language);

        // Shift the range up by one level and keep the width of 2 levels.
        const lowerBoundIndex = currentIndex + 1;
        const upperBoundIndex = currentIndex + 3;

        // Handle edge cases where the estimated level is already high
        if (lowerBoundIndex >= allLevels.length - 1) {
             const highestLevel = allLevels[allLevels.length - 1];
             switch(langCode) {
                case 'vi':
                    return `${highestLevel} trở lên`;
                case 'ko':
                    return `${highestLevel} 이상`;
                case 'en':
                default:
                    return `${highestLevel} or higher`;
            }
        }

        const lowerLevel = allLevels[lowerBoundIndex];
        // Ensure upper bound does not exceed the maximum level
        const effectiveUpperBoundIndex = Math.min(upperBoundIndex, allLevels.length - 1);
        const upperLevel = allLevels[effectiveUpperBoundIndex];

        if (lowerLevel === upperLevel) {
             // This can happen if the estimated level is second to last
             switch(langCode) {
                case 'vi':
                    return `${lowerLevel} trở lên`;
                case 'ko':
                    return `${lowerLevel} 이상`;
                case 'en':
                default:
                    return `${lowerLevel} or higher`;
            }
        }

        switch(langCode) {
            case 'vi':
                return `Khoảng ${lowerLevel} đến ${upperLevel}`;
            case 'ko':
                return `${lowerLevel} ~ ${upperLevel} 수준`;
            case 'en':
            default:
                return `Around ${lowerLevel} - ${upperLevel}`;
        }
    }, [language]);

    const handleStartInterview = useCallback(async (lang: Language, lvl: Level, voiceURI?: string) => {
        setLanguage(lang);
        setLevel(lvl);
        setSelectedVoiceURI(voiceURI);
        setLoadingMessage(getUIText(getLangCode(lang)).loader.generatingQuestions);
        setAppState('LOADING');
        setError(null);
        try {
            const fetchedQuestions = await generateQuestions(ai, lang, lvl);
            setQuestions(fetchedQuestions);
            setResponses([]);
            setCurrentQuestionIndex(0);
            setAssessment(null);
            setAppState('INTERVIEW');
        } catch (err) {
            console.error(err);
            setError(getUIText(getLangCode(lang)).errors.geminiError);
            setAppState('CONFIG');
        }
    }, [ai]);

    const handleNextQuestion = useCallback((response: Response) => {
        const newResponses = [...responses, response];
        setResponses(newResponses);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setAppState('RESULTS');
        }
    }, [responses, currentQuestionIndex, questions.length]);

    const handleGenerateAssessment = useCallback(async () => {
         setLoadingMessage(getUIText(getLangCode(language)).loader.generatingAssessment);
         setAppState('LOADING'); // Or handle loading within the results screen
        try {
            const generatedAssessment = await generateAssessment(ai, questions, responses, language, level);
            generatedAssessment.estimatedLevel = createLevelRange(generatedAssessment.estimatedLevel);
            setAssessment(generatedAssessment);
        } catch (err) {
            console.error(err);
            setError(getUIText(getLangCode(language)).errors.geminiError); // Show error on results screen
        } finally {
             setAppState('RESULTS');
        }
    }, [ai, questions, responses, language, level, createLevelRange]);

    const handleRestart = useCallback(() => {
        setAppState('CONFIG');
        setQuestions([]);
        setResponses([]);
        setCurrentQuestionIndex(0);
        setAssessment(null);
        setError(null);
        setTranscriptionHistory([]);
    }, []);
    
    const handleStartLiveTalk = useCallback((lang: Language, voiceURI?: string) => {
        setLanguage(lang);
        setSelectedVoiceURI(voiceURI);
        setTranscriptionHistory([]);
        setAssessment(null); // Clear previous assessments
        setAppState('LIVE_TALK');
    }, []);
    
    const handleEndLiveTalk = useCallback((finalTranscript: TranscriptionEntry[]) => {
        setTranscriptionHistory(finalTranscript);
        setAppState('LIVE_RESULTS');
    }, []);

    const handleGenerateLiveTalkAssessment = useCallback(async () => {
        setLoadingMessage(getUIText(getLangCode(language)).loader.generatingLiveAssessment);
        setAppState('LOADING');
        try {
            const generatedAssessment = await generateLiveTalkAssessment(ai, transcriptionHistory, language);
            generatedAssessment.estimatedLevel = createLevelRange(generatedAssessment.estimatedLevel);
            setAssessment(generatedAssessment);
        } catch (err) {
            console.error(err);
            setError(getUIText(getLangCode(language)).errors.geminiError);
        } finally {
            setAppState('LIVE_RESULTS');
        }
    }, [ai, transcriptionHistory, language, createLevelRange]);


    const renderContent = () => {
        switch (appState) {
            case 'LOADING':
                return <Loader text={loadingMessage} />;
            case 'INTERVIEW':
                return (
                    <InterviewScreen
                        question={questions[currentQuestionIndex]}
                        questionNumber={currentQuestionIndex + 1}
                        totalQuestions={questions.length}
                        language={language}
                        selectedVoiceURI={selectedVoiceURI}
                        onNextQuestion={handleNextQuestion}
                    />
                );
            case 'RESULTS':
                return (
                    <ResultsScreen
                        questions={questions}
                        responses={responses}
                        assessment={assessment}
                        onGenerateAssessment={handleGenerateAssessment}
                        onRestart={handleRestart}
                        language={language}
                        selectedVoiceURI={selectedVoiceURI}
                    />
                );
            case 'LIVE_TALK':
                 return (
                    <LiveTalkScreen
                        ai={ai}
                        language={language}
                        onEndSession={handleEndLiveTalk}
                    />
                 );
            case 'LIVE_RESULTS':
                 return (
                    <LiveTalkResultsScreen
                        transcriptionHistory={transcriptionHistory}
                        onRestart={handleRestart}
                        language={language}
                        assessment={assessment}
                        onGenerateAssessment={handleGenerateLiveTalkAssessment}
                    />
                 );
case 'CONFIG':
            default:
                // Fix: LEVEL enum access
                return (
                    <ConfigurationScreen
                        onStartInterview={handleStartInterview}
                        onStartLiveTalk={handleStartLiveTalk}
                    />
                );
        }
    };

    return (
        <div className="bg-slate-900 text-white min-h-screen flex items-center justify-center p-4 font-sans">
            <main className="w-full max-w-4xl">
                 {error && appState !== 'CONFIG' && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-4" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                 )}
                {renderContent()}
            </main>
        </div>
    );
};

export default App;