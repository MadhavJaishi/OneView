'use client';

import React from 'react';

/**
 * Animated dual intermeshed gears matching the user's provided design.
 */
export const GearsLoader: React.FC = () => {
  return (
    <div className="startup-loader-container">
      <div style={{ position: 'relative', width: '130px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg
          viewBox="0 0 140 110"
          width="130"
          height="100"
          style={{ overflow: 'visible' }}
        >
          {/* Main Large Gear (Rotates Clockwise) */}
          <g transform="translate(56, 50)" className="spin-clockwise">
            <path
              d="
                M -12,-36 L 12,-36 L 14,-29 L 26,-26 L 33,-31 L 45,-15 L 39,-9 L 43,-2 L 49,-2 L 49,14 L 43,15 L 39,22 L 45,30 L 33,45 L 26,39 L 14,43 L 12,49 L -12,49 L -14,43 L -26,39 L -33,45 L -45,30 L -39,22 L -43,15 L -49,14 L -49,-2 L -43,-2 L -39,-9 L -45,-15 L -33,-31 L -26,-26 L -14,-29 Z
              "
              fill="var(--text-muted)"
              opacity="0.85"
            />
            {/* Center axle hole */}
            <circle cx="0" cy="0" r="14" fill="var(--bg-app)" />
          </g>

          {/* Secondary Small Interlocked Gear (Rotates Counter-Clockwise) */}
          <g transform="translate(98, 70)" className="spin-counter">
            <path
              d="
                M -7,-22 L 7,-22 L 9,-17 L 16,-15 L 21,-19 L 27,-10 L 23,-5 L 25,-1 L 29,-1 L 29,9 L 25,10 L 23,14 L 27,19 L 21,27 L 16,23 L 9,25 L 7,29 L -7,29 L -9,25 L -16,23 L -21,27 L -27,19 L -23,14 L -25,10 L -29,9 L -29,-1 L -25,-1 L -23,-5 L -27,-10 L -21,-19 L -16,-15 L -9,-17 Z
              "
              fill="var(--text-muted)"
              opacity="0.8"
            />
            {/* Center axle hole */}
            <circle cx="0" cy="0" r="8" fill="var(--bg-app)" />
          </g>
        </svg>
      </div>

      <div
        style={{
          marginTop: '1.25rem',
          fontSize: '0.95rem',
          fontWeight: 600,
          color: 'var(--text-body)',
          letterSpacing: '0.5px',
        }}
      >
        Loading...
      </div>
    </div>
  );
};
