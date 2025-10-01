import { Language } from '../types';

/**
 * A list of substrings to identify preferred, high-quality voices.
 * This is more robust than exact matching as voice names can vary slightly across browsers/OS.
 */
const PREFERRED_VOICE_SUBSTRINGS: { [key in Language]: string[] } = {
    [Language.VI]: ['Google Tiếng Việt', 'HoaiMy', 'NamMinh'], // High-quality Vietnamese voices
    [Language.EN]: ['Google US English', 'David', 'Zira', 'Alex'], // High-quality US English voices
    [Language.KO]: ['Google 한국의', 'SunHi', 'InJoon', 'Yuna'], // High-quality Korean voices
};

/**
 * A singleton service to manage Text-to-Speech functionality,
 * ensuring voices are loaded before any speech is synthesized.
 */
class TTSService {
    private voices: SpeechSynthesisVoice[] = [];
    private voicePromise: Promise<SpeechSynthesisVoice[]>;
    private lastUsedVoiceIndex = new Map<Language, number>();

    constructor() {
        this.voicePromise = new Promise((resolve) => {
            if (typeof window === 'undefined' || !window.speechSynthesis) {
                console.warn("Speech Synthesis not supported.");
                return resolve([]);
            }

            const getVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                if (availableVoices.length > 0) {
                    this.voices = availableVoices;
                    resolve(this.voices);
                    return true;
                }
                return false;
            };

            // Check if voices are already loaded, otherwise set up the event listener.
            if (!getVoices()) {
                window.speechSynthesis.onvoiceschanged = () => getVoices();
            }
        });
    }

    /**
     * Retrieves the available speech synthesis voices for a given language.
     * @param language The language to filter voices by.
     * @returns A promise that resolves with an array of available voices.
     */
    public async getAvailableVoices(language: Language): Promise<SpeechSynthesisVoice[]> {
        await this.voicePromise;
        const langPrefix = language.split('-')[0];
        return this.voices.filter(voice => voice.lang.startsWith(langPrefix));
    }

    /**
     * Speaks the given text using the best available voice for the specified language.
     * If a specific voiceURI is provided, it will be used.
     * @param text The text to be spoken.
     * @param language The desired language for speech synthesis.
     * @param voiceURI Optional: The URI of the specific voice to use.
     * @returns A promise that resolves when the speech is finished, or rejects on error.
     */
    public async speak(text: string, language: Language, voiceURI?: string): Promise<void> {
        const voices = await this.voicePromise;
        
        return new Promise((resolve, reject) => {
            if (voices.length === 0) {
                // If no voices are available, resolve immediately to not block the app flow.
                return resolve();
            }

            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language;
            utterance.rate = 0.9;
            utterance.pitch = 1.0;

            let selectedVoice: SpeechSynthesisVoice | undefined;

            // --- Priority 1: Use a specific voice if requested ---
            if (voiceURI) {
                selectedVoice = voices.find(v => v.voiceURI === voiceURI);
                if (!selectedVoice) {
                    console.warn(`Voice with URI "${voiceURI}" not found. Falling back to automatic selection.`);
                }
            }

            // --- Priority 2: Automatic voice selection if no specific voice is requested or found ---
            if (!selectedVoice) {
                const langPrefix = language.split('-')[0];
                const preferredSubstrings = PREFERRED_VOICE_SUBSTRINGS[language] || [];
                const preferredVoices = voices.filter(voice =>
                    voice.lang.startsWith(langPrefix) && preferredSubstrings.some(sub => voice.name.includes(sub))
                );

                let voicePool: SpeechSynthesisVoice[] = [];

                if (preferredVoices.length > 0) {
                    voicePool = preferredVoices;
                } else {
                    const nativeVoices = voices.filter(voice => voice.lang.startsWith(langPrefix));
                    if (nativeVoices.length > 0) {
                        voicePool = nativeVoices;
                    }
                }
                
                if (voicePool.length > 0) {
                    const defaultVoice = voicePool.find(v => v.default);
                    if (defaultVoice) {
                        selectedVoice = defaultVoice;
                    } else {
                        const lastIndex = this.lastUsedVoiceIndex.get(language) ?? -1;
                        const nextIndex = (lastIndex + 1) % voicePool.length;
                        selectedVoice = voicePool[nextIndex];
                        this.lastUsedVoiceIndex.set(language, nextIndex);
                    }
                }
            }
            
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            } else {
                console.warn(`Could not find any suitable voice for language: ${language}. Relying on browser default.`);
            }

            utterance.onend = () => resolve();
            utterance.onerror = (e) => {
                console.error("SpeechSynthesis Error:", e);
                reject(e);
            };

            window.speechSynthesis.speak(utterance);
        });
    }
}

// Instantiate and export methods for use throughout the app.
const ttsService = new TTSService();
export const speak = ttsService.speak.bind(ttsService);
export const getAvailableVoices = ttsService.getAvailableVoices.bind(ttsService);