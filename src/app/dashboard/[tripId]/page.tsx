'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Trip, Participant } from '@/lib/types';

interface TripData {
  trip: Trip;
  participants: Participant[];
  stats: {
    total: number;
    not_started: number;
    in_progress: number;
    completed: number;
    abandoned: number;
    progress: number;
  };
  results: TripSummary[] | null;
}

interface TripSummary {
  title: string;
  description: string;
  highlights: string[];
  recommendation: string;
}

export default function TripDashboardPage() {
  const { tripId } = useParams();
  const searchParams = useSearchParams();
  const { user, supabase } = useAuth();
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const paymentStatus = searchParams.get('payment');
  const isLoadingRef = useRef(false);

  const fetchTripData = useCallback(async () => {
    if (!supabase || isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !tripId) {
      isLoadingRef.current = false;
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/trips/${tripId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setTripData(data);
      setShareUrl(`${window.location.origin}/join/${data.trip.share_code}`);
    }
    setLoading(false);
    isLoadingRef.current = false;
  }, [supabase, tripId]);

  useEffect(() => {
    if (user && tripId) {
      const timer = requestAnimationFrame(() => {
        fetchTripData();
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [user, tripId, fetchTripData]);

  const handleCheckout = async () => {
    if (!supabase) return;
    setProcessing(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !tripId) return;

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tripId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
    setProcessing(false);
  };

  const handleGenerateResults = async () => {
    if (!supabase) return;
    setProcessing(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !tripId) return;

    try {
      const res = await fetch('/api/generate-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tripId }),
      });

      if (res.ok) {
        fetchTripData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to generate results');
      }
    } catch (error) {
      console.error('Generate results error:', error);
    }
    setProcessing(false);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      not_started: 'bg-slate-100 text-slate-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      abandoned: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.not_started;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      completed: 'Completed',
      abandoned: 'Abandoned',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900">Trip not found</h2>
        <Link href="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const { trip, participants, stats, results } = tripData;

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 text-sm">
          ← Back to dashboard
        </Link>
      </div>

      {paymentStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          Payment successful! Your trip is now active.
        </div>
      )}

      {paymentStatus === 'cancelled' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6">
          Payment cancelled. You can still share the link but participants won&apos;t receive SMS until payment is completed.
        </div>
      )}

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{trip.name}</h1>
          {trip.description && (
            <p className="text-slate-600 mt-1">{trip.description}</p>
          )}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          trip.status === 'active' ? 'bg-green-100 text-green-700' :
          trip.status === 'completed' ? 'bg-blue-100 text-blue-700' :
          'bg-slate-100 text-slate-700'
        }`}>
          {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
        </div>
      </div>

      {trip.status === 'draft' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Activate Your Trip</h2>
          <p className="text-slate-600 text-sm mb-4">
            Complete payment to activate SMS features for your participants.
          </p>
          <button
            onClick={handleCheckout}
            disabled={processing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Pay $49 to Activate'}
          </button>
        </div>
      )}

      {trip.status === 'active' && (
        <>
          <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Share Link</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm"
              />
              <button
                onClick={copyShareLink}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-slate-500 text-xs mt-2">
              Share this link in your group chat. Participants will enter their phone number to receive SMS.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Progress</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                <div className="text-xs text-slate-600">Total</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{stats.in_progress}</div>
                <div className="text-xs text-slate-600">In Progress</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                <div className="text-xs text-slate-600">Completed</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{stats.progress}%</div>
                <div className="text-xs text-slate-600">Progress</div>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Participants</h2>
            {participants.length === 0 ? (
              <p className="text-slate-500 text-sm">No participants yet. Share your link to get started!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-slate-600 border-b border-slate-200">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Phone</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Reminders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant) => (
                      <tr key={participant.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 text-slate-900">{participant.name}</td>
                        <td className="py-3 text-slate-600 text-sm">{participant.phone}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(participant.status)}`}>
                            {getStatusLabel(participant.status)}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 text-sm">{participant.reminder_count}/2</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {stats.completed > 0 && (
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Generate Results</h2>
              <p className="text-slate-600 text-sm mb-4">
                {stats.completed} participant{stats.completed !== 1 ? 's' : ''} completed the survey. Generate results to see trip recommendations.
              </p>
              <button
                onClick={handleGenerateResults}
                disabled={processing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {processing ? 'Generating...' : 'Generate Results with AI'}
              </button>
            </div>
          )}
        </>
      )}

      {trip.status === 'completed' && results && (
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Trip Recommendations</h2>
          <div className="grid gap-6">
            {results.map((result, index) => (
              <div key={index} className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{result.title}</h3>
                <p className="text-slate-600 mb-4">{result.description}</p>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Highlights:</h4>
                  <ul className="list-disc list-inside text-sm text-slate-600">
                    {result.highlights?.map((highlight: string, i: number) => (
                      <li key={i}>{highlight}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Why This Suits Your Group:</h4>
                  <p className="text-sm text-blue-800">{result.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
