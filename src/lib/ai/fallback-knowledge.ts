export const FALLBACK_ICD_CODES: Record<string, Array<{ code: string; description: string }>> = {
  diabetes: [
    { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
    { code: 'E11.22', description: 'Type 2 diabetes mellitus with diabetic chronic kidney disease' },
    { code: 'E11.40', description: 'Type 2 diabetes mellitus with diabetic neuropathy, unspecified' },
    { code: 'E10.9', description: 'Type 1 diabetes mellitus without complications' },
  ],
  hypertension: [
    { code: 'I10', description: 'Essential (primary) hypertension' },
    { code: 'I11.9', description: 'Hypertensive heart disease without heart failure' },
    { code: 'I12.9', description: 'Hypertensive chronic kidney disease with stage 1 through stage 4 chronic kidney disease, or unspecified chronic kidney disease' },
  ],
  asthma: [
    { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
    { code: 'J45.20', description: 'Mild intermittent asthma, uncomplicated' },
    { code: 'J45.30', description: 'Mild persistent asthma, uncomplicated' },
    { code: 'J45.40', description: 'Moderate persistent asthma, uncomplicated' },
  ],
  fever: [
    { code: 'R50.9', description: 'Fever, unspecified' },
    { code: 'A97.0', description: 'Dengue without warning signs' },
    { code: 'A01.00', description: 'Typhoid fever, unspecified' },
  ],
  cough: [
    { code: 'R05.1', description: 'Acute cough' },
    { code: 'R05.2', description: 'Subacute cough' },
    { code: 'R05.3', description: 'Chronic cough' },
    { code: 'J20.9', description: 'Acute bronchitis, unspecified' },
  ]
};

export const FALLBACK_RX_TEMPLATES: Record<string, any[]> = {
  diabetes: [
    { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', duration: '30 days', instructions: 'After meals' },
    { name: 'Glimepiride', dosage: '1mg', frequency: 'Once daily', duration: '30 days', instructions: 'Before breakfast' },
  ],
  hypertension: [
    { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'After breakfast' },
    { name: 'Telmisartan', dosage: '40mg', frequency: 'Once daily', duration: '30 days', instructions: 'After dinner' },
  ],
  fever: [
    { name: 'Paracetamol', dosage: '650mg', frequency: 'Thrice daily (SOS)', duration: '3 days', instructions: 'After meals, if fever > 100F' },
  ],
  asthma: [
    { name: 'Salbutamol Inhaler', dosage: '100mcg/dose', frequency: 'SOS', duration: '1 Inhaler', instructions: '1-2 puffs for acute symptoms' },
    { name: 'Budesonide Inhaler', dosage: '200mcg/dose', frequency: 'Twice daily', duration: '1 Inhaler', instructions: 'Rinse mouth after use' },
  ]
};

export const FALLBACK_DRUG_INTERACTIONS = [
  { drugs: ['Metformin', 'Alcohol'], severity: 'High', description: 'Increased risk of lactic acidosis.' },
  { drugs: ['Aspirin', 'Ibuprofen'], severity: 'Moderate', description: 'Increased risk of gastrointestinal bleeding.' },
  { drugs: ['Amlodipine', 'Simvastatin'], severity: 'Moderate', description: 'Increased risk of myopathy/rhabdomyolysis.' },
];

export function getFallbackICDCodes(diagnosis: string) {
  const normalized = diagnosis.toLowerCase();
  for (const key of Object.keys(FALLBACK_ICD_CODES)) {
    if (normalized.includes(key)) {
      return FALLBACK_ICD_CODES[key];
    }
  }
  return [{ code: 'R69', description: 'Illness, unspecified' }];
}

export function getFallbackRxTemplates(diagnosis: string) {
  const normalized = diagnosis.toLowerCase();
  for (const key of Object.keys(FALLBACK_RX_TEMPLATES)) {
    if (normalized.includes(key)) {
      return FALLBACK_RX_TEMPLATES[key];
    }
  }
  return [];
}

export function checkFallbackDrugInteractions(medicines: string[], allergies: string[] = []) {
  const interactions = [];
  const normalizedMeds = medicines.map(m => m.toLowerCase());
  const normalizedAllergies = allergies.map(a => a.toLowerCase());

  // Check known drug interactions
  for (const interaction of FALLBACK_DRUG_INTERACTIONS) {
    const hasDrugA = normalizedMeds.some(m => m.includes(interaction.drugs[0].toLowerCase()));
    const hasDrugB = normalizedMeds.some(m => m.includes(interaction.drugs[1].toLowerCase()));
    
    if (hasDrugA && hasDrugB) {
      interactions.push(interaction);
    }
  }

  // Check simple allergy matches
  for (const med of normalizedMeds) {
    for (const allergy of normalizedAllergies) {
      if (med.includes(allergy) || allergy.includes(med)) {
         interactions.push({
           severity: 'Critical',
           description: `Patient has a documented allergy to ${allergy}, which conflicts with prescribed ${med}.`
         });
      }
    }
  }

  return interactions;
}

export function generateFallbackSOAP(context: any) {
  const s = context.chiefComplaints || 'Routine follow-up';
  
  let o = [];
  if (context.vitals?.bloodPressure) o.push(`BP: ${context.vitals.bloodPressure}`);
  if (context.vitals?.weight) o.push(`Weight: ${context.vitals.weight}kg`);
  if (context.vitals?.temperature) o.push(`Temp: ${context.vitals.temperature}`);
  const oStr = o.length > 0 ? o.join(', ') : 'Vitals stable';

  const a = context.diagnosis || 'Pending definitive diagnosis';
  
  const pList = [];
  if (context.medicines && context.medicines.length > 0) {
    pList.push('Continue prescribed medications.');
  }
  pList.push('Advised on diet and lifestyle modifications.');
  pList.push('Follow up as scheduled.');
  
  return `S: ${s}\n\nO: ${oStr}\n\nA: ${a}\n\nP:\n- ${pList.join('\n- ')}`;
}

export function generateFallbackFollowup(diagnosis: string) {
  const normalized = diagnosis.toLowerCase();
  if (normalized.includes('fever') || normalized.includes('acute')) {
    return '3 days';
  }
  if (normalized.includes('diabetes') || normalized.includes('hypertension')) {
    return '1 month';
  }
  return '2 weeks';
}
