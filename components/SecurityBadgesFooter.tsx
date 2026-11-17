'use client';

import React from 'react';
import { Lock, Droplet, Clock, Link2Off } from 'lucide-react';

export const SecurityBadgesFooter: React.FC = () => {
  return (
    <div className="feature-badge-row">
      <div className="feature-pill-badge">
        <Lock size={13} />
        <span>One-time access</span>
      </div>
      <div className="feature-pill-badge">
        <Droplet size={13} />
        <span>Watermarked</span>
      </div>
      <div className="feature-pill-badge">
        <Clock size={13} />
        <span>Auto-expires</span>
      </div>
      <div className="feature-pill-badge">
        <Link2Off size={13} />
        <span>No direct URLs</span>
      </div>
    </div>
  );
};
