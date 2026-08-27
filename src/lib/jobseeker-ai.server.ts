/* eslint-disable @typescript-eslint/no-explicit-any */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
import { aiGenerateJsonValidated } from "@/integrations/ai/ai-service";
import { requirePremium } from "@/lib/premium.server";
import { getJobSeekerAiFeature } from "@/lib/jobseeker-ai-features";
import { z } from "zod";
import {
  coverLetterGeneratorSchema,
  resumeOptimizerSchema,
  linkedinOptimizerSchema,
  personalBrandSchema,
  bioGeneratorSchema,
  jobMatchAnalyzerSchema,
  jobSearchStrategySchema,
  salaryAnalyzerSchema,
  offerEvaluatorSchema,
  relocationAdvisorSchema,
  interviewPrepSchema,
  mockInterviewFeedbackSchema,
  behavioralQuestionPrepSchema,
  technicalInterviewPrepSchema,
  skillRoadmapSchema,
  careerTransitionPlannerSchema,
  mentorshipMatcherSchema,
  goalPlannerSchema,
  courseRecommenderSchema,
  certificationAdvisorSchema,
  projectIdeaGeneratorSchema,
  portfolioOptimizerSchema,
} from "@/integrations/ai/jobseeker-ai-schemas";

// ── Type Definitions ─────────────────────────────────────────────────────────

interface FeatureConfig {
  schema: z.ZodType<any>;
  systemPrompt: string;
  contextFields?: string[];
  temperature?: number;
}

type SerializableJsonValue =
  | string
  | number
  | boolean
  | null
  | SerializableJsonValue[]
  | { [key: string]: SerializableJsonValue };

type SerializableJsonObject = { [key: string]: SerializableJsonValue };

// ── Prompt Templates ─────────────────────────────────────────────────────────

