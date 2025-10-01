
import React from 'react';

interface LoaderProps {
    text: string;
}

const Loader: React.FC<LoaderProps> = ({ text }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="w-16 h-16 border-4 border-sky-400 border-dashed rounded-full animate-spin"></div>
            <p className="mt-4 text-lg text-slate-300">{text}</p>
        </div>
    );
};

export default Loader;
