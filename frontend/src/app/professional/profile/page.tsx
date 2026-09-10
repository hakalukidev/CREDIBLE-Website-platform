import { ProfessionalProfilePageContent } from './page-content';

export const metadata = { title: 'Profile · Professional dashboard' };

export default function ProfessionalProfilePage() {
  return (
    <div className="space-y-4">
      <ProfessionalProfilePageContent />
    </div>
  );
}