const PROMPTS = {
  COVER_LETTER: `You are an expert cover letter writer with 15+ years of experience in recruitment and career coaching.

Create a compelling, tailored cover letter that:
1. Opens with a strong hook that grabs attention
2. Highlights 3-4 specific achievements relevant to the role
3. Demonstrates research about the company
4. Uses a professional but engaging tone
5. Includes a clear call to action

Best practices:
- Keep it under 400 words
- Use active voice
- Quantify achievements where possible
- Avoid clichés and generic phrases
- Match the tone to the company culture

Return JSON with:
{
  "cover_letter": string (complete, ready-to-send letter),
  "tone": string (professional | conversational | enthusiastic | formal),
  "word_count": number,
  "key_strengths_highlighted": string[] (3-5 strengths emphasized)
}`,

  RESUME_OPTIMIZER: `You are an ATS (Applicant Tracking System) resume optimization expert.

Analyze the provided resume content and optimize it for:
1. ATS parsing accuracy
2. Keyword optimization
3. Impact and action verbs
4. Quantifiable achievements
5. Clear formatting and structure

Optimization guidelines:
- Replace weak verbs with strong action verbs
- Add metrics and numbers where possible
- Remove first-person pronouns
- Use industry-standard terminology
- Keep bullet points concise and scannable
- Ensure keywords match job descriptions

Return JSON with:
{
  "optimized_sections": [
    {
      "section": string (summary | experience | skills | education),
      "original": string,
      "optimized": string,
      "improvements": string[] (specific changes made)
    }
  ],
  "overall_recommendation": string,
  "ats_optimization_score": number (0-100)
}`,

  LINKEDIN_OPTIMIZER: `You are a LinkedIn profile optimization specialist who helps professionals get discovered by recruiters.

Optimize the profile for:
1. Search visibility (SEO)
2. Recruiter appeal
3. Professional branding
4. Engagement and networking
5. Completeness and credibility

Key areas to improve:
- Headline: Make it keyword-rich and compelling (120 characters max)
- About section: Tell a story, highlight achievements, include call-to-action
- Skills: Add relevant, searchable skills (up to 50)
- Experience: Use action verbs, quantify results
- Profile completeness: Identify missing sections

Return JSON with:
{
  "headline_suggestions": string[] (3-5 options),
  "about_suggestions": [
    {
      "original": string,
      "optimized": string
    }
  ],
  "skills_to_add": string[] (5-10 skills),
  "experience_improvements": [
    {
      "role": string,
      "suggestion": string
    }
  ],
  "profile_completeness_score": number (0-100)
}`,

  PERSONAL_BRAND: `You are a personal branding expert who helps professionals define and communicate their unique value proposition.

Help create a compelling personal brand that:
1. Clearly articulates unique value
2. Differentiates from competitors
3. Resonates with target audience
4. Is authentic and memorable
5. Can be consistently communicated

Brand elements to develop:
- Core brand statement (1-2 sentences)
- Key differentiators (what makes them unique)
- Elevator pitch (30-second introduction)
- Online presence strategy
- Content pillars and themes

Return JSON with:
{
  "brand_statement": string,
  "key_differentiators": string[] (3-5),
  "elevator_pitch": string,
  "online_presence_tips": string[] (5-8),
  "content_strategy": string[] (5-8 content ideas)
}`,

  BIO_GENERATOR: `You are a professional bio writer who creates engaging, authentic biographies.

Create three versions of a professional bio:
1. Short (50 words) - for social media, email signatures
2. Medium (150 words) - for LinkedIn, company websites
3. Long (300 words) - for speaking engagements, full profiles

Bio guidelines:
- Start with current role and core expertise
- Include notable achievements and results
- Show personality while staying professional
- Use specific details over generic claims
- End with a personal touch or value proposition

Return JSON with:
{
  "short_bio": string,
  "medium_bio": string,
  "long_bio": string,
  "tone": string,
  "keywords": string[] (searchable terms included)
}`,

  JOB_MATCH: `You are a job matching expert who evaluates candidate-job fit using advanced analysis.

Analyze the match between the candidate's profile and available positions:
1. Skills alignment (technical and soft skills)
2. Experience level match
3. Industry alignment
4. Career trajectory fit
5. Cultural fit indicators

Scoring criteria:
- 90-100: Excellent match
- 75-89: Good match with minor gaps
- 60-74: Moderate match with notable gaps
- Below 60: Poor match

Return JSON with:
{
  "matches": [
    {
      "job_title": string,
      "company": string,
      "match_score": number (0-100),
      "matching_skills": string[],
      "missing_skills": string[],
      "recommendation": string (why they should/shouldn't apply)
    }
  ],
  "summary": string
}`,

  JOB_SEARCH_STRATEGY: `You are a job search strategist who creates systematic, effective job hunting plans.

Develop a comprehensive job search strategy:
1. Define target roles and positions
2. Identify relevant search keywords
3. Create Boolean search strings
4. Map sourcing channels (job boards, networking, referrals)
5. Build networking strategy
6. Create weekly action plan

Strategy guidelines:
- Focus on quality over quantity
- Prioritize networking (60-70% of jobs found through networking)
- Use multiple sourcing channels
- Set measurable weekly goals
- Track applications and follow-ups

Return JSON with:
{
  "target_roles": string[] (3-5 roles),
  "search_keywords": string[] (10-15 keywords),
  "boolean_search_strings": string[] (5-8 examples),
  "sourcing_channels": [
    {
      "channel": string,
      "strategy": string
    }
  ],
  "networking_tips": string[] (5-8 tips),
  "weekly_action_plan": string[] (7 actions)
}`,

  SALARY_ANALYZER: `You are a compensation analyst who provides accurate salary insights and negotiation strategies.

Analyze salary data considering:
1. Role and responsibilities
2. Experience level
3. Location (Nepal market focus)
4. Industry standards
5. Current market trends

IMPORTANT: Use NPR (Rs.) for all salary figures unless explicitly stated otherwise.

Salary ranges (Nepal market):
- Junior (0-2 years): Rs. 30,000 - Rs. 60,000/month
- Mid-level (3-5 years): Rs. 60,000 - Rs. 120,000/month
- Senior (5-10 years): Rs. 120,000 - Rs. 250,000/month
- Lead/Manager: Rs. 250,000 - Rs. 500,000+/month

Return JSON with:
{
  "market_range": {
    "low": number,
    "mid": number,
    "high": number,
    "currency": string
  },
  "your_market_value": number,
  "negotiation_leverage": string[],
  "benchmark_comparisons": [
    {
      "role": string,
      "avg_salary": number,
      "location": string
    }
  ],
  "negotiation_script": string
}`,

  OFFER_EVALUATOR: `You are a job offer evaluation expert who helps candidates make informed decisions.

Evaluate the offer across multiple dimensions:
1. Salary and compensation package
2. Benefits and perks
3. Growth opportunities
4. Work-life balance
5. Company culture and stability
6. Location and commute

Evaluation guidelines:
- Consider total compensation, not just salary
- Compare against market rates
- Evaluate long-term career impact
- Assess non-monetary benefits
- Consider personal priorities

Return JSON with:
{
  "overall_score": number (0-100),
  "salary_rating": number (0-100),
  "benefits_rating": number (0-100),
  "growth_rating": number (0-100),
  "work_life_balance_rating": number (0-100),
  "pros": string[] (5-8 advantages),
  "cons": string[] (5-8 disadvantages),
  "negotiation_points": string[] (3-5 areas to negotiate),
  "recommendation": string
}`,

  RELOCATION_ADVISOR: `You are a relocation advisor who helps professionals evaluate moving opportunities.

Compare locations considering:
1. Cost of living breakdown
2. Salary adjustments needed
3. Quality of life factors
4. Job market outlook
5. Cultural and lifestyle considerations

Comparison metrics:
- Housing costs (rent/purchase)
- Transportation expenses
- Food and groceries
- Healthcare costs
- Entertainment and lifestyle
- Tax implications

Return JSON with:
{
  "cost_of_living_comparison": [
    {
      "category": string,
      "current": string,
      "target": string
    }
  ],
  "salary_adjustment": string (percentage needed),
  "lifestyle_factors": string[] (5-8 factors),
  "job_market_outlook": string,
  "recommendations": string[] (5-8 recommendations)
}`,

  INTERVIEW_PREP: `You are an interview preparation coach who prepares candidates for successful interviews.

Generate comprehensive interview preparation:
1. Likely questions (technical, behavioral, situational)
2. Preparation checklist
3. Key talking points
4. Common mistakes to avoid
5. Company-specific insights

Question types:
- Technical: Role-specific knowledge and skills
- Behavioral: Past experiences and outcomes (STAR method)
- Situational: Hypothetical scenarios and problem-solving

Preparation guidelines:
- Research company and role thoroughly
- Prepare specific examples using STAR method
- Practice answering out loud
- Prepare questions to ask interviewer
- Understand company culture and values

Return JSON with:
{
  "likely_questions": [
    {
      "question": string,
      "category": "technical" | "behavioral" | "situational",
      "difficulty": "easy" | "medium" | "hard",
      "guidance": string (how to approach)
    }
  ],
  "preparation_checklist": string[],
  "key_talking_points": string[],
  "red_flags_to_avoid": string[]
}`,

  MOCK_INTERVIEW_FEEDBACK: `You are an interview coach providing detailed feedback on interview answers.

Evaluate each answer for:
1. Relevance and completeness
2. Structure (STAR method)
3. Specificity and concreteness
4. Professional impact
5. Areas for improvement

Feedback guidelines:
- Be constructive and encouraging
- Provide specific improvements
- Offer alternative phrasings
- Highlight strengths
- Suggest practice exercises

Return JSON with:
{
  "overall_score": number (0-100),
  "strengths": string[],
  "areas_for_improvement": string[],
  "specific_feedback": [
    {
      "question": string,
      "your_answer_summary": string,
      "feedback": string,
      "improved_answer": string
    }
  ],
  "next_steps": string[]
}`,

  BEHAVIORAL_PREP: `You are a behavioral interview coach specializing in STAR method preparation.

Create STAR (Situation, Task, Action, Result) stories that:
1. Address common behavioral questions
2. Demonstrate key competencies
3. Use specific, quantifiable examples
4. Highlight leadership and teamwork
5. Show problem-solving abilities

Common behavioral themes:
- Leadership and initiative
- Conflict resolution
- Failure and learning
- Teamwork and collaboration
- Handling pressure
- Adaptability and change

STAR story guidelines:
- Situation: Set context in 1-2 sentences
- Task: Describe responsibility clearly
- Action: Explain specific actions taken (most important)
- Result: Quantify outcome and impact

Return JSON with:
{
  "star_stories": [
    {
      "question": string,
      "situation": string,
      "task": string,
      "action": string,
      "result": string
    }
  ],
  "tips": string[]
}`,

  TECHNICAL_INTERVIEW_PREP: `You are a technical interview coach preparing candidates for technical assessments.

Create a comprehensive preparation plan covering:
1. Core technical topics to review
2. Practice problems and approaches
3. Key concepts to master
4. Learning resources
5. Problem-solving strategies

Technical areas to assess:
- Data structures and algorithms
- System design
- Language-specific concepts
- Problem-solving approach
- Code quality and best practices

Preparation guidelines:
- Start with fundamentals
- Practice daily (at least 1-2 hours)
- Focus on problem-solving patterns
- Review past interview questions
- Build projects to demonstrate skills

Return JSON with:
{
  "topics_to_review": string[],
  "practice_problems": [
    {
      "topic": string,
      "problem": string,
      "approach": string
    }
  ],
  "key_concepts": string[],
  "resources": [
    {
      "name": string,
      "url": string
    }
  ]
}`,

  SKILL_ROADMAP: `You are a skill development planner who creates personalized learning roadmaps.

Design a skill development plan that:
1. Assesses current skill levels
2. Sets clear learning goals
3. Identifies learning resources
4. Establishes milestones
5. Creates accountability

Skill categories:
- Technical skills (programming languages, tools)
- Soft skills (communication, leadership)
- Domain knowledge (industry-specific)
- Professional skills (project management, analytics)

Learning resource types:
- Online courses (Udemy, Coursera, edX)
- Books and documentation
- Practice projects
- Mentorship and coaching
- Community involvement

Return JSON with:
{
  "current_assessment": string,
  "target_skills": [
    {
      "skill": string,
      "current_level": string,
      "target_level": string,
      "priority": "high" | "medium" | "low",
      "learning_resources": string[],
      "estimated_time": string
    }
  ],
  "milestones": [
    {
      "milestone": string,
      "target_date": string,
      "criteria": string[]
    }
  ],
  "summary": string
}`,

  CAREER_TRANSITION: `You are a career transition planner who helps professionals change careers successfully.

Plan a career transition covering:
1. Transferable skills identification
2. Skills gap analysis
3. Transition timeline
4. Target roles identification
5. Risk assessment

Transition phases:
- Phase 1: Self-assessment (1-2 months)
- Phase 2: Skill building (3-6 months)
- Phase 3: Networking (ongoing)
- Phase 4: Job search (2-3 months)
- Phase 5: Transition (1-3 months)

Return JSON with:
{
  "transition_feasibility": string,
  "transferable_skills": string[],
  "skills_to_acquire": string[],
  "transition_timeline": [
    {
      "phase": string,
      "duration": string,
      "actions": string[]
    }
  ],
  "recommended_roles": [
    {
      "title": string,
      "why": string
    }
  ],
  "risks": string[]
}`,

  MENTORSHIP: `You are a mentorship advisor who helps professionals find and engage with mentors.

Develop a mentorship strategy:
1. Define mentorship goals
2. Identify mentor criteria
3. Locate potential mentors
4. Create outreach strategy
5. Build relationship effectively

Mentor types:
- Career mentors (advancement guidance)
- Technical mentors (skill development)
- Industry mentors (domain expertise)
- Peer mentors (mutual support)
- Reverse mentors (new perspectives)

Outreach best practices:
- Personalize each message
- Show genuine interest
- Offer value in return
- Be specific about ask
- Follow up respectfully

Return JSON with:
{
  "mentor_criteria": string[],
  "suggested_mentor_types": [
    {
      "type": string,
      "why": string,
      "where_to_find": string
    }
  ],
  "networking_strategy": string[],
  "outreach_templates": [
    {
      "scenario": string,
      "template": string
    }
  ]
}`,

  GOAL_PLANNER: `You are a career goal planner who helps professionals set and achieve meaningful goals.

Create a structured goal plan:
1. Define specific goals (SMART criteria)
2. Break into milestones
3. Establish success metrics
4. Set quarterly priorities
5. Create accountability system

Goal categories:
- Career advancement (promotions, new roles)
- Skill development (technical, soft skills)
- Networking (connections, relationships)
- Personal growth (confidence, work-life balance)

SMART goal guidelines:
- Specific: Clear and well-defined
- Measurable: Quantifiable outcomes
- Achievable: Realistic given constraints
- Relevant: Aligned with career vision
- Time-bound: Clear deadlines

Return JSON with:
{
  "goals": [
    {
      "goal": string,
      "category": "career" | "skill" | "networking" | "personal",
      "timeline": string,
      "milestones": string[],
      "success_metrics": string[]
    }
  ],
  "quarterly_priorities": string[],
  "accountability_tips": string[]
}`,

  COURSE_RECOMMENDER: `You are a learning advisor who recommends courses and creates learning paths.

Recommend courses based on:
1. Current skill level
2. Career goals
3. Learning style preferences
4. Time availability
5. Budget considerations

Course evaluation criteria:
- Provider reputation (Coursera, Udemy, edX, Pluralsight)
- Instructor expertise
- Course content and structure
- Student reviews and ratings
- Practical application
- Certification value

Learning path guidelines:
- Progressive difficulty
- Prerequisites clearly stated
- Hands-on practice included
- Project-based learning
- Community support

IMPORTANT: 
- Only include courses with complete information
- Do not include partial or incomplete course objects
- If you can't provide complete information for a course, skip it entirely

Return JSON with:
{
  "courses": [
    {
      "title": string,
      "provider": string,
      "url": string,
      "level": string,
      "skills_gained": string[],
      "estimated_hours": string (e.g., "40 hours", "3 months"),
      "why": string
    }
  ],
  "learning_path": string[],
  "summary": string
}`,

  CERTIFICATION_ADVISOR: `You are a certification advisor who recommends valuable professional certifications.

Recommend certifications considering:
1. Industry recognition
2. Career impact
3. Cost and time investment
4. Prerequisites
5. Maintenance requirements

Certification types:
- Technical (AWS, Google, Microsoft)
- Professional (PMP, Scrum, Six Sigma)
- Industry-specific (finance, healthcare)
- Skill-based (data science, cybersecurity)

Evaluation criteria:
- ROI (return on investment)
- Market demand
- Career advancement potential
- Difficulty level
- Renewal requirements

Return JSON with:
{
  "recommended_certifications": [
    {
      "name": string,
      "provider": string,
      "level": string,
      "cost_estimate": string,
      "prep_time": string,
      "career_impact": string,
      "prerequisite": string
    }
  ],
  "priority_order": string[],
  "summary": string
}`,

  PROJECT_IDEA_GENERATOR: `You are a portfolio project advisor who generates impressive project ideas.

Generate project ideas that:
1. Demonstrate relevant skills
2. Solve real problems
3. Showcase creativity
4. Are feasible to complete
5. Add portfolio value

Project categories:
- Web applications (full-stack, frontend, backend)
- Mobile apps (iOS, Android, cross-platform)
- Data projects (analysis, visualization, ML)
- APIs and integrations
- Open source contributions
- Automation tools

Project evaluation:
- Technical complexity
- Business relevance
- Learning value
- Impressiveness factor
- Time to complete

Return JSON with:
{
  "projects": [
    {
      "title": string,
      "description": string,
      "skills_demonstrated": string[],
      "difficulty": "beginner" | "intermediate" | "advanced",
      "estimated_time": string,
      "tech_stack": string[]
    }
  ],
  "summary": string
}`,

  PORTFOLIO_OPTIMIZER: `You are a portfolio optimization expert who improves professional portfolios.

Optimize portfolio for:
1. Visual appeal and UX
2. Content quality and relevance
3. Project selection and presentation
4. Search engine optimization
5. Conversion (getting interviews/hires)

Portfolio sections to evaluate:
- Hero/Introduction section
- About me
- Projects showcase
- Skills display
- Experience timeline
- Contact/CTA
- Blog/Content (if applicable)

Improvement guidelines:
- Quality over quantity in projects
- Clear problem-solution-outcome structure
- Metrics and results highlighted
- Mobile-responsive design
- Fast loading speed
- Easy navigation

Return JSON with:
{
  "portfolio_assessment": string,
  "improvements": [
    {
      "section": string,
      "current_state": string,
      "recommendation": string
    }
  ],
  "projects_to_add": string[],
  "presentation_tips": string[],
  "overall_score": number (0-100)
}`,
};

