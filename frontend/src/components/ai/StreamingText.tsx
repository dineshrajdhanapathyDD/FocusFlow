import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface StreamingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

/**
 * Simulates a streaming/typewriter effect for AI responses.
 * Characters appear progressively with a blinking cursor.
 */
export function StreamingText({ text, speed = 20, onComplete, className }: StreamingTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setComplete(false);
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        // Add characters in chunks for more natural feel
        const chunk = Math.min(3, text.length - index);
        setDisplayed(text.slice(0, index + chunk));
        index += chunk;
      } else {
        clearInterval(interval);
        setComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {!complete && (
        <motion.span
          className="inline-block w-0.5 h-4 bg-primary-500 ml-0.5 align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </span>
  );
}
