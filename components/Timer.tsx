import React, { useState, useEffect } from 'react';
import { getUIText } from '../constants';
import { LanguageCode } from '../types';

interface TimerProps {
    duration: number;
    langCode: LanguageCode;
}

const Timer: React.FC<TimerProps> = ({ duration, langCode }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const UI_TEXT = getUIText(langCode);

    useEffect(() => {
        if (timeLeft <= 0) return;

        const intervalId = setInterval(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft]);
    
    const progress = ((duration - timeLeft) / duration) * 100;

    const timerText = timeLeft > 0 
        ? `${UI_TEXT.interview.minTime.replace(/\d+/, '')} ${timeLeft}s` 
        : UI_TEXT.interview.minTimeReached;

    return (
        <div className="flex items-center gap-2 text-sm text-yellow-400">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>
                {timerText}
            </span>
             <div className="w-24 h-2 bg-slate-600 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
};

export default Timer;
