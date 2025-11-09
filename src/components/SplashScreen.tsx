import { motion } from 'motion/react';
import logo from 'figma:asset/d157766a8345b6fa303858c91e8dfa895bcf80a4.png';

export function SplashScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          className="inline-block mb-6"
        >
          <img 
            src={logo} 
            alt="Expressify Logo" 
            className="w-80 h-auto"
          />
        </motion.div>
        <p className="text-gray-600 max-w-sm mx-auto">
          Empowering communication through visual expression
        </p>
      </motion.div>
    </div>
  );
}
