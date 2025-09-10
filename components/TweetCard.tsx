
import React, { useState } from 'react';
import { ClipboardIcon, CheckIcon } from './Icons';

interface TweetCardProps {
  tweet: string;
}

const TweetCard: React.FC<TweetCardProps> = ({ tweet }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tweet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl shadow-lg p-6 relative flex flex-col h-full">
      <pre className="text-gray-200 whitespace-pre-wrap font-sans text-base leading-relaxed flex-grow">{tweet}</pre>
      <div className="mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-colors"
        >
          {copied ? (
            <>
              <CheckIcon />
              コピーしました！
            </>
          ) : (
            <>
              <ClipboardIcon />
              ツイートをコピー
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TweetCard;
