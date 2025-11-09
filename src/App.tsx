import { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { AuthScreen } from './components/AuthScreen';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { BoardEditor } from './components/BoardEditor';
import { ChildCommunicationMode } from './components/ChildCommunicationMode';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { Board } from './utils/api';
import { createClient } from './utils/supabase/client';
import { Toaster } from './components/ui/sonner';
import { SettingsProvider } from './utils/settings-context';

type Screen = 
  | { type: 'splash' }
  | { type: 'auth' }
  | { type: 'dashboard' }
  | { type: 'editor'; board?: Board }
  | { type: 'view'; board: Board }
  | { type: 'about' }
  | { type: 'contact' };

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>({ type: 'splash' });
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<'caregiver' | 'child'>('caregiver');

  const supabase = createClient();

  // Show splash screen for 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      checkExistingSession();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const type = session.user?.user_metadata?.userType || 'caregiver';
        setAccessToken(session.access_token);
        setUserType(type);
        setCurrentScreen({ type: 'dashboard' });
      } else {
        setCurrentScreen({ type: 'auth' });
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setCurrentScreen({ type: 'auth' });
    }
  };

  const handleAuthenticated = (token: string, type: 'caregiver' | 'child') => {
    setAccessToken(token);
    setUserType(type);
    setCurrentScreen({ type: 'dashboard' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setCurrentScreen({ type: 'auth' });
  };

  const handleCreateBoard = () => {
    setCurrentScreen({ type: 'editor' });
  };

  const handleEditBoard = (board: Board) => {
    setCurrentScreen({ type: 'editor', board });
  };

  const handleViewBoard = (board: Board) => {
    setCurrentScreen({ type: 'view', board });
  };

  const handleBackToDashboard = () => {
    setCurrentScreen({ type: 'dashboard' });
  };

  const handleShowAbout = () => {
    setCurrentScreen({ type: 'about' });
  };

  const handleShowContact = () => {
    setCurrentScreen({ type: 'contact' });
  };

  const renderScreen = () => {
    switch (currentScreen.type) {
      case 'splash':
        return <SplashScreen />;
      
      case 'auth':
        return <AuthScreen onAuthenticated={handleAuthenticated} />;
      
      case 'dashboard':
        if (!accessToken) return <AuthScreen onAuthenticated={handleAuthenticated} />;
        
        return (
          <CaregiverDashboard
            accessToken={accessToken}
            onCreateBoard={handleCreateBoard}
            onEditBoard={handleEditBoard}
            onViewBoard={handleViewBoard}
            onLogout={handleLogout}
            onShowAbout={handleShowAbout}
            onShowContact={handleShowContact}
          />
        );
      
      case 'editor':
        if (!accessToken) return <AuthScreen onAuthenticated={handleAuthenticated} />;
        return (
          <BoardEditor
            accessToken={accessToken}
            board={currentScreen.board}
            onBack={handleBackToDashboard}
            onSave={handleBackToDashboard}
          />
        );
      
      case 'view':
        return (
          <ChildCommunicationMode
            board={currentScreen.board}
            onBack={handleBackToDashboard}
          />
        );
      
      case 'about':
        return <AboutPage onBack={handleBackToDashboard} />;
      
      case 'contact':
        return <ContactPage onBack={handleBackToDashboard} />;
      
      default:
        return <SplashScreen />;
    }
  };

  return (
    <SettingsProvider>
      {renderScreen()}
      <Toaster position="top-center" />
    </SettingsProvider>
  );
}
