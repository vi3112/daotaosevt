import { GoogleGenAI, Type } from '@google/genai';
import { Question, Response, Language, Level, Assessment, TranscriptionEntry } from '../types';
import { OPIC_LEVELS } from '../constants';

const model = 'gemini-2.5-flash';

/**
 * Generates a list of interview questions using the Gemini API.
 * @param ai - The GoogleGenAI instance.
 * @param language - The language for the questions.
 * @param level - The target proficiency level.
 * @returns A promise that resolves to an array of questions.
 */
export const generateQuestions = async (ai: GoogleGenAI, language: Language, level: Level): Promise<Question[]> => {
    const languageName = {
        'en-US': 'English',
        'ko-KR': 'Korean',
        'vi-VN': 'Vietnamese',
    }[language];

    const prompt = `You are an expert OPIc test designer. Create a set of 5 diverse interview questions for a candidate aiming for the "${level}" level (${OPIC_LEVELS[level]}). The questions should cover a range of topics like personal life, hobbies, work, travel, and opinions. The questions must be in ${languageName}.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            description: `An array of 5 interview questions in ${languageName}.`,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: {
                                        type: Type.STRING,
                                        description: 'A unique identifier for the question (e.g., "q1").'
                                    },
                                    text: {
                                        type: Type.STRING,
                                        description: `The question text in ${languageName}.`
                                    }
                                },
                                required: ["id", "text"]
                            }
                        }
                    },
                    required: ["questions"]
                }
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        if (result.questions && Array.isArray(result.questions)) {
            return result.questions.filter((q): q is Question => q.id && q.text);
        } else {
            throw new Error("Invalid response format from Gemini API");
        }
    } catch (error) {
        console.error("Error generating questions with Gemini:", error);
        throw error;
    }
};

/**
 * Generates an assessment of the user's responses using the Gemini API.
 * @param ai - The GoogleGenAI instance.
 * @param questions - The questions that were asked.
 * @param responses - The user's responses.
 * @param language - The language of the interview.
 * @param level - The target proficiency level.
 * @returns A promise that resolves to an Assessment object.
 */
export const generateAssessment = async (ai: GoogleGenAI, questions: Question[], responses: Response[], language: Language, level: Level): Promise<Assessment> => {
    const languageName = {
        'en-US': 'English',
        'ko-KR': 'Korean',
        'vi-VN': 'Vietnamese',
    }[language];

    const interviewTranscript = responses.map((res, index) =>
        `Question ${index + 1}: ${res.question.text}\nAnswer ${index + 1}: ${res.transcript}`
    ).join('\n\n');

    const evaluationRubric = `
- Novice Low (NL): Can communicate using single words and memorized phrases.
- Novice Mid (NM): Can use single words and memorized phrases to talk about themselves and daily life.
- Novice High (NH): Can use simple sentences to talk about themselves and daily life, sometimes relying on phrases.
- Intermediate Low (IL): Can ask and answer simple questions and maintain a basic conversation using sentences, mostly in the present tense.
- Intermediate Mid (IM): Can consistently have a simple conversation about familiar topics, using strings of sentences. Can talk about past and future but may make errors.
- Intermediate High (IH): Can handle most everyday conversations. Can narrate and describe in past, present, and future tenses with some consistency. Can be understood by native speakers despite some errors.
- Advanced Low (AL): Can speak confidently on many topics, describing and explaining in detail across all time frames. Can produce paragraph-length speech and can be easily understood by native speakers.
    `;

    const prompt = `You are a friendly and encouraging OPIc language coach. Your goal is to build the user's confidence. Your evaluation should be generous and focus more on communicative success than on perfect grammar. Please be lenient with your scoring. A candidate aiming for the "${level}" level has completed a mock interview in ${languageName}.
    
    Here is the transcript of their responses:
    ---
    ${interviewTranscript}
    ---
    
    Using the simplified, ability-focused rubric below, please provide an evaluation in ${languageName}. Your feedback should be positive and constructive. The evaluation must include:
    1.  An "estimatedLevel" using one of the level names from the rubric (e.g., "Novice High", "Intermediate Mid", "Advanced Low"). Be generous in this estimation.
    2.  A concise "feedback" paragraph (3-4 sentences) summarizing the candidate's strengths and areas for growth. Start with what they did well.
    3.  An array of 3 specific, actionable "suggestions" for improvement.
    
    ---
    Evaluation Rubric:
    ${evaluationRubric}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        estimatedLevel: {
                            type: Type.STRING,
                            description: `The estimated OPIc level (e.g., "Intermediate Mid").`
                        },
                        feedback: {
                            type: Type.STRING,
                            description: `A concise, encouraging feedback paragraph in ${languageName}.`
                        },
                        suggestions: {
                            type: Type.ARRAY,
                            description: `An array of 3 improvement suggestions in ${languageName}.`,
                            items: {
                                type: Type.STRING
                            }
                        }
                    },
                    required: ["estimatedLevel", "feedback", "suggestions"]
                }
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        if (result.estimatedLevel && result.feedback && result.suggestions) {
            return result;
        } else {
            throw new Error("Invalid assessment format from Gemini API");
        }
    } catch (error) {
        console.error("Error generating assessment with Gemini:", error);
        throw error;
    }
};

