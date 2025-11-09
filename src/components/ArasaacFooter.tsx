import arasaacLogo from 'figma:asset/413cf7bc955d2c1f20c5edfcd09f756a2c7d3531.png';
import { useSettings } from '../utils/settings-context';
import { useTranslation } from '../utils/translations';

export function ArasaacFooter() {
  const { language } = useSettings();
  const t = useTranslation(language);

  return (
    <footer className="bg-white dark:bg-[#2d2438] border-t border-gray-200 dark:border-[#3d3348] py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a 
            href="http://www.arasaac.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <img 
              src={arasaacLogo} 
              alt="ARASAAC Logo" 
              className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity"
            />
          </a>
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center max-w-4xl">
            {t.footer.attribution}
          </p>
        </div>
      </div>
    </footer>
  );
}
