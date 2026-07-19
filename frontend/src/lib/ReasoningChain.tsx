import React, { useState, useEffect, useMemo } from 'react';
import { PipelineStep, PIPELINE_STEPS } from '../lib/types';

interface ReasoningChainProps {
    steps: PipelineStep[];
    isDone: boolean;
}

export function ReasoningChain({ steps, isDone }: ReasoningChainProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [elapsed, setElapsed] = useState(0);
    const [dots, setDots] = useState('');

    // Animated dots for "Thinking" state
    useEffect(() => {
        if (isDone) return;
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, [isDone]);

    // Calculate total duration
    useEffect(() => {
        if (isDone || steps.length === 0) return;
        const start = steps[0].timestamp || Date.now();
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - start) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [steps, isDone]);

    // Auto-collapse when done
    useEffect(() => {
        if (isDone) setIsOpen(false);
    }, [isDone]);

    const currentStep = steps.find(s => s.status === 'running') || steps[steps.length - 1];

    return (
        <div className={`w-full max-w-3xl mx-auto mb-8 border rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-500 ${isDone ? 'border-gray-200' : 'border-blue-200 shadow-blue-50 shadow-md'}`}>
            {/* Header / Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                        {!isDone && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${isDone ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                    </div>
                    <span className="font-medium text-gray-700">
                        {isDone ? 'Research Complete' : (currentStep?.message || 'Thinking') + dots}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{isDone ? `Finished in ${elapsed}s` : `${elapsed}s`}</span>
                    <svg
                        className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Steps List */}
            {isOpen && (
                <div className="p-4 space-y-4 bg-white border-t border-gray-100">
                    {steps.map((step, idx) => {
                        const stepDef = PIPELINE_STEPS.find(s => s.id === step.step);
                        const isRunning = step.status === 'running';
                        const isCompleted = step.status === 'done';
                        
                        // Calculate step duration if next step exists
                        const nextStep = steps[idx + 1];
                        const duration = (step.timestamp && nextStep?.timestamp) 
                            ? Math.round((nextStep.timestamp - step.timestamp) / 1000) 
                            : null;

                        return (
                            <div key={idx} className="flex items-start gap-3 transition-opacity duration-300 ease-in-out">
                                <div className="mt-1">
                                    {isRunning ? (
                                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    ) : isCompleted ? (
                                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-200"></div>
                                    )}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm font-medium ${isRunning ? 'text-blue-600' : 'text-gray-700'}`}>
                                            {stepDef?.label || step.message}
                                        </span>
                                        {duration !== null && (
                                            <span className="text-xs text-gray-400">{duration}s</span>
                                        )}
                                    </div>
                                    
                                    {/* Optional: Show detailed message if running */}
                                    {isRunning && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {step.message}
                                        </p>
                                    )}
                                    
                                    {/* Optional: Show data artifacts (like search queries) */}
                                    {step.data && step.step === 'retrieval' && (
                                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono">
                                            Searching: {JSON.stringify(step.data)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}