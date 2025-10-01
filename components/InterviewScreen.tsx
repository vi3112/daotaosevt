import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Question, Response, Language, LanguageCode } from '../types';
import { getUIText } from '../constants';
import { speak } from '../services/ttsService';
import MicIcon from './MicIcon';
import Timer from './Timer';

// Fix: Add types for Web Speech API to resolve TypeScript errors.
interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    start: () => void;
    stop: () => void;
}

interface SpeechRecognitionStatic {
    new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}

interface InterviewScreenProps {
    question: Question;
    questionNumber: number;
    totalQuestions: number;
    language: Language;
    selectedVoiceURI?: string;
    onNextQuestion: (response: Response) => void;
}

// Fix: Rename variable to avoid conflict with the SpeechRecognition interface type.
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognitionAPI;

const InterviewScreen: React.FC<InterviewScreenProps> = ({ question, questionNumber, totalQuestions, language, selectedVoiceURI, onNextQuestion }) => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isMinTimeElapsed, setIsMinTimeElapsed] = useState(false);

    // Fix: Use the SpeechRecognition interface for the ref type.
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const speakingTimerRef = useRef<number | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const minSpeakingSeconds = 30;
    const maxSpeakingSeconds = 120; // 2 minutes
    
    const [maxTimeLeft, setMaxTimeLeft] = useState(maxSpeakingSeconds);
    const maxTimerRef = useRef<number | null>(null);
    const maxTimeIntervalRef = useRef<number | null>(null);

    const langCode = language.split('-')[0] as LanguageCode;
    const UI_TEXT = getUIText(langCode);

    const stopListeningAndProcess = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setIsListening(false);
        setStatusMessage(UI_TEXT.interview.processing);
    }, [UI_TEXT.interview.processing]);

    const startListening = useCallback(async () => {
        if (!isSpeechRecognitionSupported) {
            setError(UI_TEXT.errors.unsupportedBrowser);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Setup MediaRecorder
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                onNextQuestion({ question, transcript, audioUrl });
                // Clean up stream tracks
                stream.getTracks().forEach(track => track.stop());
            };

            // Setup SpeechRecognition
            const recognition = new SpeechRecognitionAPI();
            recognition.lang = language;
            recognition.interimResults = true;
            recognition.continuous = true;

            recognition.onstart = () => {
                setIsListening(true);
                mediaRecorderRef.current?.start();
                setStatusMessage(UI_TEXT.interview.speakNow);
            };

            recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = transcript;
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript + ' ';
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                setTranscript(finalTranscript);
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setError(UI_TEXT.errors.sttError);
                stopListeningAndProcess();
            };

            recognition.onend = () => {
                setIsListening(false);
                 if (speakingTimerRef.current) {
                     clearTimeout(speakingTimerRef.current);
                     speakingTimerRef.current = null;
                 }
                 if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
                 if (maxTimeIntervalRef.current) clearInterval(maxTimeIntervalRef.current);
            };
            
            recognitionRef.current = recognition;
            recognition.start();

            // Start min speaking timer
            if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
            speakingTimerRef.current = window.setTimeout(() => {
                speakingTimerRef.current = null; // Timer fulfilled
                setIsMinTimeElapsed(true);
            }, minSpeakingSeconds * 1000);

            // Start max speaking timer
            if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
            maxTimerRef.current = window.setTimeout(() => {
                setStatusMessage(UI_TEXT.interview.maxTimeReached);
                stopListeningAndProcess();
            }, maxSpeakingSeconds * 1000);

            // Start UI countdown for max time
            setMaxTimeLeft(maxSpeakingSeconds);
            if (maxTimeIntervalRef.current) clearInterval(maxTimeIntervalRef.current);
            maxTimeIntervalRef.current = window.setInterval(() => {
                setMaxTimeLeft(prev => prev > 0 ? prev - 1 : 0);
            }, 1000);

        } catch (err) {
            console.error("Error getting user media", err);
            setError(UI_TEXT.errors.micPermission);
        }

    }, [language, onNextQuestion, question, stopListeningAndProcess, transcript, UI_TEXT]);

    useEffect(() => {
        // This effect runs when a new question is received
        setTranscript('');
        setStatusMessage('');
        setError(null);
        setIsMinTimeElapsed(false);
        setMaxTimeLeft(maxSpeakingSeconds);

        speak(question.text, language, selectedVoiceURI)
            .then(() => {
                startListening();
            })
            .catch(err => {
                console.error("TTS Error", err);
                setError(UI_TEXT.errors.ttsError);
            });
        
        return () => {
            // Cleanup on component unmount or question change
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            if (maxTimeIntervalRef.current) {
                clearInterval(maxTimeIntervalRef.current);
            }
            stopListeningAndProcess();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question, language, selectedVoiceURI]); 

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-800 rounded-2xl shadow-lg h-full animate-fade-in">
            <div className="w-full text-center mb-6">
                <p className="text-slate-400">{UI_TEXT.interview.question} {questionNumber}/{totalQuestions}</p>
                <h2 className="text-2xl md:text-3xl font-semibold text-sky-300 mt-2">{question.text}</h2>
            </div>

            <div className="w-full flex-grow bg-slate-900/50 rounded-lg p-6 mb-6 relative min-h-[200px] flex flex-col justify-center items-center">
                 {!isListening && !transcript && <p className="text-slate-400">{statusMessage}</p>}
                <p className="text-slate-100 text-lg leading-relaxed">{transcript}</p>
                 {isListening && <div className="absolute top-4 right-4"><MicIcon active={isListening} /></div>}
            </div>

            <div className="w-full flex items-center justify-between text-slate-400">
                <div className='flex-1'>
                    <div className="space-y-1">
                        {isListening && <Timer duration={minSpeakingSeconds} langCode={langCode} />}
                        {isListening && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span>
                                    {UI_TEXT.interview.maxTime}: {String(Math.floor(maxTimeLeft / 60)).padStart(2, '0')}:{String(maxTimeLeft % 60).padStart(2, '0')}
                                </span>
                            </div>
                        )}
                        <p className="text-sm font-medium pt-1">
                            {isListening ? UI_TEXT.interview.listening : statusMessage}
                        </p>
                    </div>
                     {error && <p className="text-red-500 text-sm font-semibold mt-2">{error}</p>}
                </div>
                {isListening && (
                     <button
                        onClick={stopListeningAndProcess}
                        disabled={!isMinTimeElapsed}
                        className="ml-4 px-6 py-3 bg-sky-600 text-white font-bold rounded-lg shadow-md hover:bg-sky-700 transition-all duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {UI_TEXT.buttons.next}
                    </button>
                )}
            </div>
        </div>
    );
};

export default InterviewScreen;