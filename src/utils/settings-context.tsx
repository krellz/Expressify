import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'pt';
type Theme = 'light' | 'dark';

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [theme, setThemeState] = useState<Theme>('light');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('expressify-language') as Language;
    const savedTheme = localStorage.getItem('expressify-theme') as Theme;
    
    if (savedLanguage) {
      setLanguageState(savedLanguage);
    }
    
    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('expressify-language', lang);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('expressify-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <SettingsContext.Provider value={{ language, setLanguage, theme, setTheme, toggleTheme }}>
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

// Helper function to get ARASAAC API URL with language
export function getArasaacApiUrl(language: Language, searchTerm: string) {
  return `https://api.arasaac.org/v1/pictograms/${language}/search/${encodeURIComponent(searchTerm)}`;
}

// Helper function to get pictogram image URL
export function getPictogramImageUrl(id: number) {
  return `https://static.arasaac.org/pictograms/${id}/${id}_500.png`;
}
