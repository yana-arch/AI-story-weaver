import React from 'react';

const themes = [
  { name: 'zinc', color: '#27272a' },
  { name: 'slate', color: '#334155' },
  { name: 'stone', color: '#292524' },
  { name: 'gray', color: '#262626' },
  { name: 'neutral', color: '#262626' },
  { name: 'red', color: '#dc2626' },
  { name: 'rose', color: '#f43f5e' },
  { name: 'orange', color: '#f97316' },
  { name: 'green', color: '#16a34a' },
  { name: 'blue', color: '#2563eb' },
  { name: 'yellow', color: '#ca8a04' },
  { name: 'violet', color: '#7c3aed' },
];

interface ThemeManagerProps {
  currentTheme: string;
  setTheme: (theme: string) => void;
  onClose: () => void;
}

export const ThemeManager: React.FC<ThemeManagerProps> = ({ currentTheme, setTheme, onClose }) => {
  return (
    <div className="fixed inset-0 bg-background/80 flex justify-center items-center z-50">
      <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">Customize Theme</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            &times;
          </button>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {themes.map((theme) => (
            <div key={theme.name} className="flex flex-col items-center">
              <button
                onClick={() => setTheme(theme.name)}
                className={`w-12 h-12 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card ${currentTheme === theme.name ? 'ring-ring' : 'ring-transparent'}`}
                style={{ backgroundColor: theme.color }}
                aria-label={`Select ${theme.name} theme`}
              ></button>
              <span className="mt-2 text-xs text-muted-foreground capitalize">{theme.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};