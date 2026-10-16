import PrescriptionPad from '@/components/prescription/PrescriptionPad';
import Link from 'next/link';
import { ArrowLeft, Video, Copy, ExternalLink } from 'lucide-react';
import TelemedicineJitsi from '@/components/telemedicine/TelemedicineJitsi';

export const metadata = {
  title: 'Telemedicine Console — MedFlow',
  description: 'Integrated Video Consultation with Prescription Pad',
};

interface TelemedicinePageProps {
  params: Promise<{ patientId: string }>;
}

export default async function TelemedicinePage({ params }: TelemedicinePageProps) {
  const { patientId } = await params;
  
  // Create a predictable room name based on the patient ID to share.
  // In a real app, this would be a secure token-based UUID generated from the DB.
  const roomName = `medflow-consult-${patientId}`;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Top Navbar */}
      <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/doctor"
            className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Video className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800">Live Consultation</h1>
              <p className="text-[10px] text-slate-500 font-medium">Session is encrypted</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
           >
             <Copy className="h-3.5 w-3.5" />
             Copy Join Link
           </button>
        </div>
      </header>

      {/* Main Content Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Video Container (40%) */}
        <div className="w-[40%] h-full border-r border-slate-200 bg-black hidden lg:flex flex-col relative shrink-0">
          <TelemedicineJitsi roomName={roomName} />
        </div>

        {/* Right Column: Prescription Pad (60%) */}
        <div className="flex-1 h-full overflow-y-auto relative">
          {/* Note: PrescriptionPad handles its own max-width padding, so it scales nicely */}
          <PrescriptionPad patientId={patientId} />
        </div>
      </div>
    </div>
  );
}
