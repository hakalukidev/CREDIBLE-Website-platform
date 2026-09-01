import { ProfileForm } from '@/features/business/profile-form';

export const metadata = { title: 'Profile · Business dashboard' };

export default function BusinessProfilePage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Keep your public profile up to date so customers know exactly who you are.
        </p>
      </header>
      <ProfileForm />
    </div>
  );
}