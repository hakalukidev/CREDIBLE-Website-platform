import { ProfessionalProfileForm } from '@/features/professional/professional-profile-form';

export const metadata = { title: 'Profile · Professional dashboard' };

export default function ProfessionalProfilePage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Keep your public profile up to date so clients know exactly who you are.
        </p>
      </header>
      <ProfessionalProfileForm />
    </div>
  );
}
