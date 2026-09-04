'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, email: user.email },
  });

  const name = watch('name');
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const res = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      toast.success('Profile updated');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to update profile', error);
      toast.error('Failed to update profile');
    }
  };

  return (
    <section className="flex flex-col gap-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="bg-surface-inset flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
          <span className="text-lg font-semibold text-white">{initials || '?'}</span>
        </div>
        <p className="text-fg-muted text-sm">
          Avatar is generated from your name. Custom avatars are not supported.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-fg-secondary font-mono text-xs" htmlFor="profile-name">
            Display Name
          </label>
          <Input id="profile-name" autoComplete="name" {...register('name')} />
          {errors.name && <p className="text-danger font-mono text-xs">{errors.name.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-fg-secondary font-mono text-xs" htmlFor="profile-email">
            Email
          </label>
          <Input id="profile-email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-danger font-mono text-xs">{errors.email.message}</p>}
          <p className="text-fg-muted text-xs">To change your email, contact your administrator.</p>
        </div>
        <div>
          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </section>
  );
}
