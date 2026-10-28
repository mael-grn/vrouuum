import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Tag, Calendar, Plus, Trash2, Edit2, ChevronRight } from 'lucide-react';
import { competitionsApi } from '../api/competitionsApi';
import { slugify, findBySlugOrId } from '@/utils/slug';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { GlassModal } from '@/components/ui/GlassModal';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useToast } from '@/components/feedback/ToastContext';
import { TopBarBreadcrumb, TopBarActions } from '@/components/layout/TopBarContext';
import type { Championship } from '@/types';

export const CompetitionsView: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { championshipSlug } = useParams<{ championshipSlug?: string }>();
  const navigate = useNavigate();

  const [selectedChampionship, setSelectedChampionship] = useState<Championship | null>(null);
  const [isChampionshipModalOpen, setIsChampionshipModalOpen] = useState(false);
  const [editingChampionship, setEditingChampionship] = useState<Championship | null>(null);
  const [champName, setChampName] = useState('');
  const [champLogo, setChampLogo] = useState('');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catLogo, setCatLogo] = useState('');

  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [seasonName, setSeasonName] = useState('');

  // Queries
  const { data: championships = [], isLoading: loadingChamps } = useQuery({
    queryKey: ['championships'],
    queryFn: competitionsApi.getChampionships,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: competitionsApi.getCategories,
  });

  // Active championship resolution: URL param takes precedence
  const activeChampionship =
    (championshipSlug ? findBySlugOrId(championships, championshipSlug) : null) || selectedChampionship;

  const handleSelectChampionship = (champ: Championship | null) => {
    setSelectedChampionship(champ);
    if (champ) {
      navigate(`/competitions/${slugify(champ.name)}`);
    } else {
      navigate('/competitions');
    }
  };

  const { data: seasons = [], isLoading: loadingSeasons } = useQuery({
    queryKey: ['seasons', activeChampionship?.id],
    queryFn: () => competitionsApi.getSeasons(activeChampionship!.id),
    enabled: !!activeChampionship,
  });

  // Mutations
  const createChampMutation = useMutation({
    mutationFn: competitionsApi.createChampionship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['championships'] });
      setIsChampionshipModalOpen(false);
      setChampName('');
      setChampLogo('');
      success('Championnat créé');
    },
    onError: (err: Error) => error(err.message),
  });

  const updateChampMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; logo?: string } }) =>
      competitionsApi.updateChampionship(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['championships'] });
      setIsChampionshipModalOpen(false);
      setEditingChampionship(null);
      success('Championnat mis à jour');
    },
    onError: (err: Error) => error(err.message),
  });

  const deleteChampMutation = useMutation({
    mutationFn: competitionsApi.deleteChampionship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['championships'] });
      if (activeChampionship) handleSelectChampionship(null);
      success('Championnat supprimé');
    },
    onError: (err: Error) => error(err.message),
  });

  const createCatMutation = useMutation({
    mutationFn: competitionsApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCategoryModalOpen(false);
      setCatName('');
      setCatLogo('');
      success('Catégorie ajoutée');
    },
    onError: (err: Error) => error(err.message),
  });

  const deleteCatMutation = useMutation({
    mutationFn: competitionsApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      success('Catégorie retirée');
    },
    onError: (err: Error) => error(err.message),
  });

  const createSeasonMutation = useMutation({
    mutationFn: (name: string) =>
      competitionsApi.createSeason(activeChampionship!.id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons', activeChampionship?.id] });
      setIsSeasonModalOpen(false);
      setSeasonName('');
      success('Saison ajoutée');
    },
    onError: (err: Error) => error(err.message),
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: competitionsApi.deleteSeason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons', activeChampionship?.id] });
      success('Saison supprimée');
    },
    onError: (err: Error) => error(err.message),
  });

  const handleOpenChampModal = (champ?: Championship) => {
    if (champ) {
      setEditingChampionship(champ);
      setChampName(champ.name);
      setChampLogo(champ.logo || '');
    } else {
      setEditingChampionship(null);
      setChampName('');
      setChampLogo('');
    }
    setIsChampionshipModalOpen(true);
  };

  const handleSaveChamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!champName.trim()) return;
    if (editingChampionship) {
      updateChampMutation.mutate({
        id: editingChampionship.id,
        data: { name: champName, logo: champLogo || undefined },
      });
    } else {
      createChampMutation.mutate({
        name: champName,
        logo: champLogo || undefined,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Teleported Breadcrumb to Persistent Top Bar */}
      <TopBarBreadcrumb>
        {activeChampionship ? (
          <>
            <Link
              to="/competitions"
              onClick={() => handleSelectChampionship(null)}
              className="font-sans font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs sm:text-sm underline-offset-4 hover:underline"
            >
              Compétitions
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="font-sans font-bold italic text-white text-xs sm:text-sm truncate max-w-[200px] sm:max-w-xs">
              {activeChampionship.name}
            </span>
          </>
        ) : (
          <span className="font-sans font-bold italic text-white text-xs sm:text-sm">
            Compétitions ({championships.length})
          </span>
        )}
      </TopBarBreadcrumb>

      {/* Teleported Actions to Persistent Top Bar */}
      <TopBarActions>
        <GlassButton
          variant="secondary"
          size="sm"
          icon={<Tag className="w-3.5 h-3.5 text-racing-gold" />}
          onClick={() => setIsCategoryModalOpen(true)}
        >
          Catégories ({categories.length})
        </GlassButton>
        <GlassButton
          variant="primary"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => handleOpenChampModal()}
        >
          Ajouter Championnat
        </GlassButton>
      </TopBarActions>

      {/* Grid of Championships */}
      {loadingChamps ? (
        <Loader />
      ) : championships.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-8 h-8 text-racing-scarlet" />}
          label="Aucun championnat configuré"
          actionLabel="Créer un championnat"
          onAction={() => handleOpenChampModal()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {championships.map((champ) => {
            const isSelected = activeChampionship?.id === champ.id;
            return (
              <GlassCard
                key={champ.id}
                variant={isSelected ? 'solid' : 'default'}
                glow={isSelected ? 'racing' : 'none'}
                onClick={() => handleSelectChampionship(champ)}
                className={`p-5 cursor-pointer transition-all ${
                  isSelected ? 'border-racing-500 ring-2 ring-racing-500/30' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3.5">
                    {champ.logo ? (
                      <div className="w-14 h-14 rounded-2xl bg-zinc-100 p-2 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        <img
                          src={champ.logo}
                          alt={champ.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-racing-50 border-2 border-racing-200 flex items-center justify-center text-racing-600 font-black text-xl italic font-display shrink-0">
                        {champ.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-display font-black text-zinc-950 text-base tracking-tight leading-snug">
                        {champ.name}
                      </h3>
                      <span className="text-[11px] font-mono text-zinc-500 font-bold uppercase">
                        ID #{champ.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <GlassButton
                      variant="icon"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenChampModal(champ);
                      }}
                      aria-label="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-zinc-500" />
                    </GlassButton>
                    <GlassButton
                      variant="icon"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Supprimer ce championnat ?')) {
                          deleteChampMutation.mutate(champ.id);
                        }
                      }}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-racing-scarlet" />
                    </GlassButton>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5 font-mono font-bold uppercase text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-racing-500" />
                    Saisons
                  </span>
                  <GlassBadge variant={isSelected ? 'racing' : 'neutral'} size="xs">
                    {isSelected ? 'Actif' : 'Sélectionner'}
                  </GlassBadge>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Selected Championship Inspector (Seasons & Categories) */}
      <AnimatePresence>
        {activeChampionship && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-8 space-y-4 bg-zinc-50 border border-zinc-200/90 rounded-3xl p-5 sm:p-6 shadow-sm"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-racing-500" />
                <h3 className="font-display font-black text-base sm:text-lg text-zinc-950 uppercase italic">
                  Saisons de {activeChampionship.name}
                </h3>
              </div>
              <GlassButton
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsSeasonModalOpen(true)}
              >
                Nouvelle saison
              </GlassButton>
            </div>

            {loadingSeasons ? (
              <Loader size="sm" />
            ) : seasons.length === 0 ? (
              <GlassCard variant="subtle" className="p-6 text-center text-xs text-zinc-500 font-mono">
                Aucune saison pour ce championnat
              </GlassCard>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {seasons.map((season) => (
                  <GlassCard
                    key={season.id}
                    variant="interactive"
                    className="p-3.5 flex items-center justify-between group"
                  >
                    <div className="flex flex-col">
                      <span className="font-black text-base text-zinc-950 font-mono tracking-tight">
                        {season.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono uppercase font-bold">
                        #{season.id}
                      </span>
                    </div>
                    <GlassButton
                      variant="icon"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        if (confirm(`Supprimer la saison ${season.name} ?`)) {
                          deleteSeasonMutation.mutate(season.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-racing-scarlet" />
                    </GlassButton>
                  </GlassCard>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Championship Modal */}
      <GlassModal
        isOpen={isChampionshipModalOpen}
        onClose={() => setIsChampionshipModalOpen(false)}
        title={editingChampionship ? 'Éditer championnat' : 'Nouveau championnat'}
        icon={<Trophy className="w-5 h-5" />}
      >
        <form onSubmit={handleSaveChamp} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase font-bold text-zinc-700 mb-1.5">
              Nom du championnat
            </label>
            <GlassInput
              required
              placeholder="ex: World Endurance Championship (WEC)"
              value={champName}
              onChange={(e) => setChampName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase font-bold text-zinc-700 mb-1.5">
              Logo URL
            </label>
            <GlassInput
              placeholder="https://..."
              value={champLogo}
              onChange={(e) => setChampLogo(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <GlassButton
              type="button"
              variant="ghost"
              onClick={() => setIsChampionshipModalOpen(false)}
            >
              Annuler
            </GlassButton>
            <GlassButton type="submit" variant="primary" loading={createChampMutation.isPending}>
              Enregistrer
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Categories Modal */}
      <GlassModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Gestion des Catégories"
        icon={<Tag className="w-5 h-5" />}
      >
        <div className="space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (catName.trim()) createCatMutation.mutate({ name: catName, logo: catLogo || undefined });
            }}
            className="flex gap-2"
          >
            <GlassInput
              required
              placeholder="Nom (ex: Hypercar, LMGT3)"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
            <GlassButton type="submit" variant="primary" icon={<Plus className="w-4 h-4" />}>
              Créer
            </GlassButton>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-200"
              >
                <div className="flex items-center gap-2.5">
                  <GlassBadge variant="racing" size="xs">
                    #{cat.id}
                  </GlassBadge>
                  <span className="text-sm font-bold text-zinc-900">{cat.name}</span>
                </div>
                <GlassButton
                  variant="icon"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Supprimer la catégorie ${cat.name} ?`)) {
                      deleteCatMutation.mutate(cat.id);
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-racing-scarlet" />
                </GlassButton>
              </div>
            ))}
          </div>
        </div>
      </GlassModal>

      {/* Season Modal */}
      <GlassModal
        isOpen={isSeasonModalOpen}
        onClose={() => setIsSeasonModalOpen(false)}
        title="Ajouter une saison"
        icon={<Calendar className="w-5 h-5" />}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (seasonName.trim()) createSeasonMutation.mutate(seasonName);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-[11px] font-mono uppercase font-bold text-zinc-700 mb-1.5">
              Année / Édition
            </label>
            <GlassInput
              required
              placeholder="ex: 2024 ou 2024-2025"
              value={seasonName}
              onChange={(e) => setSeasonName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setIsSeasonModalOpen(false)}>
              Annuler
            </GlassButton>
            <GlassButton type="submit" variant="primary" loading={createSeasonMutation.isPending}>
              Ajouter
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
};
