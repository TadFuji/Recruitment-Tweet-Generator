
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-6">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
        今日の企業紹介ツイート生成AI
      </h1>
      <p className="text-center text-gray-400 mt-3">
        記念日から関連企業を見つけ、新卒向けの紹介ツイートを2つ作成します
      </p>
    </header>
  );
};

export default Header;
