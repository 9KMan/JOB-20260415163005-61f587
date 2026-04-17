'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Trip } from '@/lib/types';

export default function JoinPage() {
  const { shareCode } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isLoadingRef = useRef(false);

  const fetchTrip = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    try {
      const res = await fetch(`/api/trips/share/${shareCode}`);
      if (res.ok) {
        const data = await res.json();
        setTrip(data.trip);
      } else {
        setError('Trip not found or no longer active');
      }
    } catch {
      setError('Failed to load trip');
    }
    setLoading(false);
    isLoadingRef.current = false;
  }, [shareCode]);

  useEffect(() => {
    if (shareCode) {
      const timer = requestAnimationFrame(() => {
        fetchTrip();
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [shareCode, fetchTrip]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-sm border border-slate-200">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Trip Not Found</h1>
          <p className="text-slate-600">{error || 'This trip may have expired or is no longer active.'}</p>
        </div>
      </div>
    );
  }

  return <JoinForm trip={trip} />;
}

function JoinForm({ trip }: { trip: Trip }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentTerms || !consentPrivacy) {
      setError('Please accept both consent checkboxes');
      return;
    }

    setLoading(true);
    setError('');

    const phoneDigits = phone.replace(/\D/g, '');

    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          name,
          phone: phoneDigits,
          consentTerms,
          consentPrivacy,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to register');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-sm border border-slate-200">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">You&apos;re In!</h1>
          <p className="text-slate-600 mb-4">
            Thanks, {name}! You&apos;ll receive an SMS shortly with your first survey question.
          </p>
          <p className="text-sm text-slate-500">
            Keep an eye on your texts — we&apos;ll send you about 12 questions over the next few minutes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Join Trip</h1>
        <p className="text-slate-600 mb-6">{trip.name}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              We&apos;ll send SMS survey questions to this number.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={consentTerms}
                onChange={(e) => setConsentTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">
                I agree to the{' '}
                <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={consentPrivacy}
                onChange={(e) => setConsentPrivacy(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">
                I consent to receive SMS messages for this trip survey. Message and data rates may apply.
              </span>
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !consentTerms || !consentPrivacy}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Join Trip'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Your phone number will only be used for this trip survey and will never be shared.
        </p>
      </div>
    </div>
  );
}
