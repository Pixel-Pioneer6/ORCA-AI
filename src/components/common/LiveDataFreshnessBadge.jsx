import React, { useState, useEffect } from 'react';

// FR-5.2: real data-age display driven by the backend's actual telemetry
// timestamp/cache age (backend/services/incois_service.py), not the
// Safety page's demo-clock simulator (SENSOR_SCENARIOS' fixed ageHours) —
// that simulator stays as-is for teaching the staleness contract; this is
// the separate, real signal for what's actually backing live surfaces.
export default function LiveDataFreshnessBadge({ className = '' }) {
  const [status, setStatus] = useState(null); // 'loading' | data | 'error'

  useEffect(() => {
    let cancelled = false;
    fetch('/api/safety/verdict')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setStatus({
          dataSource: data.telemetry?.data_source || 'UNKNOWN',
          timestamp: data.telemetry?.timestamp,
          confidence: data.confidence,
        });
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  if (!status) {
    return (
      <div className={`text-[10px] text-on-surface-variant font-mono ${className}`}>
        Checking live backend feed…
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className={`text-[10px] text-error font-mono ${className}`}>
        Live backend unreachable — showing local demo simulation only.
      </div>
    );
  }

  const isLive = status.dataSource?.includes('LIVE');
  return (
    <div className={`flex items-center gap-1.5 text-[10px] font-mono ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
      <span className={isLive ? 'text-emerald-700' : 'text-amber-700'}>
        {isLive ? 'LIVE' : 'FALLBACK'}
      </span>
      <span className="text-on-surface-variant">
        backend feed · {status.timestamp} · confidence {status.confidence}
      </span>
    </div>
  );
}
