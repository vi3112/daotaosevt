import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Language, LanguageCode, TranscriptionEntry } from '../types';
import { decode, decodeAudioData, encode } from '../services/audioUtils';
import { getUIText } from '../constants';
import MicIcon from './MicIcon';

// Fix: Add webkitAudioContext to window type for older browser compatibility.
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

interface LiveTalkScreenProps {
    ai: GoogleGenAI;
    language: Language;
    onEndSession: (transcriptionHistory: TranscriptionEntry[]) => void;
}

const LiveTalkScreen: React.FC<LiveTalkScreenProps> = ({ ai, language, onEndSession }) => {
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const [status, setStatus] = useState('Connecting...');
    const [error, setError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

    const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const langCode = language.split('-')[0] as LanguageCode;
    const UI_TEXT = getUIText(langCode);

    useEffect(() => {
        const languageName = {
            'en-US': 'English',
            'ko-KR': 'Korean',
            'vi-VN': 'Vietnamese',
        }[language];

        let isCancelled = false;
        
        const cleanup = () => {
            console.debug('Cleaning up live session...');
            isCancelled = true;
            
            streamRef.current?.getTracks().forEach(track => track.stop());
            
            if (scriptProcessorRef.current) {
                scriptProcessorRef.current.disconnect();
                scriptProcessorRef.current = null;
            }

            inputAudioContextRef.current?.close().catch(console.error);
            outputAudioContextRef.current?.close().catch(console.error);

            for (const source of sourcesRef.current.values()) {
                source.stop();
            }
            sourcesRef.current.clear();
            
            if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => session.close()).catch(console.error);
                sessionPromiseRef.current = null;
            }
        };

        const setup = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Media Devices API not supported.');
                }
                setStatus('Initializing audio...');
                inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
                outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
                streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

                setStatus('Connecting to Gemini...');
                sessionPromiseRef.current = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: {
                        onopen: () => {
                            if (isCancelled) return;
                            console.debug('Session opened.');
                            setStatus('Connected. Speak now!');
                            setIsListening(true);
                            
                            const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
                            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                            
                            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const l = inputData.length;
                                const int16 = new Int16Array(l);
                                for (let i = 0; i < l; i++) {
                                    int16[i] = inputData[i] * 32768;
                                }
                                const pcmBlob: Blob = {
                                    data: encode(new Uint8Array(int16.buffer)),
                                    mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
                                };
                                
                                if (sessionPromiseRef.current) {
                                    sessionPromiseRef.current.then((session) => {
                                        session.sendRealtimeInput({ media: pcmBlob });
                                    });
                                }
                            };
                            source.connect(scriptProcessor);
                            scriptProcessor.connect(inputAudioContextRef.current!.destination);
                            scriptProcessorRef.current = scriptProcessor;
                        },
                        onmessage: async (message: LiveServerMessage) => {
                            if (isCancelled) return;
                            
                            // Handle transcription
                            if (message.serverContent?.outputTranscription) {
                                currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                            }
                            if (message.serverContent?.inputTranscription) {
                                currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                            }

                            if (message.serverContent?.turnComplete) {
                                const fullInput = currentInputTranscriptionRef.current.trim();
                                const fullOutput = currentOutputTranscriptionRef.current.trim();
                                
                                setTranscriptionHistory(prev => {
                                    const newHistory = [...prev];
                                    if(fullInput) newHistory.push({ speaker: 'user', text: fullInput });
                                    if(fullOutput) newHistory.push({ speaker: 'model', text: fullOutput });
                                    return newHistory;
                                });

                                currentInputTranscriptionRef.current = '';
                                currentOutputTranscriptionRef.current = '';
                            }

                            // Handle audio playback
                            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                            if (base64Audio) {
                                const outputCtx = outputAudioContextRef.current!;
                                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                                const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, OUTPUT_SAMPLE_RATE, 1);
                                const source = outputCtx.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputCtx.destination);
                                source.addEventListener('ended', () => {
                                    sourcesRef.current.delete(source);
                                });
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                sourcesRef.current.add(source);
                            }
                        },
                        onerror: (e: ErrorEvent) => {
                             if (isCancelled) return;
                            console.error('Session error:', e);
                            setError(UI_TEXT.errors.liveError);
                            setStatus('Error');
                            setIsListening(false);
                            cleanup();
                        },
                        onclose: (e: CloseEvent) => {
                            if (isCancelled) return;
                            console.debug('Session closed.');
                            setStatus('Session ended.');
                            setIsListening(false);
                        },
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                        systemInstruction: `You are a friendly and helpful conversation partner. The user wants to practice speaking ${languageName}. Please converse with them naturally in ${languageName}. Keep your responses concise and engaging to encourage the user to speak more.`,
                    },
                });

                await sessionPromiseRef.current;

            } catch (err) {
                console.error('Setup failed:', err);
                setError((err as Error).message || UI_TEXT.errors.micPermission);
                setStatus('Failed to start');
                cleanup();
            }
        };

        setup();

        return () => {
            cleanup();
        };
    }, [ai, language, onEndSession, UI_TEXT.errors.micPermission, UI_TEXT.errors.liveError]);
    
    const handleEndClick = () => {
        onEndSession(transcriptionHistory);
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-800 rounded-2xl shadow-lg h-full animate-fade-in min-h-[500px]">
            <h2 className="text-3xl font-bold text-sky-400 mb-4">{UI_TEXT.config.startLiveTalk}</h2>
            <p className="text-slate-400 mb-6">{status}</p>

            <div className="w-full h-64 bg-slate-900/50 rounded-lg p-4 mb-6 overflow-y-auto flex flex-col-reverse">
                <div className="space-y-4">
                     {transcriptionHistory.slice().reverse().map((entry, index) => (
                        <div key={index} className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${entry.speaker === 'user' ? 'bg-sky-700 text-white' : 'bg-slate-600 text-slate-100'}`}>
                                <p className="text-sm font-bold capitalize mb-1">{entry.speaker === 'user' ? UI_TEXT.liveResults.user : UI_TEXT.liveResults.model}</p>
                                {entry.text}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col items-center space-y-4">
                <MicIcon active={isListening} />
                {error && <p className="text-red-500 font-semibold">{error}</p>}
                 <button
                    onClick={handleEndClick}
                    className="w-full px-8 py-3 text-lg font-bold bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200"
                >
                    {UI_TEXT.buttons.endSession}
                </button>
            </div>
        </div>
    );
};

export default LiveTalkScreen;