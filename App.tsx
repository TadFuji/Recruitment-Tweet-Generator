
import React, { useState, useCallback } from 'react';
import { getTodaysAnniversaries, findRelatedCompanies, generateTweet, selectBestTweetForAnniversary, selectBestTweets } from './services/geminiService';
import Header from './components/Header';
import LoadingIndicator from './components/LoadingIndicator';
import TweetCard from './components/TweetCard';
import { SparklesIcon } from './components/Icons';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [finalTweets, setFinalTweets] = useState<string[]>([]);
  const [rejectedTweets, setRejectedTweets] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFinalTweets([]);
    setRejectedTweets([]);

    try {
      // 1. Get anniversaries
      setLoadingMessage("記念日を調べています...");
      const anniversaries = await getTodaysAnniversaries();
      if (anniversaries.length < 2) {
        throw new Error("紹介可能な記念日が2つ以上見つかりませんでした。");
      }

      // 2. Find 3 companies for each anniversary
      setLoadingMessage("関連企業を探しています...");
      const companiesByAnniversaryPromises = anniversaries.map(async (anniversary) => {
        const companies = await findRelatedCompanies(anniversary);
        if (companies.length === 0) {
            console.warn(`No companies found for anniversary: ${anniversary}`);
        }
        return { anniversary, companies };
      });
      const companiesByAnniversary = await Promise.all(companiesByAnniversaryPromises);

      // 3. Generate up to 3 tweets for each anniversary
      setLoadingMessage("記念日ごとにツイート案を作成しています...");
      const allGeneratedTweets: string[] = [];
      const tweetsByAnniversaryPromises = companiesByAnniversary.map(async ({ anniversary, companies }) => {
          if(companies.length === 0) return { anniversary, tweets: [] };
          
          const tweetPromisesForAnniversary = companies.map(company => generateTweet(anniversary, company));
          const generatedTweets = (await Promise.all(tweetPromisesForAnniversary)).filter(t => t);
          allGeneratedTweets.push(...generatedTweets);
          return { anniversary, tweets: generatedTweets };
      });
      const tweetsByAnniversary = await Promise.all(tweetsByAnniversaryPromises);

      // 4. Select the best tweet for each anniversary
      setLoadingMessage("各記念日のベストツイートを選んでいます...");
      const bestTweetsFromEachAnniversaryPromises = tweetsByAnniversary
        .filter(item => item.tweets.length > 0)
        .map(item => selectBestTweetForAnniversary(item.tweets, item.anniversary));
      
      const bestTweetsFromEachAnniversary = (await Promise.all(bestTweetsFromEachAnniversaryPromises)).filter(t => t);
      
      if (bestTweetsFromEachAnniversary.length < 2) {
        throw new Error("各記念日のベストツイートを十分に選出できませんでした。");
      }

      // 5. Select the final 2 best tweets from the winners
      setLoadingMessage("最終的なベストツイートを選んでいます...");
      const finalBestTweets = await selectBestTweets(bestTweetsFromEachAnniversary);

      let finalSelection: string[];
      if (finalBestTweets.length < 2) {
          // Fallback if AI fails to select 2
          finalSelection = bestTweetsFromEachAnniversary.slice(0, 2);
      } else {
          finalSelection = finalBestTweets;
      }
      setFinalTweets(finalSelection);
      
      // 6. Set rejected tweets
      const rejected = allGeneratedTweets.filter(t => !finalSelection.includes(t));
      setRejectedTweets(rejected);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました。");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <Header />
        <main className="mt-8 flex flex-col items-center">
          {!isLoading && (
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <SparklesIcon />
              ツイートを生成
            </button>
          )}

          {isLoading && <LoadingIndicator message={loadingMessage} />}

          {error && <div className="mt-8 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}

          {finalTweets.length > 0 && (
            <div className="mt-12 w-full">
              <h2 className="text-2xl font-semibold text-center mb-6">生成されたツイート</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {finalTweets.map((tweet, index) => (
                  <TweetCard key={index} tweet={tweet} />
                ))}
              </div>
            </div>
          )}
          
          {rejectedTweets.length > 0 && (
            <div className="mt-12 w-full">
              <h2 className="text-xl font-semibold text-center mb-6 text-gray-500">落選したツイート案</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-70">
                {rejectedTweets.map((tweet, index) => (
                  <TweetCard key={`rejected-${index}`} tweet={tweet} />
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default App;
