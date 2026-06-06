import PrescriptionPad from '@/components/prescription/PrescriptionPad';

export const metadata = {
  title: 'Prescription Pad — MedFlow',
  description: 'Write digital prescriptions with real-time pharmacy inventory check',
};

interface PrescriptionPageProps {
  params: Promise<{ patientId: string }>;
}

export default async function PrescriptionPage({ params }: PrescriptionPageProps) {
  const { patientId } = await params;

  return (
    <div className="min-h-screen">
      <PrescriptionPad patientId={patientId} />
    </div>
  );
}
