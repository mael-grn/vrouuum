import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { slugify, findBySlugOrId } from '@/utils/slug';
import {
  Wrench,
  Users,
  Shield,
  Plus,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Pencil,
} from 'lucide-react';
import { paddockApi } from '../api/paddockApi';
import type { Brand, Car, Team, Pilot } from '@/types';
import { getCachedCutout } from '../utils/carImageCutout';
import {
  resolveCarImageUrl,
  getBrandLogoUrl,
  resolveTeamLogoUrl,
  resolvePilotPhotoUrl,
} from '../utils/automotiveMedia';
import { BrandLogo } from './BrandLogo';
import { BrandTile } from './BrandTile';
import { TeamTile } from './TeamTile';
import { PilotTile } from './PilotTile';
import { CarTile } from './CarTile';
import { CarImageGeneratorBox } from './CarImageGeneratorBox';
import { BrandLogoGeneratorBox } from './BrandLogoGeneratorBox';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassCountrySelect } from '@/components/ui/GlassCountrySelect';
import { GlassModal } from '@/components/ui/GlassModal';
import { Loader } from '@/components/feedback/Loader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useToast } from '@/components/feedback/ToastContext';
import { TopBarBreadcrumb, TopBarActions } from '@/components/layout/TopBarContext';

export type PaddockTab = 'brands' | 'teams' | 'pilots' | 'cars';

export interface PaddockViewProps {
  activeTab?: PaddockTab;
  onTabChange?: (tab: PaddockTab) => void;
  selectedBrandId?: number | null;
  onSelectBrand?: (id: number | null) => void;
}

