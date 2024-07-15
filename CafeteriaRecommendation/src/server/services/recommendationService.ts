import { recommendationRepository } from "../repositories/recommendationRepository";
import {
  INTENSIFIERS,
  NEGATIVE_WORDS,
  NEUTRAL_WORDS,
  POSITIVE_WORDS,
} from "../utils/Constants";
import { RatingComment } from "../utils/types";
import { format } from "date-fns";

const positiveSet = new Set(POSITIVE_WORDS);
const negativeSet = new Set(NEGATIVE_WORDS);
const neutralSet = new Set(NEUTRAL_WORDS);
const intensifierSet = new Set(INTENSIFIERS);

export async function updateSentimentScores() {
  try {
    const recentComments = await fetchRecentComments();
    const commentsGroupedByMenuItem = groupCommentsByMenuItem(recentComments);
    for (const menuItemId in commentsGroupedByMenuItem) {
      const comments = commentsGroupedByMenuItem[menuItemId];
      const { sentiment, score, matchedWords } =
        performSentimentAnalysis(comments);
      const ratings = recentComments
        .filter((comment) => comment.menu_item_id === parseInt(menuItemId, 10))
        .map((comment) => comment.rating);
      const averageRating = calculateAverageRating(ratings);
      await storeSentimentAnalysis(
        parseInt(menuItemId, 10),
        sentiment,
        averageRating,
        score,
        matchedWords
      );
    }
    console.log("Sentiment Scores Updated....");
  } catch (error) {
    console.error("Error updating sentiment scores:", error);
  }
}

function performSentimentAnalysis(comments: string[]): {
  sentiment: string;
  score: number;
  matchedWords: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
} {
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  const matchedWords = {
    positive: [] as string[],
    negative: [] as string[],
    neutral: [] as string[],
  };

  comments.forEach((comment) => {
    const result = analyzeComment(comment);
    positiveCount += result.positiveCount;
    negativeCount += result.negativeCount;
    neutralCount += result.neutralCount;
    matchedWords.positive.push(...result.matchedPositiveWords);
    matchedWords.negative.push(...result.matchedNegativeWords);
    matchedWords.neutral.push(...result.matchedNeutralWords);
  });

  return {
    ...calculateOverallSentiment(positiveCount, negativeCount, neutralCount),
    matchedWords,
  };
}

function analyzeComment(comment: string): {
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  matchedPositiveWords: string[];
  matchedNegativeWords: string[];
  matchedNeutralWords: string[];
} {
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  const matchedPositiveWords: string[] = [];
  const matchedNegativeWords: string[] = [];
  const matchedNeutralWords: string[] = [];

  const words = comment.toLowerCase().split(/\W+/);
  let adjustedWords = [...words];

  words.forEach((word, index) => {
    if (word === "not" && index < words.length - 1) {
      const nextWord = words[index + 1];
      if (positiveSet.has(nextWord)) {
        negativeCount += 1;
        adjustedWords[index + 1] = "";
        matchedNegativeWords.push(nextWord);
      } else if (negativeSet.has(nextWord)) {
        positiveCount += 1;
        adjustedWords[index + 1] = "";
        matchedPositiveWords.push(nextWord);
      }
    } else if (intensifierSet.has(word) && index < words.length - 1) {
      const nextWord = words[index + 1];
      if (positiveSet.has(nextWord)) {
        positiveCount += 2;
        matchedPositiveWords.push(word, nextWord);
      } else if (negativeSet.has(nextWord)) {
        negativeCount += 2;
        matchedNegativeWords.push(word, nextWord);
      }
    }
  });

  adjustedWords.forEach((word) => {
    if (positiveSet.has(word)) {
      positiveCount += 1;
      matchedPositiveWords.push(word);
    }
    if (negativeSet.has(word)) {
      negativeCount += 1;
      matchedNegativeWords.push(word);
    }
    if (neutralSet.has(word)) {
      neutralCount += 1;
      matchedNeutralWords.push(word);
    }
  });

  return {
    positiveCount,
    negativeCount,
    neutralCount,
    matchedPositiveWords,
    matchedNegativeWords,
    matchedNeutralWords,
  };
}

function calculateOverallSentiment(
  positiveCount: number,
  negativeCount: number,
  neutralCount: number
): { sentiment: string; score: number } {
  const totalWords = positiveCount + negativeCount + neutralCount;
  if (totalWords === 0) {
    return { sentiment: "Neutral", score: 50 };
  }

  const positiveScore = (positiveCount / totalWords) * 100;
  const negativeScore = (negativeCount / totalWords) * 100;
  const netSentimentScore = positiveScore - negativeScore;

  let sentiment: string;
  if (netSentimentScore >= 80) {
    sentiment = "Highly Recommended";
  } else if (netSentimentScore >= 60) {
    sentiment = "Good";
  } else if (netSentimentScore >= 40) {
    sentiment = "Average";
  } else if (netSentimentScore >= 20) {
    sentiment = "Poor";
  } else {
    sentiment = "Avoid";
  }

  return { sentiment, score: Math.abs(Math.round(netSentimentScore)) };
}

async function fetchRecentComments(): Promise<RatingComment[]> {
  const threeMonthsAgo = format(
    new Date(new Date().setMonth(new Date().getMonth() - 3)),
    "yyyy-MM-dd"
  );
  return await recommendationRepository.getRecentComments(threeMonthsAgo);
}

function groupCommentsByMenuItem(rows: RatingComment[]): {
  [key: number]: string[];
} {
  return rows.reduce((map, row) => {
    if (!map[row.menu_item_id]) {
      map[row.menu_item_id] = [];
    }
    map[row.menu_item_id].push(row.comment);
    return map;
  }, {} as { [key: number]: string[] });
}

async function storeSentimentAnalysis(
  menuItemId: number,
  sentiment: string,
  averageRating: number,
  score: number,
  matchedWords: { positive: string[]; negative: string[]; neutral: string[] }
) {
  const existingSentiment = await recommendationRepository.getExistingSentiment(
    menuItemId
  );

  const positiveWords = matchedWords.positive.join(", ");
  const negativeWords = matchedWords.negative.join(", ");
  const neutralWords = matchedWords.neutral.join(", ");

  if (existingSentiment.length > 0) {
    await recommendationRepository.updateSentiments(
      menuItemId,
      sentiment,
      averageRating,
      score,
      positiveWords,
      negativeWords,
      neutralWords
    );
  } else {
    await recommendationRepository.insertSentiments(
      menuItemId,
      sentiment,
      averageRating,
      score,
      positiveWords,
      negativeWords,
      neutralWords
    );
  }
}

function calculateAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return total / ratings.length;
}
