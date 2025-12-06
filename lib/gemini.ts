import { GoogleGenAI } from '@google/genai'
import { getPolicies, Violation } from './policies'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_CLOUD_KEY! })

const ANALYSIS_PROMPT = `You are an expert workplace safety inspector analyzing video footage for OSHA safety violations.

Given the following OSHA safety policies:
---
{POLICIES}
---

Analyze the video carefully and identify ANY safety violations you observe. For each violation found, provide:
- timestamp: The time in the video where the violation occurs (MM:SS format)
- policy_name: The name of the violated policy (e.g., "Poor Housekeeping and Walking-Working Surfaces")
- severity: The severity level exactly as shown in brackets in the policy (must be one of: "Severity 1", "Severity 2", or "Severity 3")
- description: What you observed in the video
- reasoning: Why this constitutes a violation of the specific policy

IMPORTANT:
- Be thorough and identify ALL potential violations
- Only report violations you can clearly see in the video
- If no violations are found, return an empty array
- Return ONLY valid JSON, no additional text

Return your analysis as a JSON array of violations:
[
  {
    "timestamp": "00:15",
    "policy_name": "Poor Housekeeping and Walking-Working Surfaces",
    "severity": "Severity 1",
    "description": "Tools and materials scattered across walkway",
    "reasoning": "This creates slip, trip, and fall hazards as per OSHA guidelines"
  }
]`

export async function analyzeVideo(videoBase64: string, mimeType: string): Promise<Violation[]> {
  const policies = getPolicies()
  const prompt = ANALYSIS_PROMPT.replace('{POLICIES}', policies)

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: videoBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        thinkingConfig: {
          thinkingBudget: 8000,
        },
      },
    })

    const text = response.text || ''

    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.log('No JSON array found in response:', text)
      return []
    }

    const violations: Violation[] = JSON.parse(jsonMatch[0])
    return violations
  } catch (error) {
    console.error('Error analyzing video:', error)
    throw error
  }
}

export async function analyzeFrame(frameBase64: string, currentTimestamp: string): Promise<Violation[]> {
  const policies = getPolicies()

  const framePrompt = `You are an expert workplace safety inspector analyzing a single frame from a live video feed.

Given the following OSHA safety policies:
---
${policies}
---

Analyze this frame and identify ANY safety violations visible. The current timestamp is ${currentTimestamp}.

Return your analysis as a JSON array (empty array if no violations):
[{"timestamp": "${currentTimestamp}", "policy_name": "...", "severity": "Severity 1", "description": "...", "reasoning": "..."}]

Severity must be exactly one of: "Severity 1", "Severity 2", or "Severity 3"

Return ONLY valid JSON.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: frameBase64,
              },
            },
            {
              text: framePrompt,
            },
          ],
        },
      ],
    })

    const text = response.text || ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error analyzing frame:', error)
    return []
  }
}