/**
 * Generates an assessment of a free-form live conversation.
 * @param ai - The GoogleGenAI instance.
 * @param transcriptionHistory - The full transcript of the conversation.
 * @param language - The language of the conversation.
 * @returns A promise that resolves to an Assessment object.
 */
export const generateLiveTalkAssessment = async (ai: GoogleGenAI, transcriptionHistory: TranscriptionEntry[], language: Language): Promise<Assessment> => {
    const languageName = {
        'en-US': 'English',
        'ko-KR': 'Korean',
        'vi-VN': 'Vietnamese',
    }[language];

    const conversationTranscript = transcriptionHistory.map(entry =>
        `${entry.speaker === 'user' ? 'User' : 'AI'}: ${entry.text}`
    ).join('\n');

    const prompt = `You are a friendly and encouraging language conversation partner. Your goal is to provide supportive feedback to help the user improve and gain confidence. A user has just completed a free-form conversation in ${languageName}.

    Here is the full transcript:
    ---
    ${conversationTranscript}
    ---

    Based on the user's performance, please provide a positive and constructive evaluation in ${languageName}. Focus on their communicative ability and fluency. The evaluation must be formatted as a JSON object and include:
    1.  An "estimatedLevel": Your best, slightly generous estimate of the user's conversational OPIc level (e.g., "Intermediate Mid", "Advanced Low").
    2.  A "feedback" paragraph of about 200 words. Start by highlighting their strengths, then gently suggest areas for improvement regarding fluency, coherence, grammar, and vocabulary.
    3.  An array of 3 specific, actionable "suggestions" for improvement. One of these suggestions **must** focus on how the user can better develop their ideas and expand on topics in a conversation.
    `;

     try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        estimatedLevel: {
                            type: Type.STRING,
                            description: `The estimated OPIc level (e.g., "Intermediate Mid 1").`
                        },
                        feedback: {
                            type: Type.STRING,
                            description: `A detailed feedback paragraph of about 200 words in ${languageName}.`
                        },
                        suggestions: {
                            type: Type.ARRAY,
                            description: `An array of 3 improvement suggestions in ${languageName}, with one focusing on idea development.`,
                            items: {
                                type: Type.STRING
                            }
                        }
                    },
                    required: ["estimatedLevel", "feedback", "suggestions"]
                }
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        if (result.estimatedLevel && result.feedback && result.suggestions) {
            return result;
        } else {
            throw new Error("Invalid assessment format from Gemini API");
        }
    } catch (error) {
        console.error("Error generating live talk assessment with Gemini:", error);
        throw error;
    }
};