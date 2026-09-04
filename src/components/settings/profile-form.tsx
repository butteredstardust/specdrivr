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
    <section className="border-line bg-surface-raised flex max-w-2xl flex-col gap-6 rounded-lg border p-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="bg-surface-inset text-fg flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
          <span className="text-lg font-semibold">{initials || '?'}</span>
        </div>
        <p className="text-fg-muted text-sm">
          Avatar is generated from your name. Custom avatars are not supported.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-fg-secondary text-xs" htmlFor="profile-name">
            Display name
          </label>
          <Input
            id="profile-name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'profile-name-error' : undefined}
            {...register('name')}
          />
          {errors.name && (
            <p id="profile-name-error" className="text-danger text-xs">
              {errors.name.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-fg-secondary text-xs" htmlFor="profile-email">
            Email
          </label>
          <Input
            id="profile-email"
            type="email"
            autoComplete="email"
            readOnly
            aria-readonly="true"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'profile-email-error' : 'profile-email-help'}
            className="bg-surface-inset"
            {...register('email')}
          />
          {errors.email && (
            <p id="profile-email-error" className="text-danger text-xs">
              {errors.email.message}
            </p>
          )}
          <p id="profile-email-help" className="text-fg-muted text-xs">
            To change your email, contact your administrator.
          </p>
        </div>
        <div>
          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </form>
    </section>
  );
}
