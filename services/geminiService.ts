
import { GoogleGenAI, Type } from "@google/genai";
import { Company } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TWEET_SEPARATOR = "---END_OF_TWEET---";

export async function getTodaysAnniversaries(): Promise<string[]> {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const dateString = `${year}年${month}月${day}日`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${dateString}は何の日ですか？日本の記念日や年中行事を3つ、簡潔に教えてください。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            anniversaries: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        },
      },
    });

    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    return result.anniversaries || [];
  } catch (error) {
    console.error("Error fetching anniversaries:", error);
    return [];
  }
}

export async function findRelatedCompanies(anniversary: string): Promise<Company[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `「${anniversary}」に関連し、新卒採用を積極的に行っている日本の企業を3社教えてください。企業の正式名称(companyName)と、企業の公式サイトのURL(companyUrl)をください。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  companyName: { type: Type.STRING },
                  companyUrl: { type: Type.STRING }
                },
                required: ["companyName", "companyUrl"]
              }
            }
          }
        },
      },
    });

    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    return result.companies || [];
  } catch (error) {
    console.error(`Error fetching companies for ${anniversary}:`, error);
    return [];
  }
}

export async function generateTweet(anniversary: string, company: Company): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        今日は「${anniversary}」です。
        この記念日に関連する企業として「${company.companyName}」を紹介する、新卒の求職者向けのTwitter投稿を作成してください。

        以下の条件を必ず満たしてください：
        - 記念日と企業の関連性を冒頭で簡潔に説明する。
        - 企業の魅力や事業内容を学生に響くように分かりやすく紹介する。
        - 最後に企業の公式サイトのURL「${company.companyUrl}」を記載する。
        - 全体の文字数を必ず270文字以内にする。
        - 投稿の最後に「#25卒 #26卒 #新卒採用 #企業紹介」のようなハッシュタグを3〜4個含める。
        - 絵文字を適切に使用して、投稿を魅力的にする。
      `,
      config: {
        temperature: 0.8,
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error(`Error generating tweet for ${company.companyName}:`, error);
    return "";
  }
}

export async function selectBestTweetForAnniversary(tweets: string[], anniversary: string): Promise<string> {
  try {
    const allTweets = tweets.map((t, i) => `--- 投稿案 ${i + 1} ---\n${t}`).join('\n\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        今日は「${anniversary}」です。
        以下の複数のTwitter投稿案の中から、新卒の求職者にとって最も魅力的で、興味を引くような投稿を1つだけ選んでください。

        選択基準：
        - 企業の魅力が具体的に伝わるか
        - 学生が自分の将来をイメージしやすいか
        - 文章が簡潔で読みやすいか
        - 記念日との関連付けが自然で面白いか

        投稿案リスト：
        ${allTweets}

        上記のリストの中からベストなものを1つ選び、そのツイートの全文だけを返してください。余計な説明や前置き、「投稿案 X」のようなヘッダーは一切不要です。
      `,
      config: {
        temperature: 0.1,
      },
    });
    
    return response.text.trim();
  } catch (error) {
    console.error(`Error selecting best tweet for ${anniversary}:`, error);
    // Fallback to returning the first tweet if selection fails
    return tweets[0] || "";
  }
}


export async function selectBestTweets(tweets: string[]): Promise<string[]> {
  try {
    const allTweets = tweets.join(`\n${TWEET_SEPARATOR}\n`);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        以下の複数のTwitter投稿案の中から、新卒の求職者にとって最も魅力的で、興味を引くような投稿を2つだけ選んでください。

        選択基準：
        - 企業の魅力が具体的に伝わるか
        - 学生が自分の将来をイメージしやすいか
        - 文章が簡潔で読みやすいか
        - 記念日との関連付けが自然で面白いか

        投稿案リスト：
        ---
        ${allTweets}
        ---

        上記のリストの中からベストなものを2つ選び、そのテキストだけを、区切り文字「${TWEET_SEPARATOR}」を挟んで返してください。余計な説明や前置き、解説は一切不要です。
      `,
      config: {
        temperature: 0.1,
      },
    });
    
    const resultText = response.text.trim();
    return resultText.split(TWEET_SEPARATOR).map(t => t.trim()).filter(t => t.length > 0);
  } catch (error) {
    console.error("Error selecting best tweets:", error);
    // Fallback to returning the first two tweets if selection fails
    return tweets.slice(0, 2);
  }
}
