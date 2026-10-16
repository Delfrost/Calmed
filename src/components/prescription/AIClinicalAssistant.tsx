'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  FileText, 
  Tags, 
  AlertTriangle, 
  Pill, 
  Calendar,
  X,
  CheckCircle2,
  Copy,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrescriptionItemData } from '@/types';

interface AIClinicalAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context: {
    diagnosis: string;
    chiefComplaints?: string;
    vitals: any;
    medicines: PrescriptionItemData[];
    allergies: string[];
    chronicConditions: string[];
    patientAge: number;
    patientGender: string;
  };
  onApplyNotes?: (notes: string) => void;
  onApplyDiagnosis?: (diagnosis: string) => void;
}

type AIAction = 'soap_notes' | 'icd_codes' | 'drug_interactions' | 'rx_templates' | 'followup' | null;

export default function AIClinicalAssistant({
  isOpen,
  onClose,
  context,
  onApplyNotes,
  onApplyDiagnosis
}: AIClinicalAssistantProps) {
  const [activeAction, setActiveAction] = useState<AIAction>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [source, setSource] = useState<'gemini' | 'fallback' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-check drug interactions when medicines change
  useEffect(() => {
    if (!isOpen || context.medicines.length === 0) return;
    
    const checkInteractions = async () => {
      try {
        const res = await fetch('/api/ai/clinical-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'drug_interactions', context })
        });
        const data = await res.json();
        
        // If we're not currently viewing something else, and there are interactions, show them
        if (data.result?.interactions?.length > 0 && !activeAction) {
          setActiveAction('drug_interactions');
          setResult(data.result);
          setSource(data.source);
        }
      } catch (err) {
        console.error('Failed to auto-check interactions', err);
      }
    };
    
    const timeoutId = setTimeout(checkInteractions, 1000);
    return () => clearTimeout(timeoutId);
  }, [context.medicines, isOpen]);

  const handleAction = async (action: AIAction) => {
    if (!action) return;
    
    setActiveAction(action);
    setLoading(true);
    setError(null);
    setResult(null);
    setSource(null);

    try {
      const res = await fetch('/api/ai/clinical-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, context })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to fetch AI suggestion');
      
      setResult(data.result);
      setSource(data.source);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-slate-200 bg-white shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.05)] flex flex-col h-[calc(100vh-64px)] fixed right-0 top-16 z-20 transform transition-transform">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-violet-900">AI Assistant</h3>
            <p className="text-[10px] text-violet-600 font-medium">Clinical Decision Support</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/60 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-slate-100 bg-white">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Capabilities</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleAction('soap_notes')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              activeAction === 'soap_notes' ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <FileText className="w-3.5 h-3.5" /> SOAP Notes
          </button>
          <button
            onClick={() => handleAction('icd_codes')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              activeAction === 'icd_codes' ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Tags className="w-3.5 h-3.5" /> ICD-10
          </button>
          <button
            onClick={() => handleAction('drug_interactions')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              activeAction === 'drug_interactions' ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Interactions
          </button>
          <button
            onClick={() => handleAction('rx_templates')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              activeAction === 'rx_templates' ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Pill className="w-3.5 h-3.5" /> Rx Templates
          </button>
          <button
            onClick={() => handleAction('followup')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              activeAction === 'followup' ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Calendar className="w-3.5 h-3.5" /> Follow-up
          </button>
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
        {!activeAction ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
            <Sparkles className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">Select an action above to get AI-powered insights based on the current prescription context.</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            <div className="h-4 w-1/3 bg-slate-200 rounded animate-pulse" />
            <div className="h-20 w-full bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-12 w-full bg-slate-200 rounded-xl animate-pulse" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        ) : result ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAction}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* SOAP Notes Result */}
              {activeAction === 'soap_notes' && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-500" />
                    Generated SOAP Note
                  </h4>
                  <div className="text-xs text-slate-600 space-y-2 mb-4 bg-slate-50 p-3 rounded-lg font-mono">
                    <p><strong>S:</strong> {result.subjective}</p>
                    <p><strong>O:</strong> {result.objective}</p>
                    <p><strong>A:</strong> {result.assessment}</p>
                    <p><strong>P:</strong> {result.plan}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => copyToClipboard(result.formattedString)}
                      className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                    {onApplyNotes && (
                      <button 
                        onClick={() => onApplyNotes(result.formattedString)}
                        className="flex-1 py-1.5 px-3 bg-violet-100 hover:bg-violet-200 text-violet-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Apply
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ICD Codes Result */}
              {activeAction === 'icd_codes' && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Tags className="w-4 h-4 text-violet-500" />
                    ICD-10 Suggestions
                  </h4>
                  <div className="space-y-2">
                    {result.codes?.map((c: any, i: number) => (
                      <div key={i} className="p-2 border border-slate-100 rounded-lg hover:border-violet-200 hover:bg-violet-50 transition-colors group cursor-pointer" onClick={() => onApplyDiagnosis?.(`${context.diagnosis} (${c.code})`)}>
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded group-hover:bg-violet-200 group-hover:text-violet-700">{c.code}</span>
                          {onApplyDiagnosis && <span className="text-[9px] text-violet-500 opacity-0 group-hover:opacity-100 font-semibold">Apply</span>}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{c.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drug Interactions Result */}
              {activeAction === 'drug_interactions' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className={cn(
                    "p-3 border-b flex items-center gap-2 text-xs font-bold",
                    result.interactions?.length > 0 ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-emerald-50 border-emerald-100 text-emerald-800"
                  )}>
                    {result.interactions?.length > 0 ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {result.summary}
                  </div>
                  
                  {result.interactions?.length > 0 && (
                    <div className="p-3 space-y-3">
                      {result.interactions.map((int: any, i: number) => (
                        <div key={i} className="flex gap-2">
                          <div className="mt-0.5">
                            <AlertTriangle className={cn(
                              "w-4 h-4",
                              int.severity === 'Critical' || int.severity === 'High' ? "text-rose-500" : "text-amber-500"
                            )} />
                          </div>
                          <div>
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                              int.severity === 'Critical' || int.severity === 'High' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                            )}>{int.severity} Risk</span>
                            <p className="text-xs text-slate-700 mt-1">{int.description}</p>
                            {int.drugsInvolved && (
                              <p className="text-[10px] text-slate-400 mt-1">Involves: {int.drugsInvolved.join(', ')}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Rx Templates Result */}
              {activeAction === 'rx_templates' && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-violet-500" />
                    Suggested Regimen
                  </h4>
                  {result.medicines?.length > 0 ? (
                    <div className="space-y-3">
                      {result.medicines.map((med: any, i: number) => (
                        <div key={i} className="p-3 border border-slate-100 rounded-lg bg-slate-50">
                          <p className="text-xs font-bold text-slate-800">{med.name} <span className="text-slate-400 font-normal">({med.dosage})</span></p>
                          <p className="text-[10px] text-slate-500 mt-1">{med.frequency} • {med.duration}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Note: {med.instructions}</p>
                        </div>
                      ))}
                      <p className="text-[9px] text-slate-400 italic text-center mt-2">Templates are suggestions. Manually add these via the Medicine Search.</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No specific template found for this diagnosis.</p>
                  )}
                </div>
              )}

              {/* Followup Result */}
              {activeAction === 'followup' && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-500" />
                    Follow-up Plan
                  </h4>
                  <div className="mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Suggested Timeline</span>
                    <p className="text-sm font-bold text-indigo-600">{result.suggestedTimeframe}</p>
                  </div>
                  <div className="mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Reasoning</span>
                    <p className="text-xs text-slate-600 mt-0.5">{result.reasoning}</p>
                  </div>
                  {result.monitoringParameters && result.monitoringParameters.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Monitor</span>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        {result.monitoringParameters.map((p: string, i: number) => (
                          <li key={i} className="text-xs text-slate-600">{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 bg-white text-center">
        <p className="text-[9px] text-slate-400 font-medium">
          {source === 'gemini' 
            ? 'Powered by Gemini AI · Verify before use' 
            : 'Powered by Clinical Templates · Offline Mode'}
        </p>
      </div>
    </div>
  );
}
