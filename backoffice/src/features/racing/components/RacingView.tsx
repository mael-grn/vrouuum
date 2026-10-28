import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Car as CarIcon,
  Plus,
  Trash2,
  Medal,
  Users,
  Flame,
  UserPlus,
  ChevronRight,
} from 'lucide-react';
import { racingApi } from '../api/racingApi';
import { calendarApi } from '@/features/calendar/api/calendarApi';
import { paddockApi } from '@/features/paddock/api/paddockApi';
import { competitionsApi } from '@/features/competitions/api/competitionsApi';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput, GlassSelect } from '@/components/ui/GlassInput';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { GlassModal } from '@/components/ui/GlassModal';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useToast } from '@/components/feedback/ToastContext';
import { TopBarBreadcrumb, TopBarActions } from '@/components/layout/TopBarContext';
import type { Entry } from '@/types';

export interface RacingViewProps {
  activeTab?: 'entries' | 'results';
  onTabChange?: (tab: 'entries' | 'results') => void;
}

export const RacingView: React.FC<RacingViewProps> = ({
  activeTab = 'entries',
}) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryForm, setEntryForm] = useState({
    team_id: 1,
    car_id: 1,
    category_id: 1,
    number: '51',
  });

  const [isAddPilotModalOpen, setIsAddPilotModalOpen] = useState(false);
  const [activeEntryForPilot, setActiveEntryForPilot] = useState<Entry | null>(null);
  const [selectedPilotId, setSelectedPilotId] = useState<number>(1);

  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultForm, setResultForm] = useState({
    entry_id: 1,
    number: '51',
    status: 'Finished',
    position: 1,
    laps_completed: 70,
    total_time: '1:32:45.120',
    best_lap: '1:18.420',
    point_gained: 25,
  });

  // Queries
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => calendarApi.getEvents(),
  });

  // Default select first event if none selected
  const activeEventId = selectedEventId || events[0]?.id;

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', activeEventId],
    queryFn: () => calendarApi.getSessions(activeEventId!),
    enabled: !!activeEventId,
  });

  const activeSessionId = selectedSessionId || sessions[0]?.id;

  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['entries', activeEventId],
    queryFn: () => racingApi.getEntries(activeEventId!),
    enabled: !!activeEventId,
  });

  const { data: results = [], isLoading: loadingResults } = useQuery({
    queryKey: ['results', activeSessionId],
    queryFn: () => racingApi.getSessionResults(activeSessionId!),
    enabled: !!activeSessionId,
  });

  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: paddockApi.getTeams });
  const { data: cars = [] } = useQuery({ queryKey: ['cars'], queryFn: () => paddockApi.getCars() });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: competitionsApi.getCategories,
  });
  const { data: pilots = [] } = useQuery({ queryKey: ['pilots'], queryFn: () => paddockApi.getPilots() });

  // Mutations
  const createEntryMutation = useMutation({
    mutationFn: (data: typeof entryForm) =>
      racingApi.createEntry(activeEventId!, {
        ...data,
        team_id: Number(data.team_id),
        car_id: Number(data.car_id),
        category_id: Number(data.category_id),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', activeEventId] });
      setIsEntryModalOpen(false);
      success('Engagement enregistré');
    },
    onError: (err: Error) => error(err.message),
  });

  const deleteEntryMutation = useMutation({
    mutationFn: racingApi.deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', activeEventId] });
      success('Engagement supprimé');
    },
    onError: (err: Error) => error(err.message),
  });

  const addPilotMutation = useMutation({
    mutationFn: ({ entryId, pilotId }: { entryId: number; pilotId: number }) =>
      racingApi.addPilotToEntry(entryId, pilotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', activeEventId] });
      setIsAddPilotModalOpen(false);
      success('Pilote associé à la voiture');
    },
    onError: (err: Error) => error(err.message),
  });

  const createResultMutation = useMutation({
    mutationFn: (data: typeof resultForm) =>
      racingApi.createSessionResult(activeSessionId!, {
        ...data,
        entry_id: Number(data.entry_id),
        position: Number(data.position),
        laps_completed: Number(data.laps_completed),
        point_gained: Number(data.point_gained),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results', activeSessionId] });
      setIsResultModalOpen(false);
      success('Résultat enregistré');
    },
    onError: (err: Error) => error(err.message),
  });

  const deleteResultMutation = useMutation({
    mutationFn: racingApi.deleteSessionResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results', activeSessionId] });
      success('Résultat supprimé');
    },
    onError: (err: Error) => error(err.message),
  });

  return (
    <div className="space-y-8">
      {/* Teleported Breadcrumb to Persistent Top Bar */}
      <TopBarBreadcrumb>
        <Link
          to="/course/engages"
          className="font-sans font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs sm:text-sm"
        >
          Course
        </Link>

        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />

        {/* Grand Prix Select */}
        <select
          value={activeEventId || ''}
          onChange={(e) => {
            const id = parseInt(e.target.value, 10);
            setSelectedEventId(id);
            setSelectedSessionId(null);
          }}
          className="bg-zinc-900 text-white font-sans font-medium text-xs px-2.5 py-1 rounded-xl border-none ring-1 ring-zinc-700 outline-none cursor-pointer max-w-[160px] sm:max-w-[220px] truncate"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id} className="bg-zinc-900 text-white">
              {ev.name}
            </option>
          ))}
        </select>

        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />

        <span className="font-sans font-bold italic text-white text-xs sm:text-sm">
          {activeTab === 'entries' ? `Engagés (${entries.length})` : `Classement (${results.length})`}
        </span>
      </TopBarBreadcrumb>

      {/* Teleported Actions to Persistent Top Bar */}
      <TopBarActions>
        {activeTab === 'entries' ? (
          <GlassButton
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsEntryModalOpen(true)}
          >
            Engager une voiture
          </GlassButton>
        ) : (
          <GlassButton
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsResultModalOpen(true)}
          >
            Ajouter résultat
          </GlassButton>
        )}
      </TopBarActions>

      {/* Sessions Filter (when available) */}
      {sessions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 border border-zinc-200 w-fit">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-2 font-bold">
            Séance :
          </span>
          {sessions.map((sess) => {
            const isActive = activeSessionId === sess.id;
            return (
              <button
                key={sess.id}
                onClick={() => setSelectedSessionId(sess.id)}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-racing-500 text-white shadow-flat-racing'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/70'
                }`}
              >
                {sess.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      {activeTab === 'entries' ? (
        <div className="space-y-5">

          {loadingEntries ? (
            <Loader />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={<CarIcon className="w-8 h-8 text-racing-scarlet" />}
              label="Aucune voiture engagée sur cet événement"
              actionLabel="Engager une voiture"
              onAction={() => setIsEntryModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {entries.map((entry) => {
                const team = teams.find((t) => t.id === entry.team_id);
                const car = cars.find((c) => c.id === entry.car_id);
                const cat = categories.find((c) => c.id === entry.category_id);

                return (
                  <GlassCard key={entry.id} className="p-5 flex flex-col justify-between group hover:border-racing-500/60">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-racing-500 to-racing-700 border-2 border-racing-400 flex items-center justify-center font-mono font-black text-2xl text-white shadow-flat-racing shrink-0">
                            #{entry.number}
                          </div>
                          <div>
                            <span className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-500 block">
                              {team?.name || `Écurie #${entry.team_id}`}
                            </span>
                            <h4 className="font-display font-black text-zinc-950 text-base tracking-tight leading-snug">
                              {car?.name || `Car #${entry.car_id}`}
                            </h4>
                          </div>
                        </div>

                        <GlassButton
                          variant="icon"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Supprimer l'engagement #${entry.number} ?`)) {
                              deleteEntryMutation.mutate(entry.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-racing-scarlet" />
                        </GlassButton>
                      </div>

                      {cat && (
                        <div className="mb-4">
                          <GlassBadge variant="gold" size="xs">
                            {cat.name}
                          </GlassBadge>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-zinc-500 flex items-center gap-1.5 uppercase">
                        <Users className="w-4 h-4 text-racing-500" />
                        Équipage
                      </span>
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        icon={<UserPlus className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setActiveEntryForPilot(entry);
                          setIsAddPilotModalOpen(true);
                        }}
                      >
                        Ajouter Pilote
                      </GlassButton>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Results View */
        <div className="space-y-5">

          {loadingResults ? (
            <Loader />
          ) : results.length === 0 ? (
            <EmptyState
              icon={<Medal className="w-8 h-8 text-racing-gold" />}
              label="Aucun résultat pour cette séance"
              actionLabel="Ajouter un résultat"
              onAction={() => setIsResultModalOpen(true)}
            />
          ) : (
            <div className="space-y-2.5">
              {results
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((res) => {
                  const isPodium = res.position <= 3;
                  const podiumBadges = {
                    1: 'bg-racing-gold text-slate-950 border-2 border-amber-300 font-black shadow-flat-racing',
                    2: 'bg-slate-200 text-slate-950 border-2 border-slate-100 font-black shadow-sm',
                    3: 'bg-amber-600 text-white border-2 border-amber-500 font-black shadow-sm',
                  };

                  return (
                    <GlassCard
                      key={res.id}
                      variant={isPodium ? 'solid' : 'default'}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                        res.position === 1 ? 'border-racing-gold/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Position Pill */}
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-display font-black text-base shrink-0 ${
                            isPodium
                              ? podiumBadges[res.position as 1 | 2 | 3]
                              : 'text-zinc-700 border-2 border-zinc-200 bg-zinc-100'
                          }`}
                        >
                          P{res.position}
                        </div>

                        {/* Number & Info */}
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-zinc-950 text-lg tracking-tight">
                            #{res.number}
                          </span>
                          <GlassBadge
                            variant={res.status === 'Finished' ? 'emerald' : 'crimson'}
                            size="xs"
                          >
                            {res.status}
                          </GlassBadge>
                        </div>
                      </div>

                      {/* Timings & Laps */}
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono">
                        {res.best_lap && (
                          <div className="flex items-center gap-1.5 text-racing-yellow font-black">
                            <Flame className="w-4 h-4 fill-current text-racing-scarlet" />
                            <span>{res.best_lap}</span>
                          </div>
                        )}
                        <span className="text-zinc-500 font-bold">{res.laps_completed} TOURS</span>
                        {res.total_time && (
                          <span className="text-zinc-950 font-black">{res.total_time}</span>
                        )}
                        <GlassBadge variant="racing" size="xs">
                          +{res.point_gained} PTS
                        </GlassBadge>
                      </div>

                      <GlassButton
                        variant="icon"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Supprimer le résultat P${res.position} ?`)) {
                            deleteResultMutation.mutate(res.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-racing-scarlet" />
                      </GlassButton>
                    </GlassCard>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Entry Modal */}
      <GlassModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title="Engager une voiture"
        icon={<CarIcon className="w-5 h-5" />}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createEntryMutation.mutate(entryForm);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase font-bold text-zinc-700 mb-1.5">Numéro</label>
              <GlassInput
                required
                placeholder="ex: 51, 7, 83"
                value={entryForm.number}
                onChange={(e) => setEntryForm({ ...entryForm, number: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase font-bold text-zinc-700 mb-1.5">Catégorie</label>
              <GlassSelect
                value={entryForm.category_id}
                onChange={(e) =>
                  setEntryForm({ ...entryForm, category_id: parseInt(e.target.value, 10) })
                }
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </GlassSelect>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase font-bold text-zinc-700 mb-1.5">Écurie</label>
            <GlassSelect
              value={entryForm.team_id}
              onChange={(e) =>
                setEntryForm({ ...entryForm, team_id: parseInt(e.target.value, 10) })
              }
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </GlassSelect>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase font-bold text-zinc-700 mb-1.5">Véhicule</label>
            <GlassSelect
              value={entryForm.car_id}
              onChange={(e) =>
                setEntryForm({ ...entryForm, car_id: parseInt(e.target.value, 10) })
              }
            >
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.power} ch)
                </option>
              ))}
            </GlassSelect>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setIsEntryModalOpen(false)}>
              Annuler
            </GlassButton>
            <GlassButton type="submit" variant="primary" loading={createEntryMutation.isPending}>
              Engager
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Add Pilot to Entry Modal */}
      <GlassModal
        isOpen={isAddPilotModalOpen}
        onClose={() => setIsAddPilotModalOpen(false)}
        title={`Associer un pilote (#${activeEntryForPilot?.number})`}
        icon={<Users className="w-5 h-5" />}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (activeEntryForPilot) {
              addPilotMutation.mutate({
                entryId: activeEntryForPilot.id,
                pilotId: Number(selectedPilotId),
              });
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-[11px] font-mono uppercase font-bold text-zinc-700 mb-1.5">Pilote</label>
            <GlassSelect
              value={selectedPilotId}
              onChange={(e) => setSelectedPilotId(parseInt(e.target.value, 10))}
            >
              {pilots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.surname} ({p.country})
                </option>
              ))}
            </GlassSelect>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setIsAddPilotModalOpen(false)}>
              Annuler
            </GlassButton>
            <GlassButton type="submit" variant="primary" loading={addPilotMutation.isPending}>
              Ajouter à l'équipage
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Session Result Modal */}
      <GlassModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title="Ajouter un résultat de séance"
        icon={<Medal className="w-5 h-5" />}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createResultMutation.mutate(resultForm);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase font-bold text-zinc-700 mb-1.5">Position</label>
              <GlassInput
                required
                type="number"
                min="1"
                value={resultForm.position}
                onChange={(e) =>
                  setResultForm({ ...resultForm, position: parseInt(e.target.value, 10) || 1 })
                }
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase font-bold text-zinc-700 mb-1.5">Numéro course</label>
              <GlassInput
                required
                value={resultForm.number}
                onChange={(e) => setResultForm({ ...resultForm, number: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase font-bold text-zinc-700 mb-1.5">Statut</label>
              <GlassSelect
                value={resultForm.status}
                onChange={(e) => setResultForm({ ...resultForm, status: e.target.value })}
              >
                <option value="Finished">Finished (Terminé)</option>
                <option value="DNF">DNF (Abandon)</option>
                <option value="DSQ">DSQ (Disqualifié)</option>
                <option value="DNS">DNS (Non partant)</option>
              </GlassSelect>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase font-bold text-zinc-700 mb-1.5">Tours complétés</label>
              <GlassInput
                required
                type="number"
                value={resultForm.laps_completed}
                onChange={(e) =>
                  setResultForm({
                    ...resultForm,
                    laps_completed: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase font-bold text-zinc-700 mb-1.5">Meilleur tour</label>
              <GlassInput
                placeholder="ex: 1:29.845"
                value={resultForm.best_lap}
                onChange={(e) => setResultForm({ ...resultForm, best_lap: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase font-bold text-zinc-700 mb-1.5">Points gagnés</label>
              <GlassInput
                type="number"
                value={resultForm.point_gained}
                onChange={(e) =>
                  setResultForm({
                    ...resultForm,
                    point_gained: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase font-bold text-zinc-700 mb-1.5">Temps total</label>
            <GlassInput
              placeholder="ex: 6:01:23.456"
              value={resultForm.total_time}
              onChange={(e) => setResultForm({ ...resultForm, total_time: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setIsResultModalOpen(false)}>
              Annuler
            </GlassButton>
            <GlassButton type="submit" variant="primary" loading={createResultMutation.isPending}>
              Enregistrer
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
};
