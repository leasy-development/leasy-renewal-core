import React from 'react';
import { securityHeaders } from '@/utils/securityHeaders';

interface SecurityHeadersProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityHeadersProps> = ({ children }) => {
  React.useEffect(() => {
    // Apply CSP and other security headers in development
    if (typeof document !== 'undefined') {
      // Create meta tags for security headers
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = securityHeaders['Content-Security-Policy'];
      
      const xFrameMeta = document.createElement('meta');
      xFrameMeta.httpEquiv = 'X-Frame-Options';
      xFrameMeta.content = securityHeaders['X-Frame-Options'];
      
      const xContentTypeMeta = document.createElement('meta');
      xContentTypeMeta.httpEquiv = 'X-Content-Type-Options';
      xContentTypeMeta.content = securityHeaders['X-Content-Type-Options'];
      
      const referrerMeta = document.createElement('meta');
      referrerMeta.name = 'referrer';
      referrerMeta.content = securityHeaders['Referrer-Policy'];
      
      // Add to head if not already present
      const head = document.head;
      if (!head.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        head.appendChild(cspMeta);
      }
      if (!head.querySelector('meta[http-equiv="X-Frame-Options"]')) {
        head.appendChild(xFrameMeta);
      }
      if (!head.querySelector('meta[http-equiv="X-Content-Type-Options"]')) {
        head.appendChild(xContentTypeMeta);
      }
      if (!head.querySelector('meta[name="referrer"]')) {
        head.appendChild(referrerMeta);
      }
    }
  }, []);

  return <>{children}</>;
};