export const PaddockView: React.FC<PaddockViewProps> = ({
  activeTab = 'brands',
  selectedBrandId: controlledBrandId,
  onSelectBrand,
}) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { brandSlug } = useParams<{ brandSlug?: string }>();
  const navigate = useNavigate();

  // Internal state for selected brand when not controlled
  const [internalBrandId, setInternalBrandId] = useState<number | null>(null);
  const currentBrandId = controlledBrandId !== undefined ? controlledBrandId : internalBrandId;

  // Modals state
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandToDeleteWithCars, setBrandToDeleteWithCars] = useState<{
    brand: Brand;
    count: number;
  } | null>(null);
  const [brandForm, setBrandForm] = useState({ name: '', logo: '', country: '' });

  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [generatedCarImageUrl, setGeneratedCarImageUrl] = useState<string | null>(null);
  const [carForm, setCarForm] = useState({
    brand_id: 1,
    name: '',
    power: 680,
    weight: 1030,
    year: 2024,
  });

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamToDeleteWithEntries, setTeamToDeleteWithEntries] = useState<{
    team: Team;
    count: number;
  } | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '', logo: '', country: '' });

  const [isPilotModalOpen, setIsPilotModalOpen] = useState(false);
  const [editingPilot, setEditingPilot] = useState<Pilot | null>(null);
  const [pilotToDeleteWithEntries, setPilotToDeleteWithEntries] = useState<{
    pilot: Pilot;
    count: number;
  } | null>(null);
  const [pilotForm, setPilotForm] = useState({ name: '', surname: '', country: '', photo: '' });

  // Queries
  const { data: brands = [], isLoading: loadingBrands } = useQuery({
    queryKey: ['brands'],
    queryFn: paddockApi.getBrands,
  });

  const { data: cars = [], isLoading: loadingCars } = useQuery({
    queryKey: ['cars'],
    queryFn: () => paddockApi.getCars(),
  });

  const { data: teams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: paddockApi.getTeams,
  });

  const { data: pilots = [], isLoading: loadingPilots } = useQuery({
    queryKey: ['pilots'],
    queryFn: () => paddockApi.getPilots(),
  });

  // Currently viewed brand for the sub-page (URL parameter takes precedence)
  const activeBrand =
    (brandSlug ? findBySlugOrId(brands, brandSlug) : null) ||
    (currentBrandId ? brands.find((b) => b.id === currentBrandId) : null) ||
    null;
  const brandCars = activeBrand ? cars.filter((c) => c.brand_id === activeBrand.id) : [];

  const handleSelectBrand = (id: number | null) => {
    if (id === null) {
      if (onSelectBrand) onSelectBrand(null);
      setInternalBrandId(null);
      navigate('/paddock/marques');
    } else {
      const b = brands.find((item) => item.id === id);
      if (b) {
        if (onSelectBrand) onSelectBrand(b.id);
        setInternalBrandId(b.id);
        navigate(`/paddock/marques/${slugify(b.name)}/vehicules`);
      }
    }
  };

  // Mutations
  const createBrandMutation = useMutation({
    mutationFn: paddockApi.createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setIsBrandModalOpen(false);
      setEditingBrand(null);
      setBrandForm({ name: '', logo: '', country: '' });
      success('Constructeur ajouté');
    },
    onError: (err: Error) => error(err.message),
  });

  const updateBrandMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Brand> }) =>
      paddockApi.updateBrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setIsBrandModalOpen(false);
      setEditingBrand(null);
      success('Constructeur mis à jour');
    },
    onError: (err: Error) => error(err.message),
  });

  const deleteBrandMutation = useMutation({
    mutationFn: paddockApi.deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      setIsBrandModalOpen(false);
      setEditingBrand(null);
      setBrandToDeleteWithCars(null);
      handleSelectBrand(null);
      success('Constructeur supprimé');
    },
    onError: (err: Error) => error(err.message),
  });

  const createCarMutation = useMutation({
    mutationFn: paddockApi.createCar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      setIsCarModalOpen(false);
      setEditingCar(null);
      setGeneratedCarImageUrl(null);
      setCarForm({
        brand_id: activeBrand?.id || brands[0]?.id || 1,
        name: '',
        power: 680,
        weight: 1030,
        year: 2024,
      });
      success('Véhicule créé');
    },
    onError: (err: Error) => error(err.message),
  });

  const updateCarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Car> }) =>
      paddockApi.updateCar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      setIsCarModalOpen(false);
      setEditingCar(null);
      setGeneratedCarImageUrl(null);
      success('Véhicule mis à jour');
    },
    onError: (err: Error) => error(err.message),
  });

  const deleteCarMutation = useMutation({
    mutationFn: paddockApi.deleteCar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      setIsCarModalOpen(false);
      setEditingCar(null);
      setGeneratedCarImageUrl(null);
      success('Véhicule supprimé');
    },
    onError: (err: Error) => error(err.message),
  });


  const createTeamMutation = useMutation({
    mutationFn: paddockApi.createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setIsTeamModalOpen(false);
      setEditingTeam(null);
      setTeamForm({ name: '', logo: '', country: '' });
      success('Écurie inscrite');
    },
    onError: (err: Error) => error(err.message),
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; logo: string | null; country: string }> }) =>
      paddockApi.updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setIsTeamModalOpen(false);
      setEditingTeam(null);
      setTeamForm({ name: '', logo: '', country: '' });
      success('Écurie mise à jour');
    },
    onError: (err: Error) => error(err.message),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: paddockApi.deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      setIsTeamModalOpen(false);
      setEditingTeam(null);
      setTeamToDeleteWithEntries(null);
      success('Écurie retirée');
    },
    onError: (err: Error) => error(err.message),
  });

  const openCreateTeamModal = () => {
    setEditingTeam(null);
    setTeamForm({ name: '', logo: '', country: '' });
    setIsTeamModalOpen(true);
  };

  const openEditTeamModal = (team: Team) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      logo: team.logo || '',
      country: team.country,
    });
    setIsTeamModalOpen(true);
  };

  const handleDeleteTeamClick = (team: Team) => {
    const count = team.entries?.length || 0;
    if (count === 0) {
      deleteTeamMutation.mutate(team.id);
    } else {
      setTeamToDeleteWithEntries({ team, count });
    }
  };

  const createPilotMutation = useMutation({
    mutationFn: paddockApi.createPilot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilots'] });
      setIsPilotModalOpen(false);
      setEditingPilot(null);
      setPilotForm({ name: '', surname: '', country: '', photo: '' });
      success('Pilote enregistré');
    },
    onError: (err: Error) => error(err.message),
  });

  const updatePilotMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<{ name: string; surname: string; country: string; photo: string | null }>;
    }) => paddockApi.updatePilot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilots'] });
      setIsPilotModalOpen(false);
      setEditingPilot(null);
      setPilotForm({ name: '', surname: '', country: '', photo: '' });
      success('Pilote mis à jour');
    },
    onError: (err: Error) => error(err.message),
  });

  const deletePilotMutation = useMutation({
    mutationFn: paddockApi.deletePilot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilots'] });
      queryClient.invalidateQueries({ queryKey: ['racing'] });
      setIsPilotModalOpen(false);
      setEditingPilot(null);
      setPilotToDeleteWithEntries(null);
      success('Pilote retiré');
    },
    onError: (err: Error) => error(err.message),
  });

  const openCreatePilotModal = () => {
    setEditingPilot(null);
    setPilotForm({ name: '', surname: '', country: '', photo: '' });
    setIsPilotModalOpen(true);
  };

  const openEditPilotModal = (pilot: Pilot) => {
    setEditingPilot(pilot);
    setPilotForm({
      name: pilot.name,
      surname: pilot.surname,
      country: pilot.country || '',
      photo: pilot.photo || '',
    });
    setIsPilotModalOpen(true);
  };

  const handleDeletePilotClick = (pilot: Pilot) => {
    const count = pilot.entryPilots?.length || 0;
    if (count === 0) {
      deletePilotMutation.mutate(pilot.id);
    } else {
      setPilotToDeleteWithEntries({ pilot, count });
    }
  };

  const openCreateBrandModal = () => {
    setEditingBrand(null);
    setBrandForm({ name: '', logo: '', country: '' });
    setIsBrandModalOpen(true);
  };

  const openEditBrandModal = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandForm({
      name: brand.name,
      logo: brand.logo || getBrandLogoUrl(brand.name),
      country: brand.country || '',
    });
    setIsBrandModalOpen(true);
  };

  const handleDeleteBrandClick = (brand: Brand) => {
    const count = cars.filter((c) => c.brand_id === brand.id).length;
    if (count === 0) {
      deleteBrandMutation.mutate(brand.id);
    } else {
      setBrandToDeleteWithCars({ brand, count });
    }
  };

  const openCarModalForBrand = (brandId: number) => {
    setEditingCar(null);
    setCarForm({
      brand_id: brandId,
      name: '',
      power: 680,
      weight: 1030,
      year: 2024,
    });
    setGeneratedCarImageUrl(null);
    setIsCarModalOpen(true);
  };

  const openEditCarModal = async (car: Car) => {
    setEditingCar(car);
    setCarForm({
      brand_id: car.brand_id,
      name: car.name,
      power: car.power,
      weight: car.weight,
      year: car.year,
    });
    setGeneratedCarImageUrl(null);
    setIsCarModalOpen(true);

    const b = brands.find((br) => br.id === car.brand_id);
    const brandName = b?.name || activeBrand?.name || '';
    const cacheKey = `${brandName}_${car.name}_${car.year || ''}`.toLowerCase().trim();
    try {
      const cached = await getCachedCutout(cacheKey);
      if (cached) {
        setGeneratedCarImageUrl(cached);
      } else {
        const resolved = await resolveCarImageUrl(brandName, car.name, car.year);
        setGeneratedCarImageUrl(resolved);
      }
    } catch {
      // fallback smoothly
    }
  };

  const selectedCarFormBrand = brands.find((b) => b.id === Number(carForm.brand_id));

  return (
    <div className="space-y-8">
      {/* Teleported Breadcrumb to Persistent Top Bar */}
      <TopBarBreadcrumb>
        <Link
          to="/paddock/marques"
          className="font-sans font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs sm:text-sm"
        >
          Paddock
        </Link>

        {activeTab === 'brands' && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            {activeBrand ? (
              <>
                <Link
                  to="/paddock/marques"
                  className="font-sans font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs sm:text-sm underline-offset-4 hover:underline"
                >
                  Marques
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <Link
                  to={`/paddock/marques/${slugify(activeBrand.name)}/vehicules`}
                  className="font-sans font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs sm:text-sm"
                >
                  {activeBrand.name}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="font-sans font-bold italic text-racing-scarlet text-xs sm:text-sm">
                  Véhicules ({brandCars.length})
                </span>
              </>
            ) : (
              <span className="font-sans font-bold italic text-white text-xs sm:text-sm">
                Marques ({brands.length})
              </span>
            )}
          </>
        )}

        {activeTab === 'teams' && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="font-sans font-bold italic text-white text-xs sm:text-sm">
              Écuries ({teams.length})
            </span>
          </>
        )}

        {activeTab === 'pilots' && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="font-sans font-bold italic text-white text-xs sm:text-sm">
              Pilotes ({pilots.length})
            </span>
          </>
        )}

        {activeTab === 'cars' && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="font-sans font-bold italic text-white text-xs sm:text-sm">
              Véhicules ({cars.length})
            </span>
          </>
        )}
      </TopBarBreadcrumb>

      {/* Teleported Actions to Persistent Top Bar */}
      <TopBarActions>
        {activeTab === 'brands' && (
          <>
            {activeBrand ? (
              <>
                <GlassButton
                  variant="secondary"
                  size="sm"
                  icon={<ArrowLeft className="w-3.5 h-3.5" />}
                  onClick={() => handleSelectBrand(null)}
                >
                  Retour aux marques
                </GlassButton>
                <GlassButton
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => openCarModalForBrand(activeBrand.id)}
                >
                  Créer un véhicule
                </GlassButton>
              </>
            ) : (
              <GlassButton
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={openCreateBrandModal}
              >
                Ajouter Constructeur
              </GlassButton>
            )}
          </>
        )}

        {activeTab === 'teams' && (
          <GlassButton
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={openCreateTeamModal}
          >
            Ajouter Écurie
          </GlassButton>
        )}

        {activeTab === 'pilots' && (
          <GlassButton
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={openCreatePilotModal}
          >
            Ajouter Pilote
          </GlassButton>
        )}
      </TopBarActions>

      {/* ========================================================================= */}
      {/* BRANDS VIEW (Marques & Sous-page Véhicules)                               */}
      {/* ========================================================================= */}
      {(activeTab === 'brands' || activeTab === 'cars') && (
        <div>
          {loadingBrands || loadingCars ? (
            <Loader />
          ) : activeBrand ? (
            /* SUB-PAGE: Brand's Vehicles */
            <div className="space-y-6">
              {/* Brand Title: Logo and Name directly in the page */}
              <div className="flex items-center gap-3 py-1">
                <BrandLogo
                  name={activeBrand.name}
                  logo={activeBrand.logo}
                  frameless
                  className="w-10 h-10 sm:w-12 sm:h-12 shrink-0"
                />
                <h1 className="font-display font-black text-3xl sm:text-4xl text-zinc-950 tracking-tight uppercase italic leading-none">
                  {activeBrand.name}
                </h1>
                <button
                  type="button"
                  onClick={() => openEditBrandModal(activeBrand)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors ml-1 cursor-pointer"
                  title="Modifier le constructeur"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {/* Vehicles Grid */}
              {brandCars.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 sm:py-28 text-center select-none">
                  <p className="font-sans text-sm sm:text-base font-medium text-zinc-500 mb-4">
                    Aucun véhicule pour {activeBrand.name}
                  </p>
                  <GlassButton
                    variant="primary"
                    size="md"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => openCarModalForBrand(activeBrand.id)}
                  >
                    Créer un véhicule
                  </GlassButton>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {brandCars.map((car) => (
                    <CarTile
                      key={car.id}
                      car={car}
                      brandName={activeBrand.name}
                      onClick={openEditCarModal}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : brands.length === 0 ? (
            <EmptyState
              icon={<Wrench className="w-8 h-8 text-racing-scarlet" />}
              label="Aucun constructeur enregistré"
              actionLabel="Ajouter un constructeur"
              onAction={openCreateBrandModal}
            />
          ) : (
            /* BRANDS TILES GRID */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {brands.map((brand) => {
                const count = cars.filter((c) => c.brand_id === brand.id).length;
                return (
                  <BrandTile
                    key={brand.id}
                    brand={brand}
                    vehicleCount={count}
                    onClick={handleSelectBrand}
                    onEdit={openEditBrandModal}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TEAMS VIEW                                                                */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <div>
          {loadingTeams ? (
            <Loader />
          ) : teams.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <p className="font-sans text-sm font-medium text-zinc-400 mb-4">
                Aucune écurie enregistrée
              </p>
              <GlassButton
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={openCreateTeamModal}
              >
                Ajouter une écurie
              </GlassButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {teams.map((team) => (
                <TeamTile
                  key={team.id}
                  team={team}
                  onClick={openEditTeamModal}
                  onEdit={openEditTeamModal}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PILOTS VIEW                                                               */}
      {/* ========================================================================= */}
      {activeTab === 'pilots' && (
        <div>
          {loadingPilots ? (
            <Loader />
          ) : pilots.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <p className="font-sans text-sm font-medium text-zinc-400 mb-4">
                Aucun pilote enregistré
              </p>
              <GlassButton
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={openCreatePilotModal}
              >
                Ajouter un pilote
              </GlassButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {pilots.map((pilot) => (
                <PilotTile
                  key={pilot.id}
                  pilot={pilot}
                  onClick={openEditPilotModal}
                  onEdit={openEditPilotModal}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CAR (Créer / Modifier un véhicule)                                  */}
      {/* ========================================================================= */}
      <GlassModal
        isOpen={isCarModalOpen}
        onClose={() => {
          setIsCarModalOpen(false);
          setEditingCar(null);
          setGeneratedCarImageUrl(null);
        }}
        title={editingCar ? 'Modifier le véhicule' : 'Créer un véhicule'}
        variant="editor"
        headerRight={
          selectedCarFormBrand ? (
            <div className="flex items-center gap-2.5">
              <BrandLogo
                name={selectedCarFormBrand.name}
                logo={selectedCarFormBrand.logo}
                size="sm"
                frameless
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              />
              <span className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight font-display">
                {selectedCarFormBrand.name}
              </span>
            </div>
          ) : null
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingCar) {
              updateCarMutation.mutate({
                id: editingCar.id,
                data: {
                  brand_id: Number(carForm.brand_id),
                  name: carForm.name,
                  power: Number(carForm.power),
                  weight: Number(carForm.weight),
                  year: Number(carForm.year),
                },
              });
            } else {
              if (!generatedCarImageUrl) return;
              createCarMutation.mutate({
                brand_id: Number(carForm.brand_id),
                name: carForm.name,
                power: Number(carForm.power),
                weight: Number(carForm.weight),
                year: Number(carForm.year),
              });
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left column: Vehicle visual generator */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {selectedCarFormBrand && (
                <CarImageGeneratorBox
                  brandName={selectedCarFormBrand.name}
                  modelName={carForm.name}
                  year={carForm.year}
                  generatedImageUrl={generatedCarImageUrl}
                  onGenerated={(url) => setGeneratedCarImageUrl(url)}
                />
              )}
            </div>

            {/* Right column: Form inputs & Actions */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-3.5">
                {/* Model name with animated floating label */}
                <GlassInput
                  required
                  label="Modèle / Nom"
                  placeholder="ex: 499P, 963, Valkyrie AMR-LMH, M4 GT3"
                  value={carForm.name}
                  onChange={(e) => {
                    setCarForm({ ...carForm, name: e.target.value });
                    setGeneratedCarImageUrl(null);
                  }}
                />

                {/* Technical Specs with animated floating labels */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <GlassInput
                      required
                      type="number"
                      label="Puissance (ch)"
                      value={carForm.power}
                      onChange={(e) =>
                        setCarForm({ ...carForm, power: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <GlassInput
                      required
                      type="number"
                      label="Poids (kg)"
                      value={carForm.weight}
                      onChange={(e) =>
                        setCarForm({ ...carForm, weight: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <GlassInput
                      required
                      type="number"
                      label="Année"
                      value={carForm.year}
                      onChange={(e) => {
                        setCarForm({ ...carForm, year: parseInt(e.target.value, 10) || 2024 });
                        setGeneratedCarImageUrl(null);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-2 pt-2">
                {editingCar ? (
                  <GlassButton
                    type="button"
                    variant="ghost"
                    className="text-racing-scarlet hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (confirm(`Supprimer définitivement le véhicule ${editingCar.name} ?`)) {
                        deleteCarMutation.mutate(editingCar.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Supprimer
                  </GlassButton>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <GlassButton
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsCarModalOpen(false);
                      setEditingCar(null);
                      setGeneratedCarImageUrl(null);
                    }}
                  >
                    Annuler
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    variant="primary"
                    disabled={
                      editingCar
                        ? !carForm.name.trim() || updateCarMutation.isPending
                        : !generatedCarImageUrl || createCarMutation.isPending
                    }
                    loading={editingCar ? updateCarMutation.isPending : createCarMutation.isPending}
                  >
                    {editingCar ? 'Enregistrer' : 'Créer le véhicule'}
                  </GlassButton>
                </div>
              </div>
            </div>
          </div>
        </form>
      </GlassModal>

      {/* ========================================================================= */}
      {/* MODAL: BRAND (Créer / Modifier un constructeur)                            */}
      {/* ========================================================================= */}
      <GlassModal
        isOpen={isBrandModalOpen}
        onClose={() => {
          setIsBrandModalOpen(false);
          setEditingBrand(null);
        }}
        title={editingBrand ? 'Modifier le constructeur' : 'Créer un constructeur'}
        variant="editor"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingBrand) {
              updateBrandMutation.mutate({
                id: editingBrand.id,
                data: {
                  name: brandForm.name,
                  logo: brandForm.logo || undefined,
                  country: brandForm.country,
                },
              });
            } else {
              createBrandMutation.mutate({
                name: brandForm.name,
                logo: brandForm.logo || undefined,
                country: brandForm.country,
              });
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left column: Brand logo generator with particle cloud */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <BrandLogoGeneratorBox
                brandName={brandForm.name}
                logoUrl={brandForm.logo || null}
                onGenerated={(url) => {
                  setBrandForm((prev) => ({ ...prev, logo: url || '' }));
                }}
              />
            </div>

            {/* Right column: Form inputs & Actions */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-3.5">
                {/* Brand Name with animated floating label */}
                <GlassInput
                  required
                  label="Nom du constructeur"
                  placeholder="ex: Ferrari, Porsche, Toyota, Aston Martin"
                  value={brandForm.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setBrandForm((prev) => ({
                      ...prev,
                      name: newName,
                      ...(editingBrand ? {} : { logo: '' }),
                    }));
                  }}
                />

                {/* Country Dropdown with flags loaded via API */}
                <GlassCountrySelect
                  required
                  label="Pays d'origine"
                  value={brandForm.country}
                  onChange={(c) => setBrandForm((prev) => ({ ...prev, country: c }))}
                />

                {/* Logo URL with animated floating label - updated dynamically */}
                <GlassInput
                  label="URL du Logo"
                  placeholder="Généré automatiquement ou lien personnalisé"
                  value={brandForm.logo}
                  onChange={(e) => setBrandForm((prev) => ({ ...prev, logo: e.target.value }))}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-2 pt-2">
                {editingBrand ? (
                  <GlassButton
                    type="button"
                    variant="ghost"
                    className="text-racing-scarlet hover:text-red-700 hover:bg-red-50"
                    loading={deleteBrandMutation.isPending}
                    onClick={() => handleDeleteBrandClick(editingBrand)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Supprimer
                  </GlassButton>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <GlassButton
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsBrandModalOpen(false);
                      setEditingBrand(null);
                    }}
                  >
                    Annuler
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    variant="primary"
                    disabled={
                      editingBrand
                        ? !brandForm.name.trim() || updateBrandMutation.isPending
                        : !brandForm.name.trim() || createBrandMutation.isPending
                    }
                    loading={editingBrand ? updateBrandMutation.isPending : createBrandMutation.isPending}
                  >
                    {editingBrand ? 'Enregistrer' : 'Créer le constructeur'}
                  </GlassButton>
                </div>
              </div>
            </div>
          </div>
        </form>
      </GlassModal>

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM BRAND DELETION (Quand la marque possède des véhicules)     */}
      {/* ========================================================================= */}
      <GlassModal
        isOpen={Boolean(brandToDeleteWithCars)}
        onClose={() => setBrandToDeleteWithCars(null)}
        title="Supprimer le constructeur"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-1">
          <p className="font-sans text-sm text-zinc-700 leading-relaxed">
            Le constructeur <strong className="text-zinc-950 font-bold">{brandToDeleteWithCars?.brand.name}</strong> possède{' '}
            <strong className="text-racing-scarlet font-bold">
              {brandToDeleteWithCars?.count} {brandToDeleteWithCars?.count === 1 ? 'véhicule enregistré' : 'véhicules enregistrés'}
            </strong>.
          </p>
          <div className="p-3 rounded-xl bg-red-50/80 border border-red-200/60 text-xs font-sans text-red-700 leading-normal">
            La suppression de ce constructeur entraînera également la suppression définitive de tous ses véhicules.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <GlassButton
              type="button"
              variant="ghost"
              onClick={() => setBrandToDeleteWithCars(null)}
            >
              Annuler
            </GlassButton>
            <GlassButton
              type="button"
              variant="primary"
              className="bg-racing-scarlet hover:bg-red-700 border-red-600 text-white"
              loading={deleteBrandMutation.isPending}
              onClick={() => {
                if (brandToDeleteWithCars) {
                  deleteBrandMutation.mutate(brandToDeleteWithCars.brand.id);
                }
              }}
            >
              Supprimer définitivement
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* ========================================================================= */}
      {/* MODAL: TEAM (Création & Modification)                                     */}
      {/* ========================================================================= */}
      <GlassModal
        isOpen={isTeamModalOpen}
        onClose={() => {
          setIsTeamModalOpen(false);
          setEditingTeam(null);
        }}
        title={editingTeam ? "Modifier l'écurie" : 'Nouvelle écurie'}
        icon={<Shield className="w-5 h-5 text-racing-scarlet" />}
        maxWidth="3xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingTeam) {
              updateTeamMutation.mutate({
                id: editingTeam.id,
                data: {
                  name: teamForm.name,
                  logo: teamForm.logo || null,
                  country: teamForm.country,
                },
              });
            } else {
              createTeamMutation.mutate({
                name: teamForm.name,
                logo: teamForm.logo || undefined,
                country: teamForm.country,
              });
            }
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left column: Team Logo Generator Box with Particle Wave */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <BrandLogoGeneratorBox
                name={teamForm.name}
                logoUrl={teamForm.logo || null}
                placeholderType="team"
                resolveUrl={resolveTeamLogoUrl}
                onGenerated={(url) => {
                  setTeamForm((prev) => ({ ...prev, logo: url || '' }));
                }}
              />
            </div>

            {/* Right column: Form inputs & Actions */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-3.5">
                {/* Team Name with animated floating label */}
                <GlassInput
                  required
                  label="Nom de l'écurie"
                  placeholder="ex: AF Corse, Porsche Penske, Scuderia Ferrari"
                  value={teamForm.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setTeamForm((prev) => ({
                      ...prev,
                      name: newName,
                      ...(editingTeam ? {} : { logo: '' }),
                    }));
                  }}
                />

                {/* Country Dropdown with flags loaded via API */}
                <GlassCountrySelect
                  required
                  label="Pays sous licence"
                  value={teamForm.country}
                  onChange={(c) => setTeamForm((prev) => ({ ...prev, country: c }))}
                />

                {/* Logo URL with animated floating label - updated dynamically */}
                <GlassInput
                  label="URL du Logo"
                  placeholder="Généré automatiquement ou lien personnalisé"
                  value={teamForm.logo}
                  onChange={(e) => setTeamForm((prev) => ({ ...prev, logo: e.target.value }))}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-2 pt-2">
                {editingTeam ? (
                  <GlassButton
                    type="button"
                    variant="ghost"
                    className="text-racing-scarlet hover:text-red-700 hover:bg-red-50"
                    loading={deleteTeamMutation.isPending}
                    onClick={() => handleDeleteTeamClick(editingTeam)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Supprimer
                  </GlassButton>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <GlassButton
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsTeamModalOpen(false);
                      setEditingTeam(null);
                    }}
                  >
                    Annuler
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    variant="primary"
                    disabled={
                      editingTeam
                        ? !teamForm.name.trim() || updateTeamMutation.isPending
                        : !teamForm.name.trim() || createTeamMutation.isPending
                    }
                    loading={editingTeam ? updateTeamMutation.isPending : createTeamMutation.isPending}
                  >
                    {editingTeam ? 'Enregistrer' : "Inscrire l'écurie"}
                  </GlassButton>
                </div>
              </div>
            </div>
          </div>
        </form>
      </GlassModal>

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM TEAM DELETION (Quand l'écurie possède des engagements)     */}
      {/* ========================================================================= */}
      <GlassModal
        isOpen={Boolean(teamToDeleteWithEntries)}
        onClose={() => setTeamToDeleteWithEntries(null)}
        title="Supprimer l'écurie"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-1">
          <p className="font-sans text-sm text-zinc-700 leading-relaxed">
            L'écurie <strong className="text-zinc-950 font-bold">{teamToDeleteWithEntries?.team.name}</strong> possède{' '}
            <strong className="text-racing-scarlet font-bold">
              {teamToDeleteWithEntries?.count} {teamToDeleteWithEntries?.count === 1 ? 'engagement enregistré' : 'engagements enregistrés'}
            </strong>.
          </p>
          <div className="p-3 rounded-xl bg-red-50/80 border border-red-200/60 text-xs font-sans text-red-700 leading-normal">
            La suppression de cette écurie entraînera également la suppression définitive de tous ses engagements en compétition.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <GlassButton
              type="button"
              variant="ghost"
              onClick={() => setTeamToDeleteWithEntries(null)}
            >
              Annuler
            </GlassButton>
            <GlassButton
              type="button"
              variant="primary"
              className="bg-racing-scarlet hover:bg-red-700 border-red-600 text-white"
              loading={deleteTeamMutation.isPending}
              onClick={() => {
                if (teamToDeleteWithEntries) {
                  deleteTeamMutation.mutate(teamToDeleteWithEntries.team.id);
                }
              }}
            >
              Supprimer définitivement
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* ========================================================================= */}
      {/* MODAL: PILOT (Création & Modification)                                    */}
      {/* ========================================================================= */}
      <GlassModal
        isOpen={isPilotModalOpen}
        onClose={() => {
          setIsPilotModalOpen(false);
          setEditingPilot(null);
        }}
        title={editingPilot ? 'Modifier le pilote' : 'Nouveau pilote'}
        icon={<Users className="w-5 h-5 text-racing-scarlet" />}
        maxWidth="3xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingPilot) {
              updatePilotMutation.mutate({
                id: editingPilot.id,
                data: {
                  name: pilotForm.name,
                  surname: pilotForm.surname,
                  country: pilotForm.country,
                  photo: pilotForm.photo || null,
                },
              });
            } else {
              createPilotMutation.mutate({
                name: pilotForm.name,
                surname: pilotForm.surname,
                country: pilotForm.country,
                photo: pilotForm.photo || undefined,
              });
            }
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left column: Pilot Photo Generator Box with Particle Wave */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <BrandLogoGeneratorBox
                name={`${pilotForm.name} ${pilotForm.surname}`.trim()}
                logoUrl={pilotForm.photo || null}
                placeholderType="pilot"
                resolveUrl={resolvePilotPhotoUrl}
                onGenerated={(url) => {
                  setPilotForm((prev) => ({ ...prev, photo: url || '' }));
                }}
              />
            </div>

            {/* Right column: Form inputs & Actions */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  {/* First Name */}
                  <GlassInput
                    required
                    label="Prénom"
                    placeholder="ex: Charles"
                    value={pilotForm.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setPilotForm((prev) => ({
                        ...prev,
                        name: newName,
                        ...(editingPilot ? {} : { photo: '' }),
                      }));
                    }}
                  />

                  {/* Surname */}
                  <GlassInput
                    required
                    label="Nom"
                    placeholder="ex: Leclerc"
                    value={pilotForm.surname}
                    onChange={(e) => {
                      const newSurname = e.target.value;
                      setPilotForm((prev) => ({
                        ...prev,
                        surname: newSurname,
                        ...(editingPilot ? {} : { photo: '' }),
                      }));
                    }}
                  />
                </div>

                {/* Country Dropdown with flags loaded via API */}
                <GlassCountrySelect
                  required
                  label="Nationalité / Pays"
                  value={pilotForm.country}
                  onChange={(c) => setPilotForm((prev) => ({ ...prev, country: c }))}
                />

                {/* Photo URL with animated floating label - updated dynamically */}
                <GlassInput
                  label="URL de la Photo"
                  placeholder="Généré automatiquement ou lien personnalisé"
                  value={pilotForm.photo}
                  onChange={(e) => setPilotForm((prev) => ({ ...prev, photo: e.target.value }))}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-2 pt-2">
                {editingPilot ? (
                  <GlassButton
                    type="button"
                    variant="ghost"
                    className="text-racing-scarlet hover:text-red-700 hover:bg-red-50"
                    loading={deletePilotMutation.isPending}
                    onClick={() => handleDeletePilotClick(editingPilot)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Supprimer
                  </GlassButton>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <GlassButton
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsPilotModalOpen(false);
                      setEditingPilot(null);
                    }}
                  >
                    Annuler
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    variant="primary"
                    disabled={
                      editingPilot
                        ? !pilotForm.name.trim() || !pilotForm.surname.trim() || updatePilotMutation.isPending
                        : !pilotForm.name.trim() || !pilotForm.surname.trim() || createPilotMutation.isPending
                    }
                    loading={editingPilot ? updatePilotMutation.isPending : createPilotMutation.isPending}
                  >
                    {editingPilot ? 'Enregistrer' : 'Enregistrer le pilote'}
                  </GlassButton>
                </div>
              </div>
            </div>
          </div>
        </form>
      </GlassModal>

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM PILOT DELETION (Quand le pilote a des engagements)         */}
      {/* ========================================================================= */}
      <GlassModal
        isOpen={Boolean(pilotToDeleteWithEntries)}
        onClose={() => setPilotToDeleteWithEntries(null)}
        title="Supprimer le pilote"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-1">
          <p className="font-sans text-sm text-zinc-700 leading-relaxed">
            Le pilote{' '}
            <strong className="text-zinc-950 font-bold">
              {pilotToDeleteWithEntries?.pilot.name} {pilotToDeleteWithEntries?.pilot.surname}
            </strong>{' '}
            possède{' '}
            <strong className="text-racing-scarlet font-bold">
              {pilotToDeleteWithEntries?.count}{' '}
              {pilotToDeleteWithEntries?.count === 1 ? 'engagement enregistré' : 'engagements enregistrés'}
            </strong>.
          </p>
          <div className="p-3 rounded-xl bg-red-50/80 border border-red-200/60 text-xs font-sans text-red-700 leading-normal">
            La suppression de ce pilote entraînera également son retrait définitif de tous les équipages en compétition.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <GlassButton
              type="button"
              variant="ghost"
              onClick={() => setPilotToDeleteWithEntries(null)}
            >
              Annuler
            </GlassButton>
            <GlassButton
              type="button"
              variant="primary"
              className="bg-racing-scarlet hover:bg-red-700 border-red-600 text-white"
              loading={deletePilotMutation.isPending}
              onClick={() => {
                if (pilotToDeleteWithEntries) {
                  deletePilotMutation.mutate(pilotToDeleteWithEntries.pilot.id);
                }
              }}
            >
              Supprimer définitivement
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
};
