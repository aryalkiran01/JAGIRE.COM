/* eslint-disable @typescript-eslint/no-explicit-any */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
import { aiGenerateText } from "@/integrations/ai/ai-service";
import { requirePremium } from "@/lib/premium.server";
import { getAiFeature } from "@/lib/employer-ai-features";

// Define response types for each feature
interface CandidateMatchData {
  candidates: Array<{
    name: string;
    score: number;
    strengths: string[];
    gaps: string[];
    recommendation?: string;
  }>;
}

interface ResumeScreeningData {
  qualified: Array<{ name: string; reasons: string[] }>;
  borderline: Array<{ name: string; reasons: string[] }>;
  unqualified: Array<{ name: string; reasons: string[] }>;
}

interface ResumeRankingData {
  rankings: Array<{
    rank: number;
    name: string;
    score: number;
    justification: string;
  }>;
}

interface CandidateSummaryData {
  topSkills: string[];
  experienceHighlights: string[];
  redFlags: string[];
  recommendedNextSteps: string[];
  overallAssessment: string;
}

interface HiringRecommendationData {
  decision: "HIRE" | "NO_HIRE" | "HOLD";
  confidence: number;
  reasons: string[];
  risks: string[];
  nextSteps: string[];
}

interface SuccessPredictionData {
  likelihood: "Low" | "Medium" | "High";
  score: number;
  factors: Array<{ factor: string; impact: "positive" | "negative" | "neutral" }>;
  rationale: string;
}

interface InterviewQuestionsData {
  questions: Array<{
    category: "technical" | "behavioral" | "situational";
    question: string;
    expectedAnswer: string;
    evaluationCriteria: string[];
  }>;
}

interface JobDescriptionData {
  title: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  keywords: string[];
}

interface SkillGapData {
  missingSkills: Array<{
    skill: string;
    priority: "high" | "medium" | "low";
    learningPath: string;
  }>;
  recommendations: string[];
}

interface AIResponse {
  markdown: string; // Keep for backward compatibility
  structured?: Record<string, any>; // New structured data
  featureTitle: string;
}

// Updated prompts that return BOTH markdown AND JSON
const FEATURE_PROMPTS: Record<string, string> = {
  "candidate-match": `You are an AI recruitment assistant. Match candidates to the given job based on skills, experience, and fit.
    
    RESPONSE FORMAT - Return a JSON object with two fields:
    1. "markdown": A detailed markdown report with headings, tables, and formatting
    2. "structured": An object with a "candidates" array where each candidate has:
       - name (string)
       - score (0-100 number)
       - strengths (string array)
       - gaps (string array)
       - recommendation (string)
    
    Example response format:
    {
      "markdown": "# Candidate Match Analysis\\n\\n## John Doe\\n...",
      "structured": {
        "candidates": [
          {
            "name": "John Doe",
            "score": 85,
            "strengths": ["React expertise", "5 years experience"],
            "gaps": ["No TypeScript experience", "Limited cloud knowledge"],
            "recommendation": "Strong candidate, recommend interview"
          }
        ]
      }
    }`,

  "resume-screening": `You are an AI resume screening assistant. Screen the provided resumes against the job requirements.
    
    RESPONSE FORMAT - Return a JSON object with two fields:
    1. "markdown": A detailed markdown screening report
    2. "structured": An object with three arrays (qualified, borderline, unqualified) where each item has:
       - name (string)
       - reasons (string array)`,

  "resume-ranking": `You are an AI resume ranking assistant. Rank the provided candidates from strongest to weakest.
    
    RESPONSE FORMAT - Return a JSON object with two fields:
    1. "markdown": A ranked markdown list with scores and justifications
    2. "structured": An object with a "rankings" array where each item has:
       - rank (number)
       - name (string)
       - score (0-100 number)
       - justification (string)`,

  "candidate-summary": `You are an AI candidate summarizer. Produce a concise professional summary of the candidate.
    
    RESPONSE FORMAT - Return a JSON object with two fields:
    1. "markdown": A formatted markdown summary
    2. "structured": An object with:
       - topSkills (string array)
       - experienceHighlights (string array)
       - redFlags (string array)
       - recommendedNextSteps (string array)
       - overallAssessment (string)`,

  "hiring-recommendation": `You are an AI hiring advisor. Give a data-backed HIRE / NO-HIRE / HOLD recommendation.
    
    RESPONSE FORMAT - Return a JSON object with two fields:
    1. "markdown": A detailed markdown recommendation report
    2. "structured": An object with:
       - decision ("HIRE" | "NO_HIRE" | "HOLD")
       - confidence (0-100 number)
       - reasons (string array)
       - risks (string array)
       - nextSteps (string array)`,

  "candidate-success-prediction": `You are an AI predictive hiring analyst. Predict the candidate's likelihood of on-the-job success.
    
    RESPONSE FORMAT - Return a JSON object with two fields:
    1. "markdown": A detailed markdown prediction report
    2. "structured": An object with:
       - likelihood ("Low" | "Medium" | "High")
       - score (0-100 number)
       - factors (array of {factor, impact: "positive"|"negative"|"neutral"})
       - rationale (string)`,

  "interview-question-generator": `You are an AI interview question generator. Generate role-specific interview questions.
    
    RESPONSE FORMAT - Return a JSON object with two fields:
    1. "markdown": Formatted questions in markdown
    2. "structured": An object with a "questions" array where each question has:
       - category ("technical" | "behavioral" | "situational")
       - question (string)
       - expectedAnswer (string)
       - evaluationCriteria (string array)`,

  "job-description-writer": `You are an AI job description writer. Write a compelling, inclusive, SEO-friendly job description.
    
    RESPONSE FORMAT - Return a JSON object with two fields:
    1. "markdown": The full job description in markdown format
    2. "structured": An object with:
       - title (string)
       - summary (string)
       - responsibilities (string array)
       - requirements (string array)
       - benefits (string array)
       - keywords (string array)`,

  "skill-gap-analysis": `You are an AI skill gap analyst. Compare skills against required/target skills.
    
    RESPONSE FORMAT - Return a JSON object with two fields:
    1. "markdown": A detailed markdown gap analysis
    2. "structured": An object with:
       - missingSkills (array of {skill, priority: "high"|"medium"|"low", learningPath})
       - recommendations (string array)`,

  // Default prompt for other features
  default: `You are Jagire AI, an expert recruitment and HR assistant. Provide clear, actionable, professional answers.
    
    RESPONSE FORMAT - Return a JSON object with two fields:
    1. "markdown": Your detailed response in markdown format
    2. "structured": A simplified object with key data points relevant to the request`,
};

