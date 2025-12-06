import { GoogleGenAI } from '@google/genai'
import { getPolicies, Violation } from './policies'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_CLOUD_KEY! })

// Nano Banana Pro for generating corrected scene
const HIGHLIGHT_PROMPT = `You are a safety compliance visualization expert.

Violation detected: {POLICY_NAME}
Description: {DESCRIPTION}
Reasoning: {REASONING}

How to fix: {FIX}

Edit this image to show how the scene SHOULD look after applying the fix above:
- Apply the specific fix described to correct the safety hazard
- Show the compliant, safe state as if the fix has been implemented
- Keep the overall scene, setting, and context identical
- The result should be a realistic visualization of a safe, compliant workplace`

export async function highlightViolation(
  frameBase64: string,
  violation: Violation
): Promise<string> {
  const prompt = HIGHLIGHT_PROMPT
    .replace('{POLICY_NAME}', violation.policy_name)
    .replace('{DESCRIPTION}', violation.description)
    .replace('{REASONING}', violation.reasoning)
    .replace('{FIX}', violation.fix)

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
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
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
    })

    // Extract the generated image from response
    const parts = response.candidates?.[0]?.content?.parts
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          return part.inlineData.data
        }
      }
    }

    throw new Error('No image returned from Nano Banana Pro')
  } catch (error) {
    console.error('Error highlighting violation:', error)
    throw error
  }
}

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
- fix: A specific, actionable instruction on how to fix this violation (e.g., "Move the boxes off the walkway and store them on the designated shelf")

IMPORTANT:
- Be thorough and identify ALL potential violations
- Only report violations you can clearly see in the video
- If the SAME violation type occurs multiple times in the video, report ONLY the MOST SIGNIFICANT instance (the one that is most clearly visible, most severe, or poses the greatest risk) - do NOT report the first occurrence, report the WORST/MOST SIGNIFICANT occurrence
- Each unique violation type should appear only once in your results, at its most significant timestamp
- The timestamp you return should be the one with where the violation is most clearly visible. It shouldn't be the start of the violation, but when it is the MOST apparent (1-2 seconds after the start of the violation)
- If no violations are found, return an empty array
- Return ONLY valid JSON, no additional text

Return your analysis as a JSON array of violations:
[
  {
    "timestamp": "00:15",
    "policy_name": "Poor Housekeeping and Walking-Working Surfaces",
    "severity": "Severity 1",
    "description": "Tools and materials scattered across walkway",
    "reasoning": "This creates slip, trip, and fall hazards as per OSHA guidelines",
    "fix": "Clear the walkway by moving tools to the designated tool storage area and materials to the proper staging zone"
  }
]`

export async function analyzeVideo(videoBase64: string, mimeType: string): Promise<Violation[]> {
  const policies = getPolicies()
  const prompt = ANALYSIS_PROMPT.replace('{POLICIES}', policies.policies.map(policy => `- ${policy.title} (${policy.description})`).join('\n'))

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
[{"timestamp": "${currentTimestamp}", "policy_name": "...", "severity": "Severity 1", "description": "...", "reasoning": "...", "fix": "Specific action to correct this violation"}]

Severity must be exactly one of: "Severity 1", "Severity 2", or "Severity 3"
The fix should be a specific, actionable instruction on how to correct the violation.

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