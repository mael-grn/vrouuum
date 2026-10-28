import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { findBySlugOrId } from '@/utils/slug';
import {
  Compass,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Flag,
  Gauge,
  ChevronRight,
} from 'lucide-react';
import { calendarApi } from '../api/calendarApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput, GlassSelect } from '@/components/ui/GlassInput';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { GlassModal } from '@/components/ui/GlassModal';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useToast } from '@/components/feedback/ToastContext';
import { TopBarBreadcrumb, TopBarActions } from '@/components/layout/TopBarContext';
import type { Event } from '@/types';

export interface CalendarViewProps {
  activeTab?: 'events' | 'circuits';
  onTabChange?: (tab: 'events' | 'circuits') => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  activeTab = 'events',
}) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { eventId } = useParams<{ eventId?: string }>();
  const navigate = useNavigate();

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Modals state
  const [isCircuitModalOpen, setIsCircuitModalOpen] = useState(false);
  const [circuitForm, setCircuitForm] = useState({ name: '', country: '', length: 5.4, type: 'permanent' });

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ name: '', date: '', season_id: 1, circuit_id: 1 });

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({ name: 'Race', type: 'race', date: '' });

  // Queries
  const { data: circuits = [], isLoading: loadingCircuits } = useQuery({
    queryKey: ['circuits'],
    queryFn: calendarApi.getCircuits,
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['events'],
    queryFn: () => calendarApi.getEvents(),
  });

  // Active event resolution: from URL eventId param or local state
  const activeEvent = (eventId ? findBySlugOrId(events, eventId) : null) || selectedEvent;

  const handleSelectEvent = (ev: Event | null) => {
    setSelectedEvent(ev);
    if (ev) {
      navigate(`/calendrier/evenements/${ev.id}`);
    } else {
      navigate('/calendrier/evenements');
    }
  };

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['sessions', activeEvent?.id],
    queryFn: () => calendarApi.getSessions(activeEvent!.id),
    enabled: !!activeEvent,
  });

  // Circuit Mutations
  const createCircuitMutation = useMutation({
    mutationFn: calendarApi.createCircuit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circuits'] });
      setIsCircuitModalOpen(false);
      setCircuitForm({ name: '', country: '', length: 5.4, type: 'permanent' });
      success('Circuit ajouté');
    },
    onError: (err: Error) => error(err.message),
  });

  const deleteCircuitMutation = useMutation({
    mutationFn: calendarApi.deleteCircuit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circuits'] });
      success('Circuit supprimé');
    },
    onError: (err: Error) => error(err.message),
  });

  // Event Mutations
  const createEventMutation = useMutation({
    mutationFn: calendarApi.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsEventModalOpen(false);
      setEventForm({ name: '', date: '', season_id: 1, circuit_id: 1 });
      success('Événement créé');
    },
    onError: (err: Error) => error(err.message),
  });

  const deleteEventMutation = useMutation({
    mutationFn: calendarApi.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      if (activeEvent) handleSelectEvent(null);
      success('Événement supprimé');
    },
    onError: (err: Error) => error(err.message),
  });

  // Session Mutations
  const createSessionMutation = useMutation({
    mutationFn: (data: { name: string; type: string; date: string }) =>
      calendarApi.createSession(activeEvent!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', activeEvent?.id] });
      setIsSessionModalOpen(false);
      setSessionForm({ name: 'Race', type: 'race', date: '' });
      success('Séance ajoutée');
    },
    onError: (err: Error) => error(err.message),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: calendarApi.deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', activeEvent?.id] });
      success('Séance supprimée');
    },
    onError: (err: Error) => error(err.message),
  });

  return (
    <div className="space-y-8">
      {/* Teleported Breadcrumb to Persistent Top Bar */}
      <TopBarBreadcrumb>
        <Link
          to="/calendrier/evenements"
          className="font-sans font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs sm:text-sm"
        >
          Calendrier
        </Link>

        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />

        {activeTab === 'events' ? (
          <>
            {activeEvent ? (
              <>
                <Link
                  to="/calendrier/evenements"
                  onClick={() => handleSelectEvent(null)}
                  className="font-sans font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs sm:text-sm underline-offset-4 hover:underline"
                >
                  Événements
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="font-sans font-bold italic text-white text-xs sm:text-sm truncate max-w-[180px] sm:max-w-xs">
                  {activeEvent.name}
                </span>
              </>
            ) : (
              <span className="font-sans font-bold italic text-white text-xs sm:text-sm">
                Événements ({events.length})
              </span>
            )}
          </>
        ) : (
          <span className="font-sans font-bold italic text-white text-xs sm:text-sm">
            Circuits ({circuits.length})
          </span>
        )}
      </TopBarBreadcrumb>

      {/* Teleported Actions to Persistent Top Bar */}
      <TopBarActions>
        {activeTab === 'events' ? (
          <GlassButton
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsEventModalOpen(true)}
          >
            Ajouter Événement
          </GlassButton>
        ) : (
          <GlassButton
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsCircuitModalOpen(true)}
          >
            Ajouter Circuit
          </GlassButton>
        )}
      </TopBarActions>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Events List */}
          <div className="lg:col-span-7 space-y-3">
            {loadingEvents ? (
              <Loader />
            ) : events.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-8 h-8 text-racing-scarlet" />}
                label="Aucun événement au calendrier"
                actionLabel="Ajouter un événement"
                onAction={() => setIsEventModalOpen(true)}
              />
            ) : (
              events.map((ev) => {
                const circuit = circuits.find((c) => c.id === ev.circuit_id);
                const isSelected = activeEvent?.id === ev.id;
                return (
                  <GlassCard
                    key={ev.id}
                    variant={isSelected ? 'solid' : 'default'}
                    glow={isSelected ? 'racing' : 'none'}
                    onClick={() => handleSelectEvent(ev)}
                    className={`p-4 cursor-pointer transition-all flex items-center justify-between ${
                      isSelected ? 'border-racing-500 ring-2 ring-racing-500/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-13 h-13 p-2 rounded-2xl bg-racing-50 border-2 border-racing-200 flex flex-col items-center justify-center text-racing-600 font-mono shrink-0">
                        <span className="text-[10px] font-black uppercase text-racing-scarlet">EV</span>
                        <span className="text-base font-black">#{ev.id}</span>
                      </div>
                      <div>
                        <h4 className="font-display font-black text-zinc-950 text-base tracking-tight leading-snug">
                          {ev.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-xs font-mono text-zinc-500 flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-racing-500" />
                            {ev.date}
                          </span>
                          {circuit && (
                            <GlassBadge variant="neutral" size="xs">
                              {circuit.name}
                            </GlassBadge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <GlassButton
                        variant="icon"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Supprimer ${ev.name} ?`)) {
                            deleteEventMutation.mutate(ev.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-racing-scarlet" />
                      </GlassButton>
                      <ChevronRight
                        className={`w-5 h-5 text-zinc-400 transition-transform ${
                          isSelected ? 'rotate-90 text-racing-500' : ''
                        }`}
                      />
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>

          {/* Sessions Inspector for Selected Event */}
          <div className="lg:col-span-5">
            <GlassCard className="p-5 sticky top-6 border border-zinc-200/90 bg-zinc-50 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-racing-500" />
                  <h3 className="font-display font-black text-sm uppercase text-zinc-950 tracking-tight">
                    {activeEvent ? `Séances : ${activeEvent.name}` : 'Séances de course'}
                  </h3>
                </div>
                {activeEvent && (
                  <GlassButton
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setIsSessionModalOpen(true)}
                  >
                    Séance
                  </GlassButton>
                )}
              </div>

              {!activeEvent ? (
                <div className="py-12 text-center text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Sélectionnez un événement pour gérer ses séances
                </div>
              ) : loadingSessions ? (
                <Loader size="sm" />
              ) : sessions.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-zinc-400">
                  Aucune séance configurée
                </div>
              ) : (
                <div className="space-y-2.5">
                  {sessions.map((sess) => {
                    const typeColor =
                       sess.type === 'race' ? 'racing' : sess.type === 'qualifying' ? 'gold' : 'neutral';
                    return (
                      <div
                        key={sess.id}
                        className="p-3.5 rounded-2xl bg-white border border-zinc-200 flex items-center justify-between shadow-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-zinc-950">{sess.name}</span>
                            <GlassBadge variant={typeColor} size="xs">
                              {sess.type}
                            </GlassBadge>
                          </div>
                          <span className="text-[11px] font-mono text-zinc-500 font-semibold">{sess.date}</span>
                        </div>
                        <GlassButton
                          variant="icon"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Supprimer la séance ${sess.name} ?`)) {
                              deleteSessionMutation.mutate(sess.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-racing-scarlet" />
                        </GlassButton>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}

      {/* Circuits Tab */}
      {activeTab === 'circuits' && (
        <div>
          {loadingCircuits ? (
            <Loader />
          ) : circuits.length === 0 ? (
            <EmptyState
              icon={<Compass className="w-8 h-8 text-racing-scarlet" />}
              label="Aucun circuit enregistré"
              actionLabel="Ajouter un circuit"
              onAction={() => setIsCircuitModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {circuits.map((circuit) => (
                <GlassCard key={circuit.id} className="p-5 flex flex-col justify-between group hover:border-racing-500/60">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display font-black text-zinc-950 text-lg tracking-tight leading-tight">
                          {circuit.name}
                        </h3>
                        <span className="text-xs text-zinc-500 font-bold flex items-center gap-1.5 mt-1.5">
                          <Flag className="w-3.5 h-3.5 text-racing-500" />
                          {circuit.country}
                        </span>
                      </div>
                      <GlassButton
                        variant="icon"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Supprimer ${circuit.name} ?`)) {
                            deleteCircuitMutation.mutate(circuit.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-racing-scarlet" />
                      </GlassButton>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 font-black text-racing-scarlet text-sm">
                      <Gauge className="w-4 h-4 text-racing-500" />
                      {circuit.length} <span className="text-[10px] text-zinc-500 font-bold">KM</span>
                    </span>
                    <GlassBadge variant="neutral" size="xs">
                      {circuit.type}
                    </GlassBadge>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Circuit Modal */}
      <GlassModal
        isOpen={isCircuitModalOpen}
        onClose={() => setIsCircuitModalOpen(false)}
        title="Nouveau Circuit"
        icon={<Compass className="w-5 h-5" />}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createCircuitMutation.mutate({
              name: circuitForm.name,
              country: circuitForm.country,
              length: Number(circuitForm.length),
              type: circuitForm.type,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Nom du Circuit</label>
            <GlassInput
              required
              placeholder="ex: Circuit de Spa-Francorchamps"
              value={circuitForm.name}
              onChange={(e) => setCircuitForm({ ...circuitForm, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Pays</label>
              <GlassInput
                required
                placeholder="ex: Belgique"
                value={circuitForm.country}
                onChange={(e) => setCircuitForm({ ...circuitForm, country: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Longueur (km)</label>
              <GlassInput
                required
                type="number"
                step="0.001"
                value={circuitForm.length}
                onChange={(e) =>
                  setCircuitForm({ ...circuitForm, length: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Type</label>
            <GlassSelect
              value={circuitForm.type}
              onChange={(e) => setCircuitForm({ ...circuitForm, type: e.target.value })}
            >
              <option value="permanent">Permanent</option>
              <option value="street">Urbain / Street</option>
              <option value="mixed">Mixte</option>
            </GlassSelect>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setIsCircuitModalOpen(false)}>
              Annuler
            </GlassButton>
            <GlassButton type="submit" variant="primary" loading={createCircuitMutation.isPending}>
              Créer
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Add Event Modal */}
      <GlassModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title="Nouvel Événement"
        icon={<Calendar className="w-5 h-5" />}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createEventMutation.mutate({
              name: eventForm.name,
              date: eventForm.date,
              season_id: Number(eventForm.season_id),
              circuit_id: Number(eventForm.circuit_id),
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Nom de l'épreuve</label>
            <GlassInput
              required
              placeholder="ex: 24 Heures du Mans"
              value={eventForm.name}
              onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Circuit</label>
              <GlassSelect
                value={eventForm.circuit_id}
                onChange={(e) =>
                  setEventForm({ ...eventForm, circuit_id: parseInt(e.target.value, 10) })
                }
              >
                {circuits.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.country})
                  </option>
                ))}
              </GlassSelect>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Date</label>
              <GlassInput
                required
                type="date"
                value={eventForm.date}
                onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">ID Saison</label>
            <GlassInput
              required
              type="number"
              value={eventForm.season_id}
              onChange={(e) =>
                setEventForm({ ...eventForm, season_id: parseInt(e.target.value, 10) || 1 })
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setIsEventModalOpen(false)}>
              Annuler
            </GlassButton>
            <GlassButton type="submit" variant="primary" loading={createEventMutation.isPending}>
              Créer
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Add Session Modal */}
      <GlassModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        title="Ajouter une séance"
        icon={<Clock className="w-5 h-5" />}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createSessionMutation.mutate(sessionForm);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Nom</label>
            <GlassInput
              required
              placeholder="ex: Qualifications, Essais Libres 1, Course"
              value={sessionForm.name}
              onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Type</label>
              <GlassSelect
                value={sessionForm.type}
                onChange={(e) => setSessionForm({ ...sessionForm, type: e.target.value })}
              >
                <option value="practice">Essais Libres (Practice)</option>
                <option value="qualifying">Qualifications</option>
                <option value="race">Course (Race)</option>
              </GlassSelect>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Date et Heure</label>
              <GlassInput
                required
                type="datetime-local"
                value={sessionForm.date}
                onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setIsSessionModalOpen(false)}>
              Annuler
            </GlassButton>
            <GlassButton type="submit" variant="primary" loading={createSessionMutation.isPending}>
              Ajouter
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
};
