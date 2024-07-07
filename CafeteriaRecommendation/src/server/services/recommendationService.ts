import { recommendationDB } from "../repositories/recommendationRepository";
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
    console.log("recentComments", recentComments);
    const commentsGroupedByMenuItem = groupCommentsByMenuItem(recentComments);
    console.log("commentsGroupedByMenuItem", commentsGroupedByMenuItem);

    for (const menuItemId in commentsGroupedByMenuItem) {
      const comments = commentsGroupedByMenuItem[menuItemId];
      console.log("comments", comments);
      const { sentiment, score } = performSentimentAnalysis(comments);
      console.log("sentiment", sentiment);
      console.log("score", score);
      const ratings = recentComments
        .filter((comment) => comment.menu_item_id === parseInt(menuItemId, 10))
        .map((comment) => comment.rating);
      console.log("ratings", ratings);
      const averageRating = calculateAverageRating(ratings);
      console.log("averageRating", averageRating);
      await storeSentimentAnalysis(
        parseInt(menuItemId, 10),
        sentiment,
        averageRating,
        score
      );
    }
    console.log("Sentiment Scores Updated....");
  } catch (error) {
    console.error("Error updating sentiment scores:", error);
  }
}

function performSentimentAnalysis(comments: string[]): { sentiment: string; score: number } {
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  comments.forEach((comment) => {
    const result = analyzeComment(comment);
    positiveCount += result.positiveCount;
    negativeCount += result.negativeCount;
    neutralCount += result.neutralCount;
  });

  return calculateOverallSentiment(positiveCount, negativeCount, neutralCount);
}

function analyzeComment(comment: string): {
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
} {
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  const words = comment.toLowerCase().split(/\W+/);
  let adjustedWords = [...words];

  words.forEach((word, index) => {
    if (word === "not" && index < words.length - 1) {
      const nextWord = words[index + 1];
      if (positiveSet.has(nextWord)) {
        negativeCount += 1;
        adjustedWords[index + 1] = "";
      } else if (negativeSet.has(nextWord)) {
        positiveCount += 1;
        adjustedWords[index + 1] = "";
      }
    } else if (intensifierSet.has(word) && index < words.length - 1) {
      const nextWord = words[index + 1];
      if (positiveSet.has(nextWord)) {
        positiveCount += 2;
      } else if (negativeSet.has(nextWord)) {
        negativeCount += 2;
      }
    }
  });

  adjustedWords.forEach((word) => {
    if (positiveSet.has(word)) positiveCount += 1;
    if (negativeSet.has(word)) negativeCount += 1;
    if (neutralSet.has(word)) neutralCount += 1;
  });

  return { positiveCount, negativeCount, neutralCount };
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
  console.log("threeMonthsAgo", threeMonthsAgo);
  return await recommendationDB.getRecentComments(threeMonthsAgo);
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
  score: number
) {
  const existingSentiment = await recommendationDB.getExistingSentiment(
    menuItemId
  );
  console.log("existingSentiment", existingSentiment);

  if (existingSentiment.length > 0) {
    await recommendationDB.updateSentiments(
      menuItemId,
      sentiment,
      averageRating,
      score
    );
  } else {
    await recommendationDB.insertSentiments(
      menuItemId,
      sentiment,
      averageRating,
      score
    );
  }
}

function calculateAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return total / ratings.length;
}