function systemPromptFor(slug: string): string {
  const prompt = FEATURE_PROMPTS[slug] || FEATURE_PROMPTS["default"];
  return (
    prompt +
    "\n\nIMPORTANT: Always return valid JSON with both 'markdown' and 'structured' fields. The 'markdown' field should contain the full formatted response, and 'structured' should contain the key data points in a programmatically accessible format."
  );
}

async function buildEmployerContext(supabase: any, userId: string): Promise<string> {
  const ctx: string[] = [];
  const { data: company } = await supabase
    .from("companies")
    .select("id,name,industry,headquarters,description,website")
    .eq("owner_id", userId)
    .maybeSingle();

  if (company) {
    ctx.push(`## Company\n${JSON.stringify(company)}`);

    const { data: jobs } = await supabase
      .from("jobs")
      .select(
        "id,title,status,required_skills,salary_min,salary_max,location,job_type,applications_count",
      )
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (jobs?.length) {
      ctx.push(`## Posted Jobs\n${JSON.stringify(jobs)}`);
    }

    const { data: apps } = await supabase
      .from("applications")
      .select("id,status,created_at,applicant:profiles(full_name,headline,skills),job:jobs(title)")
      .eq("job.company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(15);

    if (apps?.length) {
      ctx.push(`## Recent Applications\n${JSON.stringify(apps)}`);
    }
  }

  return ctx.join("\n\n");
}

/**
 * Parses the AI response to extract both markdown and structured data
 */
function parseAIResponse(rawResponse: string, featureSlug: string): AIResponse {
  try {
    // Try to parse the entire response as JSON first
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // If we got valid JSON with both fields, return it
      if (parsed.markdown && parsed.structured) {
        return {
          markdown: parsed.markdown,
          structured: parsed.structured,
          featureTitle: "",
        };
      }

      // If only markdown exists, create a basic structured version
      if (parsed.markdown) {
        return {
          markdown: parsed.markdown,
          structured: extractStructuredFromMarkdown(parsed.markdown, featureSlug),
          featureTitle: "",
        };
      }
    }

    // Fallback: treat entire response as markdown
    return {
      markdown: rawResponse,
      structured: extractStructuredFromMarkdown(rawResponse, featureSlug),
      featureTitle: "",
    };
  } catch (error) {
    console.error(`Failed to parse AI response for ${featureSlug}:`, error);
    return {
      markdown: rawResponse,
      structured: {},
      featureTitle: "",
    };
  }
}

/**
 * Fallback function to extract structured data from markdown when JSON parsing fails
 */
function extractStructuredFromMarkdown(markdown: string, featureSlug: string): Record<string, any> {
  // Basic extraction logic based on feature type
  switch (featureSlug) {
    case "candidate-match": {
      const scoreMatch = markdown.match(/score:?\s*(\d+)/i);
      return {
        candidates: [
          {
            name: "Candidate",
            score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
            strengths: [],
            gaps: [],
            recommendation: "See detailed analysis above",
          },
        ],
      };
    }

    case "hiring-recommendation": {
      const decisionMatch = markdown.match(/(HIRE|NO.HIRE|HOLD)/i);
      return {
        decision: decisionMatch ? decisionMatch[1].toUpperCase() : "HOLD",
        confidence: 0,
        reasons: [],
        risks: [],
        nextSteps: [],
      };
    }

    default:
      return {
        summary: markdown.substring(0, 200) + "...",
      };
  }
}

export const runEmployerAiFeature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { featureSlug: string; message: string; format?: "json" | "markdown" };
    if (!i?.featureSlug) throw new Error("Feature slug is required");
    if (!i?.message?.trim()) throw new Error("Message is required");
    return {
      featureSlug: i.featureSlug,
      message: i.message.trim().slice(0, 6000),
      format: i.format || "json", // Default to JSON format
    };
  })
  .handler(async ({ data, context }) => {
    await requirePremium(context.userId);

    const feature = getAiFeature(data.featureSlug);
    if (!feature) throw new Error("Unknown AI feature");

    const employerContext = await buildEmployerContext(context.supabase, context.userId);
    const prompt = [
      `## Employer Context\n${employerContext || "No company profile set up yet."}`,
      `## Request\n${data.message}`,
    ].join("\n\n");

    const rawResponse = await aiGenerateText(
      prompt,
      systemPromptFor(data.featureSlug),
      "qwen3", // Lower temperature for more consistent structured output
      "general",
    );

    // Parse the response
    const parsedResponse = parseAIResponse(rawResponse, data.featureSlug);

    // Return in requested format
    if (data.format === "markdown") {
      return {
        response: parsedResponse.markdown,
        structured: parsedResponse.structured,
        featureTitle: feature.title,
      };
    }

    // Default: return structured data with markdown fallback
    return {
      response: parsedResponse.markdown,
      structured: parsedResponse.structured,
      featureTitle: feature.title,
    };
  });
