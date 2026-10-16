export const SYSTEM_INSTRUCTION = `You are an expert AI Clinical Assistant integrated into a Healthcare SaaS platform (MediMonk-competitor). 
Your primary user is a certified physician (Doctor). 
Your goal is to provide intelligent, accurate, and concise clinical decision support.
Always maintain a professional, clinical tone.
IMPORTANT: You are providing support, not making final medical decisions. The doctor is ultimately responsible.
Provide responses in clean, structured JSON format as requested by the prompt.`;

export function getSOAPPrompt(context: any) {
  return `Generate a concise, professional SOAP note based on the following clinical context:
  
Diagnosis: ${context.diagnosis || 'Not provided'}
Chief Complaints: ${context.chiefComplaints || 'Not provided'}
Vitals: ${JSON.stringify(context.vitals || {})}
Current Medications: ${JSON.stringify(context.medicines || [])}
Allergies: ${context.allergies?.join(', ') || 'None'}
Chronic Conditions: ${context.chronicConditions?.join(', ') || 'None'}
Patient Age: ${context.patientAge || 'Unknown'}
Patient Gender: ${context.patientGender || 'Unknown'}

Please return ONLY a JSON object with the following structure:
{
  "subjective": "string",
  "objective": "string",
  "assessment": "string",
  "plan": "string",
  "formattedString": "A formatted text version of the SOAP note ready to be pasted"
}`;
}

export function getICDPrompt(diagnosis: string) {
  return `Given the clinical diagnosis "${diagnosis}", suggest the top 5 most relevant ICD-10 codes.

Please return ONLY a JSON object with the following structure:
{
  "codes": [
    { "code": "string", "description": "string" }
  ]
}`;
}

export function getDrugInteractionPrompt(medicines: string[], allergies: string[]) {
  return `Analyze the following medications and patient allergies for potential drug-drug interactions, contraindications, or allergy warnings.

Medications: ${medicines.join(', ') || 'None'}
Allergies: ${allergies.join(', ') || 'None'}

Please return ONLY a JSON object with the following structure:
{
  "interactions": [
    { "severity": "High|Moderate|Low|Critical", "description": "string", "drugsInvolved": ["string"] }
  ],
  "summary": "A brief overall risk summary"
}`;
}

export function getRxTemplatePrompt(diagnosis: string) {
  return `Suggest a standard, evidence-based medication regimen (prescription template) for the following diagnosis: "${diagnosis}".

Please return ONLY a JSON object with the following structure:
{
  "medicines": [
    { "name": "string", "dosage": "string", "frequency": "string", "duration": "string", "instructions": "string" }
  ]
}`;
}

export function getFollowupPrompt(diagnosis: string, context: any) {
  return `Suggest an appropriate follow-up timeframe and monitoring parameters for the following case:

Diagnosis: ${diagnosis}
Current Medications: ${JSON.stringify(context.medicines || [])}

Please return ONLY a JSON object with the following structure:
{
  "suggestedTimeframe": "e.g., 2 weeks, 1 month",
  "monitoringParameters": ["string"],
  "reasoning": "string"
}`;
}
