import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "vehicle-store" });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

export interface VehicleProfile {
  id: string;
  name: string;
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  engine?: string;
  mileage?: number;
  /** Linked adapter profile ID */
  adapterProfileId?: string;
}

export interface VehicleState {
  /** Currently active vehicle */
  activeVehicle: VehicleProfile | null;
  /** All saved vehicle profiles */
  vehicles: VehicleProfile[];
  /** Preferred units */
  units: {
    speed: "kmh" | "mph";
    temperature: "celsius" | "fahrenheit";
    pressure: "kpa" | "psi";
  };

  // Actions
  setActiveVehicle(vehicle: VehicleProfile | null): void;
  addVehicle(vehicle: VehicleProfile): void;
  updateVehicle(id: string, updates: Partial<VehicleProfile>): void;
  removeVehicle(id: string): void;
  setUnits(units: Partial<VehicleState["units"]>): void;
}

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set) => ({
      activeVehicle: null,
      vehicles: [],
      units: {
        speed: "kmh",
        temperature: "celsius",
        pressure: "kpa",
      },

      setActiveVehicle: (vehicle) => set({ activeVehicle: vehicle }),

      addVehicle: (vehicle) =>
        set((state) => ({ vehicles: [...state.vehicles, vehicle] })),

      updateVehicle: (id, updates) =>
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
          activeVehicle:
            state.activeVehicle?.id === id
              ? { ...state.activeVehicle, ...updates }
              : state.activeVehicle,
        })),

      removeVehicle: (id) =>
        set((state) => ({
          vehicles: state.vehicles.filter((v) => v.id !== id),
          activeVehicle:
            state.activeVehicle?.id === id ? null : state.activeVehicle,
        })),

      setUnits: (units) =>
        set((state) => ({ units: { ...state.units, ...units } })),
    }),
    {
      name: "vehicle-store",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
