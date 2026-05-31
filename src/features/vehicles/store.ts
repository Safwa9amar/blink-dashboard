import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SEED_VEHICLES, type Vehicle, type DocKey, type DocStatus } from "./data";
import type { NewVehicleInput } from "./types";

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

// Maps a DocKey → the status field on the Vehicle record.
const STATUS_FIELD: Record<DocKey, keyof Vehicle> = {
  grayCard: "grayCardStatus",
  insurance: "insuranceStatus",
  drivingLicense: "drivingLicenseStatus",
};

interface VehiclesState {
  vehicles: Vehicle[];

  addVehicle: (input: NewVehicleInput) => Vehicle;
  updateVehicle: (id: string, patch: Partial<NewVehicleInput>) => void;
  deleteVehicle: (id: string) => void;

  // Ops document review — set a single embedded document's status.
  setDocStatus: (id: string, key: DocKey, status: DocStatus) => void;

  reset: () => void;
}

export const useVehiclesStore = create<VehiclesState>()(
  persist(
    (set) => ({
      vehicles: SEED_VEHICLES,

      addVehicle: (input) => {
        const vehicle: Vehicle = { id: uid("veh"), createdAt: Date.now(), ...input };
        set((s) => ({ vehicles: [vehicle, ...s.vehicles] }));
        return vehicle;
      },
      updateVehicle: (id, patch) =>
        set((s) => ({ vehicles: s.vehicles.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteVehicle: (id) => set((s) => ({ vehicles: s.vehicles.filter((x) => x.id !== id) })),

      setDocStatus: (id, key, status) =>
        set((s) => ({
          vehicles: s.vehicles.map((x) =>
            x.id === id ? { ...x, [STATUS_FIELD[key]]: status } : x
          ),
        })),

      reset: () => set({ vehicles: SEED_VEHICLES }),
    }),
    {
      name: "blink-vehicles",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ vehicles: s.vehicles }),
    }
  )
);

let rehydrated = false;
export function useHydrateVehicles() {
  useEffect(() => {
    if (!rehydrated) {
      rehydrated = true;
      void useVehiclesStore.persist.rehydrate();
    }
  }, []);
}