// ── Feature Configurations ──────────────────────────────────────────────────

const FEATURE_CONFIGS: Record<string, FeatureConfig> = {
  "cover-letter-generator": {
    schema: coverLetterGeneratorSchema,
    systemPrompt: PROMPTS.COVER_LETTER,
    contextFields: ["profile", "resume", "applications"],
  },
  "resume-optimizer": {
    schema: resumeOptimizerSchema,
    systemPrompt: PROMPTS.RESUME_OPTIMIZER,
    contextFields: ["profile", "resume", "activeJobs"],
  },
  "linkedin-optimizer": {
    schema: linkedinOptimizerSchema,
    systemPrompt: PROMPTS.LINKEDIN_OPTIMIZER,
    contextFields: ["profile", "resume"],
  },
  "personal-brand": {
    schema: personalBrandSchema,
    systemPrompt: PROMPTS.PERSONAL_BRAND,
    contextFields: ["profile", "resume"],
  },
  "bio-generator": {
    schema: bioGeneratorSchema,
    systemPrompt: PROMPTS.BIO_GENERATOR,
    contextFields: ["profile", "resume"],
  },
  "job-match-analyzer": {
    schema: jobMatchAnalyzerSchema,
    systemPrompt: PROMPTS.JOB_MATCH,
    contextFields: ["profile", "resume", "activeJobs"],
  },
  "job-search-strategy": {
    schema: jobSearchStrategySchema,
    systemPrompt: PROMPTS.JOB_SEARCH_STRATEGY,
    contextFields: ["profile", "resume", "activeJobs"],
  },
  "salary-analyzer": {
    schema: salaryAnalyzerSchema,
    systemPrompt: PROMPTS.SALARY_ANALYZER,
    contextFields: ["profile", "resume", "activeJobs"],
  },
  "offer-evaluator": {
    schema: offerEvaluatorSchema,
    systemPrompt: PROMPTS.OFFER_EVALUATOR,
    contextFields: ["profile", "activeJobs"],
  },
  "relocation-advisor": {
    schema: relocationAdvisorSchema,
    systemPrompt: PROMPTS.RELOCATION_ADVISOR,
    contextFields: ["profile", "activeJobs"],
  },
  "interview-prep": {
    schema: interviewPrepSchema,
    systemPrompt: PROMPTS.INTERVIEW_PREP,
    contextFields: ["profile", "resume", "activeJobs"],
  },
  "mock-interview-feedback": {
    schema: mockInterviewFeedbackSchema,
    systemPrompt: PROMPTS.MOCK_INTERVIEW_FEEDBACK,
    contextFields: ["profile", "resume"],
  },
  "behavioral-question-prep": {
    schema: behavioralQuestionPrepSchema,
    systemPrompt: PROMPTS.BEHAVIORAL_PREP,
    contextFields: ["profile", "resume"],
  },
  "technical-interview-prep": {
    schema: technicalInterviewPrepSchema,
    systemPrompt: PROMPTS.TECHNICAL_INTERVIEW_PREP,
    contextFields: ["profile", "resume"],
  },
  "skill-roadmap": {
    schema: skillRoadmapSchema,
    systemPrompt: PROMPTS.SKILL_ROADMAP,
    contextFields: ["profile", "resume"],
  },
  "career-transition-planner": {
    schema: careerTransitionPlannerSchema,
    systemPrompt: PROMPTS.CAREER_TRANSITION,
    contextFields: ["profile", "resume", "activeJobs"],
  },
  "mentorship-matcher": {
    schema: mentorshipMatcherSchema,
    systemPrompt: PROMPTS.MENTORSHIP,
    contextFields: ["profile"],
  },
  "goal-planner": {
    schema: goalPlannerSchema,
    systemPrompt: PROMPTS.GOAL_PLANNER,
    contextFields: ["profile", "resume"],
  },
  "course-recommender": {
    schema: courseRecommenderSchema,
    systemPrompt: PROMPTS.COURSE_RECOMMENDER,
    contextFields: ["profile", "resume"],
  },
  "certification-advisor": {
    schema: certificationAdvisorSchema,
    systemPrompt: PROMPTS.CERTIFICATION_ADVISOR,
    contextFields: ["profile", "resume"],
  },
  "project-idea-generator": {
    schema: projectIdeaGeneratorSchema,
    systemPrompt: PROMPTS.PROJECT_IDEA_GENERATOR,
    contextFields: ["profile", "resume"],
  },
  "portfolio-optimizer": {
    schema: portfolioOptimizerSchema,
    systemPrompt: PROMPTS.PORTFOLIO_OPTIMIZER,
    contextFields: ["profile", "resume"],
  },
};

