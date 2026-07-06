import React, { useState, useEffect } from 'react';

export const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="text-gray-400 hover:text-white transition-colors text-sm"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};