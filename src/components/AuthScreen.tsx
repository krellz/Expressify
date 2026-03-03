import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Languages, Moon, Sun } from 'lucide-react';
import logo from 'figma:asset/d157766a8345b6fa303858c91e8dfa895bcf80a4.png';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { createClient } from '../utils/supabase/client';
import { api } from '../utils/api';
import { toast } from 'sonner@2.0.3';
import { useSettings } from '../utils/settings-context';
import { useTranslation } from '../utils/translations';

interface AuthScreenProps {
  onAuthenticated: (accessToken: string, userType: 'caregiver' | 'child') => void;
  onGuestMode: () => void;
}

export function AuthScreen({ onAuthenticated, onGuestMode }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'caregiver' | 'child'>('caregiver');
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');

  const supabase = createClient();
  const { language, setLanguage, theme, toggleTheme } = useSettings();
  const t = useTranslation(language);

  const handleDemoLogin = async () => {
    setIsLoading(true);
    const demoEmail = `demo-${Date.now()}@expressify.app`;
    const demoPassword = 'demo1234';
    const demoName = 'Demo User';

    try {
      // Create demo account
      await api.signup(demoEmail, demoPassword, demoName, 'caregiver');

      // Add small delay to ensure user is created
      await new Promise(resolve => setTimeout(resolve, 500));

      // Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        toast.success(t.toast.loginSuccess);
        onAuthenticated(data.session.access_token, 'caregiver');
      }
    } catch (error: any) {
      console.error('Demo login error:', error);
      toast.error('Failed to create demo account. Please try signing up manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        const userType = data.user?.user_metadata?.userType || 'caregiver';
        toast.success(t.toast.loginSuccess);
        onAuthenticated(data.session.access_token, userType);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message?.includes('Invalid login credentials')) {
        toast.error(t.toast.loginFailed);
      } else {
        toast.error(error.message || t.toast.loginFailed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.signup(signupEmail, signupPassword, signupName, userType);

      // Add small delay to ensure user is created in Supabase
      await new Promise(resolve => setTimeout(resolve, 500));

      // Now sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signupEmail,
        password: signupPassword,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        toast.success(t.toast.signupSuccess);
        onAuthenticated(data.session.access_token, userType);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.message?.includes('already registered')) {
        toast.error(t.toast.signupFailed);
      } else {
        toast.error(error.message || t.toast.signupFailed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 dark:from-[#1a1625] dark:via-[#2d2438] dark:to-[#1a1625] flex items-center justify-center p-4">
      {/* Settings Controls - Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Languages className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{language === 'en' ? 'English' : 'Português'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage('en')}>
              🇬🇧 English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('pt')}>
              🇵🇹 Português
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button variant="outline" size="sm" onClick={toggleTheme}>
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <img 
              src={logo} 
              alt="Expressify Logo" 
              className="w-64 h-auto mx-auto"
            />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {language === 'en' 
              ? 'Empowering communication through visual expression' 
              : 'Capacitar a comunicação através da expressão visual'}
          </p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>{language === 'en' ? t.auth.welcomeBack : t.auth.welcomeBack}</CardTitle>
            <CardDescription>
              {language === 'en' 
                ? 'Sign in or create an account to get started' 
                : 'Entre ou crie uma conta para começar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t.auth.signIn}</TabsTrigger>
                <TabsTrigger value="signup">{t.auth.signUp}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t.auth.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t.auth.password}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (language === 'en' ? 'Signing in...' : 'A entrar...') : t.auth.signIn}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>

                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      💡 <strong>{language === 'en' ? 'First time here?' : 'Primeira vez aqui?'}</strong> {language === 'en' ? 'Click the "Sign Up" tab to create an account.' : 'Clique na aba "Registar" para criar uma conta.'}
                    </p>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{t.auth.name}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder={language === 'en' ? 'Your name' : 'O seu nome'}
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t.auth.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t.auth.password}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'en' ? t.auth.accountType : t.auth.accountType}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUserType('caregiver')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          userType === 'caregiver'
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <p className="text-sm">👨‍👩‍👧</p>
                        <p className="text-xs mt-1">{t.auth.caregiver}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserType('child')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          userType === 'child'
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <p className="text-sm">👧</p>
                        <p className="text-xs mt-1">{t.auth.child}</p>
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (language === 'en' ? 'Creating account...' : 'A criar conta...') : t.auth.createAccount}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Demo Account Button */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {language === 'en' ? 'Want to try it first?' : 'Quer experimentar primeiro?'}
          </p>
          <Button
            onClick={handleDemoLogin}
            disabled={isLoading}
            variant="outline"
            className="border-2 border-orange-300 hover:bg-orange-50 hover:border-orange-400 dark:hover:bg-orange-900/20"
          >
            {isLoading 
              ? (language === 'en' ? 'Creating demo...' : 'A criar demo...') 
              : (language === 'en' ? '🎨 Try Demo Account' : '🎨 Experimentar Conta Demo')}
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {language === 'en' 
              ? 'Creates a temporary account for testing' 
              : 'Cria uma conta temporária para testes'}
          </p>
        </div>

        {/* Guest Mode Button */}
        <div className="mt-4 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gradient-to-br from-purple-50 via-white to-orange-50 dark:from-[#1a1625] dark:via-[#2d2438] dark:to-[#1a1625] px-2 text-gray-500 dark:text-gray-400">
                {language === 'en' ? 'or' : 'ou'}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={onGuestMode}
              variant="ghost"
              className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              {language === 'en' ? 'Continue without signing in' : 'Continuar sem iniciar sessão'}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {language === 'en'
                ? 'Data saved locally on this device. Sign in to sync across devices.'
                : 'Dados guardados localmente neste dispositivo. Inicie sessão para sincronizar.'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
