import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Lock, Globe, MapPin, Twitter, Instagram, BookMarked, Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { LoadingState } from '@/components/Shared';

export function AccountSettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [goodreads, setGoodreads] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setWebsite(profile.website || '');
      setTwitter(profile.twitter || '');
      setInstagram(profile.instagram || '');
      setGoodreads(profile.goodreads || '');
    }
  }, [profile]);

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!profile) return <LoadingState />;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileSaved(false);
    await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        bio,
        location,
        website,
        twitter,
        instagram,
        goodreads,
      })
      .eq('id', user.id);
    await refreshProfile();
    setSavingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setSavingPassword(true);
    // verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    });
    if (signInError) {
      setPasswordMsg({ type: 'error', text: 'Current password is incorrect.' });
      setSavingPassword(false);
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (updateError) {
      setPasswordMsg({ type: 'error', text: updateError.message });
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="eyebrow">Account</p>
        <h1 className="mt-3 section-heading">Account settings</h1>
        <p className="mt-4 text-lg text-ink-400">
          Manage your profile, social links, and password.
        </p>
      </div>

      {/* Profile section */}
      <form onSubmit={saveProfile} className="mt-10 card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-500">
            <UserIcon className="h-5 w-5" />
          </span>
          <h2 className="font-serif text-xl font-semibold text-navy-500">Profile</h2>
        </div>

        <div className="mt-6 space-y-5">
          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gold-400 font-serif text-2xl font-bold text-navy-700">
              {(displayName || user.email || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-navy-500">Avatar</p>
              <p className="text-xs text-ink-400">Your initials are used as your avatar placeholder.</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="input-field mt-1.5"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Tell readers about yourself…"
              className="input-field mt-1.5 resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Location</label>
              <div className="relative mt-1.5">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, country"
                  className="input-field pl-11"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Website</label>
              <div className="relative mt-1.5">
                <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://…"
                  className="input-field pl-11"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social links */}
        <h3 className="mt-8 font-serif text-base font-semibold text-navy-500">Social links</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Twitter / X</label>
            <div className="relative mt-1.5">
              <Twitter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="@handle"
                className="input-field pl-11"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Instagram</label>
            <div className="relative mt-1.5">
              <Instagram className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@handle"
                className="input-field pl-11"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Goodreads</label>
            <div className="relative mt-1.5">
              <BookMarked className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
              <input
                type="text"
                value={goodreads}
                onChange={(e) => setGoodreads(e.target.value)}
                placeholder="username"
                className="input-field pl-11"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {savingProfile ? 'Saving…' : 'Save profile'}
          </button>
          {profileSaved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" /> Profile saved
            </span>
          )}
        </div>
      </form>

      {/* Password section */}
      <form onSubmit={changePassword} className="mt-8 card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-500">
            <Lock className="h-5 w-5" />
          </span>
          <h2 className="font-serif text-xl font-semibold text-navy-500">Change password</h2>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Current password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field mt-1.5"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">New password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input-field mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Confirm new password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field mt-1.5"
              />
            </div>
          </div>
        </div>

        {passwordMsg && (
          <div className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            passwordMsg.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            {passwordMsg.type === 'error' ? (
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            ) : (
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
            )}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <button type="submit" disabled={savingPassword} className="btn-primary mt-6">
          {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {savingPassword ? 'Updating…' : 'Update password'}
        </button>
      </form>

      {/* Danger zone */}
      <div className="mt-8 card border-red-200 p-6 sm:p-8">
        <h2 className="font-serif text-lg font-semibold text-navy-500">Sign out</h2>
        <p className="mt-2 text-sm text-ink-400">Sign out of your account on this device.</p>
        <button
          onClick={() => signOut().then(() => navigate('/'))}
          className="btn-outline mt-4 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
