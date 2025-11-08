import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BookOpenIcon } from './icons';

interface UserInputProps {
  onSubmit: (content: string) => void;
  onAddChapter: () => void;
}

export const UserInput: React.FC<UserInputProps> = ({ onSubmit, onAddChapter }) => {
  const [content, setContent] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content);
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    const el = textAreaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [content]);

  return (
    <div className="flex-shrink-0 bg-card rounded-lg p-2 md:p-4 flex flex-col md:flex-row items-start md:items-end gap-2">
      <textarea
        ref={textAreaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Viết phần tiếp theo của câu chuyện ở đây..."
        className="w-full max-h-96 bg-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        rows={1}
        aria-label="Viết phần tiếp theo của câu chuyện ở đây..."
      />
      <div className="flex gap-2 self-end">
        <button
          type="button"
          onClick={onAddChapter}
          className="p-2 bg-secondary text-white font-semibold rounded-md hover:bg-secondary/80 transition-colors"
          title="Add Chapter Break"
        >
          <BookOpenIcon className="w-5 h-5" />
        </button>
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:bg-muted disabled:cursor-not-allowed"
        >
          Thêm
        </button>
      </div>
    </div>
  );
};

UserInput.displayName = 'UserInput';
