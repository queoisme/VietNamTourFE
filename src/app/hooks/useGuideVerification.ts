import { useAuth } from '../contexts/AuthContext';

export function useGuideVerification() {
  const { user, isGuide } = useAuth();

  const checkApprovedApplication = () => {
    if (!user || !isGuide) return false;
    
    const applications = JSON.parse(localStorage.getItem('guideApplications') || '[]');
    const approved = applications.some((app: any) => 
      app.userEmail === user.email && app.status === 'approved'
    );
    
    return approved;
  };

  const hasApprovedApplication = checkApprovedApplication();

  return {
    hasApprovedApplication,
    isVerifiedGuide: hasApprovedApplication,
    needsVerification: isGuide && !hasApprovedApplication,
  };
}
