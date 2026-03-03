import React, { useEffect } from 'react';

interface SnackbarProps {
    message: string;
    type: 'success' | 'error';
    isOpen: boolean;
    onClose: () => void;
    duration?: number;
}

const Snackbar: React.FC<SnackbarProps> = ({ message, type, isOpen, onClose, duration = 4000 }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    if (!isOpen) return null;

    const bgColor = type === 'success' ? 'bg-[#71b48d]' : 'bg-[#e74c3c]'; // Using new sage-primary for success

    return (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-fade-in min-w-[300px]`}>
            {type === 'success' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}
            <span className="font-semibold text-sm tracking-wide">{message}</span>
            <button onClick={onClose} className="ml-auto opacity-80 hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default Snackbar;
