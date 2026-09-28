/**
 * High-performance intent detector for trivial inputs (greetings, courtesies)
 * Prevents expensive, slow LLM round-trips for simple 1-2 word messages.
 */

const TRIVIAL_GREETING_REGEX =
  /^(?:hi|hello|hey|namaste|heyy+|hii+|hola|greetings|good morning|good afternoon|good evening|howdy|sup|test)[!.,\s]*$/i;

const TRIVIAL_COURTESY_REGEX =
  /^(?:thanks|thank you|thx|ty|bye|goodbye|cya|see ya)[!.,\s]*$/i;

export function isTrivialInput(message: string): boolean {
  if (!message) return true;
  const trimmed = message.trim();
  if (trimmed.length === 0 || trimmed.length <= 1) return true;
  return TRIVIAL_GREETING_REGEX.test(trimmed) || TRIVIAL_COURTESY_REGEX.test(trimmed);
}

export function getTrivialJobSeekerResponse(
  featureSlug: string,
  userProfile?: { full_name?: string; headline?: string; skills?: string[] },
): Record<string, unknown> | null {
  const name = userProfile?.full_name?.trim() || "Candidate";
  const headline = userProfile?.headline?.trim() || "Professional";
  const skills = (userProfile?.skills || []).slice(0, 3).join(", ") || "software and industry practices";

  switch (featureSlug) {
    case "bio-generator":
      return {
        short_bio: `${name} is a results-oriented ${headline} with expertise in ${skills}.`,
        medium_bio: `${name} is a passionate ${headline} based in Nepal, specializing in ${skills}. Dedicated to building high-quality, impactful solutions.`,
        long_bio: `Hello! I am ${name}, a ${headline} with hands-on experience in ${skills}. I thrive on solving complex problems and collaborating with forward-thinking teams. Welcome to my Jagire profile!`,
        tone: "professional",
        keywords: (userProfile?.skills || ["Professional", "Nepal", headline]).slice(0, 5),
      };

    case "resume-optimizer":
      return {
        optimized_sections: [
          {
            section: "Professional Summary",
            original: headline,
            optimized: `Results-driven ${headline} with proven expertise in ${skills}. Adept at designing scalable systems, solving complex challenges, and delivering high-impact solutions.`,
            improvements: ["Added strong action verbs", "Highlighted technical competencies", "Enhanced recruiter keywords"],
          },
        ],
        overall_recommendation: `Your resume has strong foundations in ${skills}. Focus on quantifying your achievements with metrics and tailoring keywords to your target job descriptions.`,
        ats_optimization_score: 85,
      };

    case "cover-letter":
    case "cover-letter-generator":
      return {
        cover_letter: `Dear Hiring Manager,\n\nI am writing to express my interest in joining your team. As a ${headline} with expertise in ${skills}, I am excited about the opportunity to contribute to your organization's mission.\n\nSincerely,\n${name}`,
        tone: "professional",
        word_count: 45,
        key_strengths_highlighted: (userProfile?.skills || ["Problem Solving", "Communication"]).slice(0, 3),
      };

    case "interview-prep":
      return {
        likely_questions: [
          {
            question: `Can you walk me through your background as a ${headline}?`,
            category: "Background",
            difficulty: "easy",
            suggested_approach: "Summarize your core skills and key achievements briefly.",
          },
          {
            question: `How do you apply ${skills.split(", ")[0] || "your technical skills"} in your daily work?`,
            category: "Technical",
            difficulty: "medium",
            suggested_approach: "Provide a concrete project example using the STAR method.",
          },
        ],
        behavioral_scenarios: [],
        technical_topics_to_review: (userProfile?.skills || ["Core Concepts", "System Design"]).slice(0, 3),
        questions_to_ask_interviewer: ["What does a typical day look like for this role?"],
      };

    case "career-roadmap":
    case "career-growth":
      return {
        current_stage: headline,
        target_stage: `Senior ${headline}`,
        milestones: [
          {
            title: `Master ${skills.split(", ")[0] || "Core Technologies"}`,
            timeframe: "1-3 months",
            action_items: ["Build a portfolio project", "Contribute to open source or real-world tasks"],
          },
        ],
        recommended_skills_to_learn: ["System Architecture", "Leadership"],
      };

    default:
      return null;
  }
}

export function getTrivialEmployerResponse(
  featureSlug: string,
  companyName?: string,
): Record<string, unknown> | null {
  const company = companyName || "our organization";

  switch (featureSlug) {
    case "job-description":
    case "job-description-generator":
      return {
        title: "Software Engineer",
        summary: `Join ${company} as a key team member driving innovative solutions.`,
        responsibilities: ["Develop and maintain high quality software", "Collaborate with cross-functional teams"],
        requirements: ["Experience in modern tech stacks", "Strong problem-solving skills"],
        nice_to_have: ["Agile team experience"],
        benefits: ["Competitive salary", "Growth opportunities"],
      };

    case "candidate-matching":
      return {
        match_summary: `Welcome to Candidate Matching for ${company}. Provide a job title or requirements to evaluate candidates.`,
        top_matches: [],
        screening_recommendations: ["Specify target skills and experience level for best results."],
      };

    case "screening-questions":
      return {
        questions: [
          {
            question: `Why are you interested in joining ${company}?`,
            expected_indicators: ["Company research", "Enthusiasm", "Cultural alignment"],
            category: "Culture Fit",
          },
        ],
      };

    default:
      return null;
  }
}
