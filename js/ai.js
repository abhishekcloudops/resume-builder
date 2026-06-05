/* ═══════════════════════════════════════════════════════
   ResumeForge AI — AI Assistant (Gemini API Integration)
   ═══════════════════════════════════════════════════════ */

const AIManager = (() => {
  'use strict';

  const MODEL_NAME = 'gemini-2.5-flash';

  /**
   * Formulate system prompt with schema definition
   */
  function buildSystemPrompt() {
    return `You are an expert resume writer and ATS optimization specialist.
Analyze the raw, unstructured text or description about a candidate and extract/re-write it into a highly professional, structured resume JSON object.

Important rules:
1. Extract personal details (fullName, jobTitle, email, phone, address). If email or phone is missing, infer them if mentioned, or leave as empty strings.
2. LinkedIn/Github URL: Extract if provided, or leave as empty strings.
3. Write a highly professional, ATS-optimized, punchy professional summary (between 150 to 300 characters) in the 'summary' field.
4. Extract skills into a flat string array (e.g. ["React", "Node.js", "SQL"]). Clean up and capitalize them properly.
5. Work Experience (experience): Extract positions, companies, dates, locations.
   - Crucial: The 'responsibilities' field in each experience MUST be a single string containing multiple achievements/responsibilities, separated by a newline character (\\n).
   - Write responsibilities in a clear, action-oriented, professional bullet format (e.g. "Led development of a React web app\\nManaged a team of 3 engineers").
6. Education: Extract degrees, schools, start/end years, and description.
7. Projects: Extract project name, description, tech stack (comma-separated), and link.
8. Certifications: Extract certification names.
9. Languages: Extract languages and levels.
10. Return ONLY a valid JSON object matching the schema below. Do not wrap the JSON output in markdown fences (e.g. do NOT include \`\`\`json or \`\`\`).

JSON Schema structure:
{
  "documentTitle": "Resume - [Candidate Name]",
  "personal": {
    "fullName": "Full Name",
    "jobTitle": "Job Title / Professional Role",
    "email": "email@example.com",
    "phone": "+1-123-456-7890",
    "address": "City, Country or State",
    "website": "",
    "linkedin": "",
    "github": ""
  },
  "summary": "Professional Summary...",
  "skills": ["Skill1", "Skill2", "Skill3"],
  "experience": [
    {
      "position": "Job Position Title",
      "company": "Company Name",
      "location": "Location",
      "startDate": "Start Date (e.g. Jan 2020)",
      "endDate": "End Date (e.g. Present or Dec 2023)",
      "responsibilities": "Responsibility line 1\\nResponsibility line 2"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "school": "School / University Name",
      "startYear": "Start Year",
      "endYear": "End Year",
      "description": "GPA, honors, or key focus"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project Description",
      "techStack": "React, CSS, Node.js",
      "link": ""
    }
  ],
  "certifications": [
    { "name": "Certification Name" }
  ],
  "languages": [
    { "name": "Language Name", "level": "Level (e.g. Native / Conversational)" }
  ],
  "social": [
    { "platform": "LinkedIn", "url": "LinkedIn URL" }
  ]
}`;
  }

  /**
   * Parse unstructured resume text using Gemini API
   * @param {string} apiKey Gemini API Key
   * @param {string} rawText Raw input text
   * @param {function} onStepUpdate Callback to show progress steps
   * @returns {Promise<object>} Parsed resume data matching the schema
   */
  async function parseResume(apiKey, rawText, onStepUpdate = () => {}) {
    if (!apiKey) throw new Error('Gemini API Key is missing. Please enter a valid API key first.');
    if (!rawText || !rawText.trim()) throw new Error('Please enter some text or description about yourself.');

    onStepUpdate('Connecting to Gemini API...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    const systemPrompt = buildSystemPrompt();

    onStepUpdate('Analyzing your details...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPrompt },
              { text: `Raw Text Input:\n${rawText}` }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      let errText = 'API Request failed';
      try {
        const errJson = await response.json();
        errText = errJson.error?.message || errText;
      } catch (e) {}
      throw new Error(`Gemini API Error: ${errText}`);
    }

    onStepUpdate('Formatting experience and achievements...');
    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      throw new Error('Gemini API returned an empty response. Please check your input and try again.');
    }

    onStepUpdate('Populating editor fields...');
    try {
      const parsedResume = JSON.parse(resultText);
      return parsedResume;
    } catch (e) {
      console.error('Failed to parse Gemini response JSON:', resultText);
      throw new Error('Failed to parse the AI response into a valid resume structure. Please try again.');
    }
  }

  return { parseResume };
})();