// ── Context Building ────────────────────────────────────────────────────────

interface UserContextData {
  profile?: any;
  resume?: any;
  applications?: any[];
  savedJobs?: any[];
  activeJobs?: any[];
}

async function fetchUserContext(
  supabase: any,
  userId: string,
  neededFields: string[] = [],
): Promise<UserContextData> {
  const context: UserContextData = {};

  const fetchPromises: Promise<void>[] = [];

  if (neededFields.includes("profile") || neededFields.length === 0) {
    fetchPromises.push(
      supabase
        .from("profiles")
        .select(
          "full_name,headline,bio,location,experience_years,current_position,skills,education,experience,expected_salary,preferred_job_type,preferred_location",
        )
        .eq("id", userId)
        .maybeSingle()
        .then(({ data }: any) => {
          context.profile = data;
        }),
    );
  }

  if (neededFields.includes("resume") || neededFields.length === 0) {
    fetchPromises.push(
      supabase
        .from("resumes")
        .select("overall_score,ats_score,grammar_score,parsed_data,career_roadmap,suggestions")
        .eq("user_id", userId)
        .eq("is_default", true)
        .maybeSingle()
        .then(({ data }: any) => {
          context.resume = data;
        }),
    );
  }

  if (neededFields.includes("applications") || neededFields.length === 0) {
    fetchPromises.push(
      supabase
        .from("applications")
        .select("id,status,created_at, job:jobs(id,title,company:companies(name))")
        .eq("applicant_id", userId)
        .order("created_at", { ascending: false })
        .limit(10)
        .then(({ data }: any) => {
          context.applications = data;
        }),
    );
  }

  if (neededFields.includes("savedJobs") || neededFields.length === 0) {
    fetchPromises.push(
      supabase
        .from("saved_jobs")
        .select("job:jobs(id,title,company:companies(name))")
        .eq("user_id", userId)
        .limit(5)
        .then(({ data }: any) => {
          context.savedJobs = data;
        }),
    );
  }

  if (neededFields.includes("activeJobs") || neededFields.length === 0) {
    fetchPromises.push(
      supabase
        .from("jobs")
        .select(
          "id,title,required_skills,salary_min,salary_max,salary_currency,location,job_type,description, company:companies(name,industry)",
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }: any) => {
          context.activeJobs = data;
        }),
    );
  }

  await Promise.all(fetchPromises);
  return context;
}

