import { motion } from 'motion/react';
import { ArrowLeft, Mail, Handshake, Share2, MessageCircle, Instagram, Linkedin } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useSettings } from '../utils/settings-context';
import { useTranslation } from '../utils/translations';
import { ArasaacFooter } from './ArasaacFooter';
import logo from 'figma:asset/d157766a8345b6fa303858c91e8dfa895bcf80a4.png';

interface ContactPageProps {
  onBack: () => void;
}

export function ContactPage({ onBack }: ContactPageProps) {
  const { language } = useSettings();
  const t = useTranslation(language);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 dark:from-[#1a1625] dark:via-[#2d2438] dark:to-[#1a1625] flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-[#2d2438] border-b border-gray-200 dark:border-[#3d3348] sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">{t.contact.backToDashboard}</span>
            <span className="xs:hidden">Back</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Hero Section */}
          <div className="text-center mb-6 sm:mb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-4 sm:mb-6"
            >
              <img 
                src={logo} 
                alt="Expressify Logo" 
                className="w-64 sm:w-80 md:w-96 lg:w-[28rem] h-auto mx-auto"
              />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent px-2">
              {t.contact.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-2">
              {t.contact.intro}
            </p>
          </div>

          {/* General Inquiries Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg overflow-hidden">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1 w-full">
                    <h2 className="text-xl sm:text-2xl text-purple-600 dark:text-purple-400 mb-2 sm:mb-3">
                      {t.contact.generalTitle}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-2 sm:mb-3">
                      {t.contact.generalText}
                    </p>
                    <a 
                      href="mailto:hello@expressify.app"
                      className="inline-flex items-center gap-2 text-base sm:text-lg text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 transition-colors break-all"
                    >
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="break-all">{t.contact.generalEmail}</span>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Partnerships Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-orange-200 dark:border-orange-800 shadow-lg overflow-hidden">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-600 to-orange-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Handshake className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1 w-full">
                    <h2 className="text-xl sm:text-2xl text-orange-600 dark:text-orange-400 mb-2 sm:mb-3">
                      {t.contact.partnershipsTitle}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-2 sm:mb-3">
                      {t.contact.partnershipsText}
                    </p>
                    <a 
                      href="mailto:partnerships@expressify.app"
                      className="inline-flex items-center gap-2 text-base sm:text-lg text-orange-700 dark:text-orange-300 hover:text-orange-800 dark:hover:text-orange-200 transition-colors break-all"
                    >
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="break-all">{t.contact.partnershipsEmail}</span>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stay Connected Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg overflow-hidden">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1 w-full">
                    <h2 className="text-xl sm:text-2xl text-blue-600 dark:text-blue-400 mb-2 sm:mb-3">
                      {t.contact.stayConnectedTitle}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4">
                      {t.contact.stayConnectedText}
                    </p>
                    <div className="flex gap-3 sm:gap-4">
                      <a
                        href="#"
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-pink-600 to-orange-600 flex items-center justify-center text-white hover:scale-110 transition-transform duration-200 shadow-md"
                        aria-label="Instagram"
                      >
                        <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                      </a>
                      <a
                        href="#"
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white hover:scale-110 transition-transform duration-200 shadow-md"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                      </a>
                      <a
                        href="#"
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white hover:scale-110 transition-transform duration-200 shadow-md"
                        aria-label="X (Twitter)"
                      >
                        <FaXTwitter className="w-4 h-4 sm:w-5 sm:h-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Closing Statement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-6 sm:py-8"
          >
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-gradient-to-r from-purple-100 to-orange-100 dark:from-purple-900/30 dark:to-orange-900/30 px-6 sm:px-8 py-3 sm:py-4 rounded-full border-2 border-purple-200 dark:border-purple-700 max-w-[95%] sm:max-w-none">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <p className="text-sm sm:text-base md:text-lg text-gray-800 dark:text-gray-200 text-center">
                {t.contact.closingText}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <ArasaacFooter />
    </div>
  );
}
