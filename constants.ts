import { Level, LanguageCode } from './types';

export const OPIC_LEVELS: Record<Level, string> = {
    [Level.NOVICE_HIGH]: "Can handle a variety of simple communicative tasks in straightforward social situations.",
    [Level.INTERMEDIATE_LOW]: "Can handle a number of uncomplicated communicative tasks in straightforward social situations.",
    [Level.INTERMEDIATE_MID]: "Can ask and answer simple questions, initiate and respond to simple statements, and maintain simple face-to-face conversations.",
    [Level.INTERMEDIATE_HIGH]: "Can successfully handle most uncomplicated communicative tasks and social situations.",
    [Level.ADVANCED_LOW]: "Can narrate and describe in all major time frames (past, present, and future) and handle a situation with a complication.",
};

const UI_TEXT = {
    en: {
        config: {
            title: 'OPIc AI Practice',
            description: 'Select your interview language and target level.',
            selectLanguage: 'Interview Language',
            selectLevel: 'Target Level',
            selectVoice: 'Select a Voice (Optional)',
            noVoice: 'Using browser default',
            startInterview: 'Start Mock Interview',
            liveTalkDescription: "Or, have a free-form conversation with the AI.",
            startLiveTalk: 'Start Live Talk',
        },
        interview: {
            question: 'Question',
            speakNow: 'Speak now...',
            listening: 'Listening...',
            processing: 'Processing your answer...',
            minTime: 'Minimum time remaining: ',
            minTimeReached: 'Minimum time reached. You can click Next.',
            maxTime: 'Time remaining',
            maxTimeReached: "Time's up, finishing up...",
        },
        results: {
            title: 'Interview Results',
            assessmentTitle: 'AI Evaluation',
            estimatedLevel: 'Estimated Level',
            feedback: 'Feedback',
            suggestions: 'Suggestions for Improvement',
            replayTitle: 'Review Your Answers',
            yourAnswerWas: 'Your answer was:',
            replayQuestion: 'Replay Question',
            replayAnswer: 'Replay Your Answer',
        },
        liveResults: {
            title: 'Live Talk Transcript',
            user: 'You',
            model: 'AI',
        },
        buttons: {
            generateAssessment: 'Generate AI Assessment',
            generateLiveAssessment: 'Generate Live Talk Assessment',
            download: 'Download All Audio',
            restart: 'Start Over',
            next: 'Next',
            endSession: 'End Session'
        },
        errors: {
            unsupportedBrowser: 'Speech recognition is not supported in this browser.',
            sttError: 'An error occurred with speech recognition.',
            micPermission: 'Microphone access denied. Please allow microphone access in your browser settings.',
            ttsError: 'Text-to-speech failed to play.',
            geminiError: 'An error occurred with the AI. Please try again.',
            liveError: 'A connection error occurred during the live session.',
        },
        loader: {
            generatingQuestions: 'Generating your personalized interview questions...',
            generatingAssessment: 'Analyzing your responses and generating feedback...',
            generatingLiveAssessment: 'Analyzing your conversation and generating feedback...',
        }
    },
    ko: {
        config: {
            title: 'OPIc AI 연습',
            description: '면접 언어와 목표 레벨을 선택하세요.',
            selectLanguage: '면접 언어',
            selectLevel: '목표 레벨',
            selectVoice: '음성 선택 (선택 사항)',
            noVoice: '브라우저 기본 음성 사용',
            startInterview: '모의 면접 시작',
            liveTalkDescription: "또는, AI와 자유로운 대화를 나눠보세요.",
            startLiveTalk: '실시간 대화 시작',
        },
        interview: {
            question: '질문',
            speakNow: '지금 말씀하세요...',
            listening: '듣는 중...',
            processing: '답변을 처리하는 중...',
            minTime: '최소 시간 남음: ',
            minTimeReached: '최소 시간에 도달했습니다. 다음을 클릭할 수 있습니다.',
            maxTime: '남은 시간',
            maxTimeReached: '시간이 초과되어 마무리합니다...',
        },
        results: {
            title: '면접 결과',
            assessmentTitle: 'AI 평가',
            estimatedLevel: '예상 레벨',
            feedback: '피드백',
            suggestions: '개선 제안',
            replayTitle: '답변 다시보기',
            yourAnswerWas: '당신의 답변:',
            replayQuestion: '질문 다시 듣기',
            replayAnswer: '내 답변 다시 듣기',
        },
        liveResults: {
            title: '실시간 대화 기록',
            user: '나',
            model: 'AI',
        },
        buttons: {
            generateAssessment: 'AI 평가 생성',
            generateLiveAssessment: '실시간 대화 평가 생성',
            download: '모든 오디오 다운로드',
            restart: '다시 시작',
            next: '다음',
            endSession: '세션 종료'
        },
        errors: {
            unsupportedBrowser: '이 브라우저에서는 음성 인식을 지원하지 않습니다.',
            sttError: '음성 인식 중 오류가 발생했습니다.',
            micPermission: '마이크 접근이 거부되었습니다. 브라우저 설정에서 마이크 접근을 허용해주세요.',
            ttsError: '음성 변환 재생에 실패했습니다.',
            geminiError: 'AI와 통신 중 오류가 발생했습니다. 다시 시도해주세요.',
            liveError: '라이브 세션 중 연결 오류가 발생했습니다.',
        },
        loader: {
            generatingQuestions: '개인 맞춤 면접 질문을 생성 중입니다...',
            generatingAssessment: '답변을 분석하고 피드백을 생성 중입니다...',
            generatingLiveAssessment: '대화를 분석하고 피드백을 생성 중입니다...',
        }
    },
    vi: {
        config: {
            title: 'Luyện tập OPIc với AI',
            description: 'Chọn ngôn ngữ phỏng vấn và cấp độ mục tiêu của bạn.',
            selectLanguage: 'Ngôn ngữ phỏng vấn',
            selectLevel: 'Cấp độ mục tiêu',
            selectVoice: 'Chọn giọng nói (Tùy chọn)',
            noVoice: 'Sử dụng mặc định của trình duyệt',
            startInterview: 'Bắt đầu phỏng vấn thử',
            liveTalkDescription: "Hoặc, trò chuyện tự do với AI.",
            startLiveTalk: 'Bắt đầu Trò chuyện trực tiếp',
        },
        interview: {
            question: 'Câu hỏi',
            speakNow: 'Nói ngay bây giờ...',
            listening: 'Đang nghe...',
            processing: 'Đang xử lý câu trả lời của bạn...',
            minTime: 'Thời gian tối thiểu còn lại: ',
            minTimeReached: 'Đã đạt thời gian tối thiểu. Bạn có thể nhấp vào Tiếp theo.',
            maxTime: 'Thời gian còn lại',
            maxTimeReached: 'Hết giờ, đang kết thúc...',
        },
        results: {
            title: 'Kết quả phỏng vấn',
            assessmentTitle: 'Đánh giá của AI',
            estimatedLevel: 'Cấp độ ước tính',
            feedback: 'Phản hồi',
            suggestions: 'Đề xuất cải thiện',
            replayTitle: 'Xem lại câu trả lời của bạn',
            yourAnswerWas: 'Câu trả lời của bạn là:',
            replayQuestion: 'Phát lại câu hỏi',
            replayAnswer: 'Phát lại câu trả lời của bạn',
        },
        liveResults: {
            title: 'Bản ghi cuộc trò chuyện trực tiếp',
            user: 'Bạn',
            model: 'AI',
        },
        buttons: {
            generateAssessment: 'Tạo đánh giá của AI',
            generateLiveAssessment: 'Tạo đánh giá cuộc trò chuyện',
            download: 'Tải xuống tất cả âm thanh',
            restart: 'Làm lại từ đầu',
            next: 'Tiếp theo',
            endSession: 'Kết thúc phiên'
        },
        errors: {
            unsupportedBrowser: 'Trình duyệt này không hỗ trợ nhận dạng giọng nói.',
            sttError: 'Đã xảy ra lỗi với nhận dạng giọng nói.',
            micPermission: 'Quyền truy cập micrô bị từ chối. Vui lòng cho phép truy cập micrô trong cài đặt trình duyệt của bạn.',
            ttsError: 'Không thể phát văn bản thành giọng nói.',
            geminiError: 'Đã xảy ra lỗi với AI. Vui lòng thử lại.',
            liveError: 'Đã xảy ra lỗi kết nối trong phiên trực tiếp.',
        },
        loader: {
            generatingQuestions: 'Đang tạo câu hỏi phỏng vấn được cá nhân hóa của bạn...',
            generatingAssessment: 'Đang phân tích câu trả lời của bạn và tạo phản hồi...',
            generatingLiveAssessment: 'Đang phân tích cuộc trò chuyện của bạn và tạo phản hồi...',
        }
    }
};

export const getUIText = (langCode: LanguageCode) => {
    return UI_TEXT[langCode] || UI_TEXT.en;
};