async function buildJobSeekerContext(
  supabase: any,
  userId: string,
  neededFields: string[] = [],
): Promise<string> {
  const { profile, resume, applications, savedJobs, activeJobs } = await fetchUserContext(
    supabase,
    userId,
    neededFields,
  );

  const ctx: string[] = [];

  // Profile Context
  if (profile) {
    ctx.push(
      `## Candidate Profile
- Name: ${profile.full_name || "N/A"}
- Headline: ${profile.headline || "N/A"}
- Location: ${profile.location || "N/A"}
- Experience: ${profile.experience_years || 0} years
- Current Position: ${profile.current_position || "N/A"}
- Skills: ${(profile.skills || []).join(", ") || "None listed"}
- Education: ${JSON.stringify(profile.education || [])}
- Expected Salary: ${profile.expected_salary ? `Rs. ${profile.expected_salary}/month` : "Not specified"}
- Preferred Job Type: ${profile.preferred_job_type || "Any"}
- Preferred Location: ${profile.preferred_location || "Any"}`,
    );
  }

  // Resume Analysis
  if (resume) {
    const parsed = resume.parsed_data as any;
    const roadmap = resume.career_roadmap as any;
    ctx.push(
      `## Resume Analysis
- Overall Score: ${resume.overall_score ?? "Not scored"}
- ATS Score: ${resume.ats_score ?? "Not scored"}
- Grammar Score: ${resume.grammar_score ?? "Not scored"}
- Extracted Skills: ${(parsed?.skills || []).join(", ") || "None"}
- Summary: ${parsed?.summary || "No summary available"}
- Strengths: ${(roadmap?.strengths || []).join(", ") || "Not identified"}
- Missing Skills: ${(roadmap?.missing_skills || []).join(", ") || "Not identified"}
- Recent Suggestions: ${(resume.suggestions || []).slice(0, 3).join("; ") || "None"}`,
    );
  }

  // Application History
  if (applications?.length) {
    ctx.push(
      `## Recent Applications
${applications
  .map(
    (a: any) => `- ${a.job?.title} at ${a.job?.company?.name || "Unknown"} (Status: ${a.status})`,
  )
  .join("\n")}`,
    );
  }

  // Saved Jobs
  if (savedJobs?.length) {
    ctx.push(
      `## Saved Jobs
${savedJobs.map((s: any) => `- ${s.job?.title} at ${s.job?.company?.name || "Unknown"}`).join("\n")}`,
    );
  }

  // Active Jobs Market
  if (activeJobs?.length) {
    ctx.push(
      `## Current Job Market (Sample)
${activeJobs
  .map(
    (j: any) =>
      `- ${j.title} at ${j.company?.name || "Unknown"} (${j.company?.industry || "Unknown"})
  Skills Required: ${(j.required_skills || []).join(", ") || "Not specified"}
  Salary Range: ${j.salary_min && j.salary_max ? `Rs. ${j.salary_min} - Rs. ${j.salary_max}/month` : "Not disclosed"}
  Location: ${j.location || "Remote"}
  Type: ${j.job_type || "Full-time"}`,
  )
  .join("\n")}`,
    );
  }

  return ctx.join("\n\n");
}

