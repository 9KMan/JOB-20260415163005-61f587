'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { Trip } from '@/lib/types';

export default function DashboardPage() {
  const { user, supabase } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [newTripDescription, setNewTripDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const isLoadingRef = useRef(false);

  const fetchTrips = useCallback(async () => {
    if (!supabase || isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      isLoadingRef.current = false;
      setLoading(false);
      return;
    }

    const res = await fetch('/api/trips', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.ok) {
      const data = await res.json();
      setTrips(data.trips || []);
    }
    setLoading(false);
    isLoadingRef.current = false;
  }, [supabase]);

  useEffect(() => {
    if (user) {
      const timer = requestAnimationFrame(() => {
        fetchTrips();
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [user, fetchTrips]);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripName.trim() || !supabase) return;

    setCreating(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: newTripName,
          description: newTripDescription,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTrips(prevTrips => [data.trip, ...prevTrips]);
        setShowCreateModal(false);
        setNewTripName('');
        setNewTripDescription('');
      }
    } catch (error) {
      console.error('Error creating trip:', error);
    }
    setCreating(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-700',
      active: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      abandoned: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.draft;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Your Trips</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Create New Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <div className="text-4xl mb-4">🏌️</div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No trips yet</h2>
          <p className="text-slate-600 mb-6">Create your first group trip and start planning!</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create Your First Trip
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/dashboard/${trip.id}`}
              className="bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{trip.name}</h3>
                  {trip.description && (
                    <p className="text-slate-600 text-sm mt-1">{trip.description}</p>
                  )}
                  <p className="text-slate-500 text-xs mt-2">
                    Created {new Date(trip.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(trip.status)}`}>
                  {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Trip</h2>
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                  Trip Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  placeholder="e.g., Annual Golf Trip 2024"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={newTripDescription}
                  onChange={(e) => setNewTripDescription(e.target.value)}
                  placeholder="Brief description of the trip..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
