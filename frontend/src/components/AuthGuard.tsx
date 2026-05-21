import React from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Per FRONTEND_HANDOFF.md: no complex JWT, no authentication needed.
// Backend has NO authentication. This is a pass-through guard.
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  return <>{children}</>;
};

export default AuthGuard;
