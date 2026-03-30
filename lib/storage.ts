import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from 'expo-sharing';
import { v4 as uuidv4 } from 'uuid';

export const createId = () => uuidv4();

export interface Party {
  id: string;
  title: string;
  name: string;
  contact: string;
  city: string;
  address: string;
  createdAt: number;
}

export interface Company {
  id: string;
  partyId: string;
  companyName: string;
  agentName?: string;
  godownName: string;
  date: string;
  source: 'add' | 'unload';
  createdAt: number;
}

export interface Godown {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  companyId: string;
  itemName: string;
  quantity: number;
  createdAt: number;
}

export interface Vehicle {
  id: string;
  partyId: string;
  vehicleNumber: string;
  nameBoard: string;
  vehicleType: string;
  deliveryAt: string;
  date: string;
  createdAt: number;
}

export interface GodownStock {
  id: string;
  itemId: string;
  godownName: string;
  loadedQuantity: number;
  vehicleNumber: string;
  date: string;
  createdAt: number;
}

const DB_FILE = FileSystem.documentDirectory + "stock.json";
export const storage = {
  async ensureInitialized() {
    try {
      const exists = await FileSystem.getInfoAsync(DB_FILE);
      if (!exists.exists) {
        const godowns = [];
        for (let i = 1; i <= 10; i++) {
          godowns.push({ id: createId(), name: `KA-${i.toString().padStart(2, '0')}` });
        }
        await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify({ parties: [], companies: [], godowns, items: [], vehicles: [], godownStocks: [] }));
      } else {
        // Check if it's the old format (array), migrate
        const data = await FileSystem.readAsStringAsync(DB_FILE);
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const godowns = [];
          for (let i = 1; i <= 10; i++) {
            godowns.push({ id: createId(), name: `KA-${i.toString().padStart(2, '0')}` });
          }
          await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify({ parties: parsed, companies: [], godowns, items: [], vehicles: [], godownStocks: [] }));
        } else if (!parsed.godowns) {
          // Add godowns if missing
          const godowns = [];
          for (let i = 1; i <= 10; i++) {
            godowns.push({ id: createId(), name: `KA-${i.toString().padStart(2, '0')}` });
          }
          parsed.godowns = godowns;
          parsed.items = parsed.items || [];
          parsed.vehicles = parsed.vehicles || [];
          parsed.godownStocks = parsed.godownStocks || [];
          await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(parsed));
        }
      }
    } catch (error) {
      console.error("Error initializing storage:", error);
    }
  },

  async downloadJSON() {
    const fileUri = FileSystem.documentDirectory + 'backup.json';

    const data = await FileSystem.readAsStringAsync(DB_FILE);

    await FileSystem.writeAsStringAsync(fileUri, data);

    await Sharing.shareAsync(fileUri);
  },

  async getParties(): Promise<Party[]> {
    try {
      await this.ensureInitialized();
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      return db.parties || [];
    } catch (error) {
      console.error("Error reading parties:", error);
      return [];
    }
  },

  async addParty(party: Omit<Party, "id" | "createdAt">): Promise<Party> {
    try {
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      const newParty: Party = {
        ...party,
        id: createId(),
        createdAt: Date.now(),
      };
      db.parties.push(newParty);
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db));
      return newParty;
    } catch (error) {
      console.error("Error adding party:", error);
      throw error;
    }
  },

  async deleteParty(id: string): Promise<void> {
    try {
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      db.parties = db.parties.filter((p: Party) => p.id !== id);
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db));
    } catch (error) {
      console.error("Error deleting party:", error);
      throw error;
    }
  },

  async updateParty(id: string, updates: Partial<Party>): Promise<Party> {
    try {
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      const index = db.parties.findIndex((p: Party) => p.id === id);
      if (index === -1) throw new Error("Party not found");

      db.parties[index] = { ...db.parties[index], ...updates };
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db));
      return db.parties[index];
    } catch (error) {
      console.error("Error updating party:", error);
      throw error;
    }
  },

  async deleteAllParties(): Promise<void> {
    try {
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      db.parties = [];
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db));
    } catch (error) {
      console.error("Error deleting all parties:", error);
      throw error;
    }
  },

  async getCompanies(partyId?: string): Promise<Company[]> {
    try {
      await this.ensureInitialized();
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      const companies = db.companies || [];
      if (partyId) {
        return companies.filter((c: Company) => c.partyId === partyId);
      }
      return companies;
    } catch (error) {
      console.error("Error reading companies:", error);
      return [];
    }
  },

  async addCompany(company: Omit<Company, "id" | "createdAt">): Promise<Company> {
    try {
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      const newCompany: Company = {
        ...company,
        id: createId(),
        createdAt: Date.now(),
      };
      db.companies.push(newCompany);
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db));
      return newCompany;
    } catch (error) {
      console.error("Error adding company:", error);
      throw error;
    }
  },

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    try {
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      const index = db.companies.findIndex((c: Company) => c.id === id);
      if (index === -1) throw new Error("Company not found");
      db.companies[index] = { ...db.companies[index], ...updates };
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db));
      return db.companies[index];
    } catch (error) {
      console.error("Error updating company:", error);
      throw error;
    }
  },

  async deleteCompany(id: string): Promise<void> {
    try {
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      db.companies = db.companies.filter((c: Company) => c.id !== id);
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db));
    } catch (error) {
      console.error("Error deleting company:", error);
      throw error;
    }
  },

  async getItems(companyId?: string): Promise<Item[]> {
    try {
      await this.ensureInitialized();
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      const items = db.items || [];
      if (companyId) {
        return items.filter((i: Item) => i.companyId === companyId);
      }
      return items;
    } catch (error) {
      console.error("Error reading items:", error);
      return [];
    }
  },

  async addItem(item: Omit<Item, "id" | "createdAt">): Promise<Item> {
    try {
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      const newItem: Item = {
        ...item,
        id: createId(),
        createdAt: Date.now(),
      };
      db.items = db.items || [];
      db.items.push(newItem);
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db));
      return newItem;
    } catch (error) {
      console.error("Error adding item:", error);
      throw error;
    }
  },

  async updateItem(id: string, updates: Partial<Item>): Promise<Item> {
    try {
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      const index = db.items.findIndex((i: Item) => i.id === id);
      if (index === -1) throw new Error("Item not found");
      db.items[index] = { ...db.items[index], ...updates };
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db));
      return db.items[index];
    } catch (error) {
      console.error("Error updating item:", error);
      throw error;
    }
  },

  async deleteItem(id: string): Promise<void> {
    try {
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      db.items = (db.items || []).filter((i: Item) => i.id !== id);
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db));
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error;
    }
  },

  async getVehicles(partyId?: string): Promise<Vehicle[]> {
    try {
      await this.ensureInitialized();
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      const vehicles = db.vehicles || [];
      if (partyId) {
        return vehicles.filter((v: Vehicle) => v.partyId === partyId);
      }
      return vehicles;
    } catch (error) {
      console.error("Error reading vehicles:", error);
      return [];
    }
  },

  async addVehicle(vehicle: Omit<Vehicle, "id" | "createdAt">): Promise<Vehicle> {
    try {
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      const newVehicle: Vehicle = {
        ...vehicle,
        id: createId(),
        createdAt: Date.now(),
      };
      db.vehicles = db.vehicles || [];
      db.vehicles.push(newVehicle);
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db));
      return newVehicle;
    } catch (error) {
      console.error("Error adding vehicle:", error);
      throw error;
    }
  },

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      const vehicles = db.vehicles || [];
      const index = vehicles.findIndex((v: Vehicle) => v.id === id);
      if (index === -1) throw new Error("Vehicle not found");
      vehicles[index] = { ...vehicles[index], ...updates };
      db.vehicles = vehicles;
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db));
      return vehicles[index];
    } catch (error) {
      console.error("Error updating vehicle:", error);
      throw error;
    }
  },

  async deleteVehicle(id: string): Promise<void> {
    try {
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      db.vehicles = (db.vehicles || []).filter((v: Vehicle) => v.id !== id);
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db));
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      throw error;
    }
  },

  async getGodowns(): Promise<Godown[]> {
    try {
      await this.ensureInitialized();
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      return db.godowns || [];
    } catch (error) {
      console.error("Error reading godowns:", error);
      return [];
    }
  },

  async addGodownStock(stock: Omit<GodownStock, "id" | "createdAt">): Promise<GodownStock> {
    try {
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      const newStock: GodownStock = {
        ...stock,
        id: createId(),
        createdAt: Date.now(),
      };
      db.godownStocks = db.godownStocks || [];
      db.godownStocks.push(newStock);
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db));
      return newStock;
    } catch (error) {
      console.error("Error adding godown stock:", error);
      throw error;
    }
  },

  async getGodownStocks(itemId?: string): Promise<GodownStock[]> {
    try {
      await this.ensureInitialized();
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      const stocks = db.godownStocks || [];
      if (itemId) {
        return stocks.filter((s: GodownStock) => s.itemId === itemId);
      }
      return stocks;
    } catch (error) {
      console.error("Error reading godown stocks:", error);
      return [];
    }
  },

  async deleteGodownStock(id: string): Promise<void> {
    try {
      const data = await FileSystem.readAsStringAsync(DB_FILE);
      const db = JSON.parse(data);
      db.godownStocks = (db.godownStocks || []).filter((s: GodownStock) => s.id !== id);
      await FileSystem.writeAsStringAsync(DB_FILE, JSON.stringify(db));
    } catch (error) {
      console.error("Error deleting godown stock:", error);
      throw error;
    }
  },
};
