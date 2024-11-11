import { motion } from 'framer-motion';
import Link from 'next/link';
import CerebrasLogo from '@/public/images/cerebras-logo.png';

import { MessageIcon, VercelIcon } from './icons';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <MessageIcon size={32} />
        </p>
        <h4>
          Ask any question about this research paper and get instant responses!
        </h4>
        <p className="flex items-center justify-center -mt-16">
          Powered by
          <a
            href="https://cerebras.ai/inference"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={CerebrasLogo.src}
              alt="Cerebras Logo"
              className="w-32 object-contain"
            />
          </a>
        </p>
      </div>
    </motion.div>
  );
};
