// Simple function to detect the general topic of text content
export const detectTopic = (text: string): string => {
  // Define topic keywords
  const topics = {
    Mathematics: [
      "math",
      "equation",
      "calculus",
      "algebra",
      "geometry",
      "theorem",
      "formula",
      "number",
      "function",
      "variable",
    ],
    Physics: [
      "physics",
      "force",
      "energy",
      "motion",
      "gravity",
      "quantum",
      "relativity",
      "particle",
      "wave",
      "velocity",
    ],
    Chemistry: ["chemistry", "element", "compound", "reaction", "molecule", "atom", "bond", "acid", "base", "solution"],
    Biology: ["biology", "cell", "organism", "gene", "protein", "evolution", "species", "ecosystem", "tissue", "dna"],
    "Computer Science": [
      "algorithm",
      "programming",
      "code",
      "software",
      "database",
      "network",
      "computer",
      "data structure",
      "function",
      "variable",
    ],
    History: [
      "history",
      "century",
      "war",
      "revolution",
      "empire",
      "civilization",
      "king",
      "queen",
      "president",
      "ancient",
    ],
    Literature: [
      "literature",
      "novel",
      "poem",
      "author",
      "character",
      "plot",
      "theme",
      "metaphor",
      "narrative",
      "fiction",
    ],
    Philosophy: [
      "philosophy",
      "ethics",
      "logic",
      "metaphysics",
      "epistemology",
      "existence",
      "consciousness",
      "morality",
      "knowledge",
      "reality",
    ],
    Psychology: [
      "psychology",
      "behavior",
      "cognition",
      "emotion",
      "perception",
      "memory",
      "personality",
      "disorder",
      "therapy",
      "mental",
    ],
    Economics: [
      "economics",
      "market",
      "supply",
      "demand",
      "inflation",
      "gdp",
      "economy",
      "price",
      "cost",
      "investment",
    ],
    Art: ["art", "painting", "sculpture", "artist", "canvas", "color", "composition", "gallery", "museum", "aesthetic"],
    Music: ["music", "rhythm", "melody", "harmony", "note", "chord", "scale", "composer", "instrument", "song"],
  }

  // Convert text to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase()

  // Count occurrences of keywords for each topic
  const topicScores: Record<string, number> = {}

  for (const [topic, keywords] of Object.entries(topics)) {
    topicScores[topic] = 0

    for (const keyword of keywords) {
      // Use regex to find whole word matches
      const regex = new RegExp(`\\b${keyword}\\b`, "gi")
      const matches = lowerText.match(regex)

      if (matches) {
        topicScores[topic] += matches.length
      }
    }
  }

  // Find the topic with the highest score
  let bestTopic = "General"
  let highestScore = 0

  for (const [topic, score] of Object.entries(topicScores)) {
    if (score > highestScore) {
      highestScore = score
      bestTopic = topic
    }
  }

  // If the highest score is too low, return "General"
  return highestScore >= 2 ? bestTopic : "General"
}

