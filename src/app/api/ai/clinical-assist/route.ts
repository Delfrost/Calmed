import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getSOAPPrompt,
  getICDPrompt,
  getDrugInteractionPrompt,
  getRxTemplatePrompt,
  getFollowupPrompt,
  SYSTEM_INSTRUCTION
} from '@/lib/ai/clinical-prompts';
import {
  getFallbackICDCodes,
  getFallbackRxTemplates,
  checkFallbackDrugInteractions,
  generateFallbackSOAP,
  generateFallbackFollowup
} from '@/lib/ai/fallback-knowledge';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const user = session?.user;
    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Unauthorized. Doctor access required.' }, { status: 401 });
    }

    const body = await req.json();
    const { action, context } = body;

    if (!action || !context) {
      return NextResponse.json({ error: 'Missing action or context' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const useFallback = !apiKey;

    // Handle Fallback Mode
    if (useFallback) {
      // Simulate network delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));

      let result;
      switch (action) {
        case 'soap_notes':
          result = {
            subjective: context.chiefComplaints || 'Routine',
            objective: 'Vitals recorded',
            assessment: context.diagnosis || 'Pending',
            plan: 'Continue care',
            formattedString: generateFallbackSOAP(context)
          };
          break;
        case 'icd_codes':
          result = { codes: getFallbackICDCodes(context.diagnosis || '') };
          break;
        case 'drug_interactions':
          const meds = context.medicines?.map((m: any) => typeof m === 'string' ? m : m.name) || [];
          const interactions = checkFallbackDrugInteractions(meds, context.allergies || []);
          result = {
            interactions,
            summary: interactions.length > 0 ? 'Potential interactions found.' : 'No major interactions detected.'
          };
          break;
        case 'rx_templates':
          result = { medicines: getFallbackRxTemplates(context.diagnosis || '') };
          break;
        case 'followup':
          result = {
            suggestedTimeframe: generateFallbackFollowup(context.diagnosis || ''),
            monitoringParameters: ['Vitals', 'Symptom progression'],
            reasoning: 'Standard protocol based on diagnosis.'
          };
          break;
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      return NextResponse.json({ result, source: 'fallback' });
    }

    // Handle Gemini API Mode
    let prompt = '';
    switch (action) {
      case 'soap_notes':
        prompt = getSOAPPrompt(context);
        break;
      case 'icd_codes':
        prompt = getICDPrompt(context.diagnosis || '');
        break;
      case 'drug_interactions':
        const meds = context.medicines?.map((m: any) => typeof m === 'string' ? m : m.name) || [];
        prompt = getDrugInteractionPrompt(meds, context.allergies || []);
        break;
      case 'rx_templates':
        prompt = getRxTemplatePrompt(context.diagnosis || '');
        break;
      case 'followup':
        prompt = getFollowupPrompt(context.diagnosis || '', context);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const geminiBody = {
      system_instruction: {
        parts: { text: SYSTEM_INSTRUCTION }
      },
      contents: [
        { parts: [{ text: prompt }] }
      ],
      generationConfig: {
        response_mime_type: "application/json",
      }
    };

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      if (response.status === 429) {
        return NextResponse.json({ error: 'AI Rate limit exceeded. Please try again later.' }, { status: 429 });
      }
      return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 });
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 });
    }

    try {
      const parsedResult = JSON.parse(responseText);
      return NextResponse.json({ result: parsedResult, source: 'gemini' });
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON output:', responseText);
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('AI Clinical Assist Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