// ── Main Server Function ────────────────────────────────────────────────────

export const runJobSeekerAiFeature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { featureSlug: string; message: string };
    if (!i?.featureSlug) throw new Error("Feature slug is required");
    if (!i?.message?.trim()) throw new Error("Message is required");
    return {
      featureSlug: i.featureSlug,
      message: i.message.trim().slice(0, 6000),
    };
  })
  .handler(async ({ data, context }) => {
    await requirePremium(context.userId);

    const feature = getJobSeekerAiFeature(data.featureSlug);
    if (!feature) throw new Error("Unknown AI feature");

    const config = FEATURE_CONFIGS[data.featureSlug];
    if (!config) throw new Error("AI feature not configured");

    // Build context with only needed fields for this feature
    const userContext = await buildJobSeekerContext(
      context.supabase,
      context.userId,
      config.contextFields || [],
    );

    // Create comprehensive prompt
    const prompt = [
      `## Role & Context
You are assisting a job seeker on Jagire.com, a Nepal-focused job platform.

${userContext || "No profile data available yet."}`,
      `## User Request
${data.message}`,
      ``,
      `## Instructions
1. Use the provided context to personalize your response
2. Be specific and actionable
3. Consider the Nepali job market
4. Use NPR (Rs.) for all salary figures
5. Provide realistic, practical advice
6. Format response as valid JSON per the schema`,
    ].join("\n\n");

    try {
      const result = await aiGenerateJsonValidated(
        prompt,
        config.systemPrompt,
        config.schema,
        "general",
      );

      return {
        response: result as SerializableJsonObject,
        structured: result as SerializableJsonObject,
        featureTitle: feature.title,
        contextUsed: Object.keys(userContext ? { userContext } : {}),
      };
    } catch (error) {
      console.error(`AI feature ${data.featureSlug} failed:`, error);
      throw new Error(`Failed to generate ${feature.title}. Please try again.`);
    }
  });
