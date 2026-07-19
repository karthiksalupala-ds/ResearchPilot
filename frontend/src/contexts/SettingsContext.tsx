import React, { createContext, useContext, useState, useEffect } from 'react';

type ResearchMode = 'academic' | 'journalistic' | 'skeptic';

interface SettingsContextType {
    researchMode: ResearchMode;
    setResearchMode: (mode: ResearchMode) => void;
    compactView: boolean;
    setCompactView: (compact: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [researchMode, setResearchMode] = useState<ResearchMode>(() => {
        return (localStorage.getItem('researchMode') as ResearchMode) || 'academic';
    });
    const [compactView, setCompactView] = useState(() => {
        return localStorage.getItem('compactView') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('researchMode', researchMode);
    }, [researchMode]);

    useEffect(() => {
        localStorage.setItem('compactView', String(compactView));
    }, [compactView]);

    return (
        <SettingsContext.Provider value={{ researchMode, setResearchMode, compactView, setCompactView }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
