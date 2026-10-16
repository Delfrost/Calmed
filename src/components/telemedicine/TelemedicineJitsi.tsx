'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface TelemedicineJitsiProps {
  roomName: string;
}

export default function TelemedicineJitsi({ roomName }: TelemedicineJitsiProps) {
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  // The displayName to pass into Jitsi
  const displayName = session?.user?.name ? encodeURIComponent(`Dr. ${session.user.name}`) : 'Doctor';

  // Build the Jitsi Meet URL
  // We use config parameters to hide UI elements for a cleaner look in the split-screen layout
  const jitsiUrl = `https://meet.jit.si/${roomName}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false&config.disableDeepLinking=true`;

  return (
    <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3 z-10 bg-slate-950">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium animate-pulse">Initializing secure video room...</p>
        </div>
      )}

      <iframe
        src={jitsiUrl}
        className="w-full h-full border-none relative z-20"
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
