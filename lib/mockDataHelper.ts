/**
 * Mock data initialization utility
 * This module provides functions to clear existing data and load mock data
 * into the app's storage
 */

import * as FileSystem from "expo-file-system/legacy";
import { Company, createId, Godown, GodownStock, Item, Party, Vehicle } from "./storage";

const DB_FILE = FileSystem.documentDirectory + "stock.json";

const mockParties: Omit<Party, "id" | "createdAt">[] = [
    {
        title: "Mr.",
        name: "Rajesh Kumar",
        contact: "9876543210",
        city: "Mumbai",
        address: "123 Market Street, Dadar",
    },
    {
        title: "Mr.",
        name: "Priya Sharma",
        contact: "9987654321",
        city: "Bangalore",
        address: "456 Business Park, Whitefield",
    },
    {
        title: "Mrs.",
        name: "Neha Patel",
        contact: "9876549876",
        city: "Ahmedabad",
        address: "789 Industrial Road, Urvashi Complex",
    },
    {
        title: "Mr.",
        name: "Vikram Singh",
        contact: "8765432109",
        city: "Delhi",
        address: "321 Trade Center, Chandni Chowk",
    },
    {
        title: "Mr.",
        name: "Ahmed Khan",
        contact: "7654321098",
        city: "Hyderabad",
        address: "654 Commerce Hub, Banjara Hills",
    },
];

const vehicleTypes = ["Truck", "Lorry", "Tempo", "Van", "Container", "Trailer"];
const itemNames = [
    "Cement Bags",
    "Steel Rods",
    "Gravel",
    "Sand",
    "Bricks",
    "Tiles",
    "Paint Cans",
    "Plywood",
    "Pipes",
    "Electrical Wire",
];
const companyNames = [
    "BuildCorp",
    "Construction Plus",
    "MegaBuild",
    "TechConstruct",
    "EcoBuilders",
];

function generateGodowns(): Godown[] {
    const godowns: Godown[] = [];
    for (let i = 1; i <= 7; i++) {
        godowns.push({ id: createId(), name: `KA-${i.toString().padStart(2, "0")}` });
    }
    for (let i = 1; i <= 7; i++) {
        godowns.push({ id: createId(), name: `KS-${i.toString().padStart(2, "0")}` });
    }
    godowns.push({ id: createId(), name: "office" });
    return godowns;
}

export function generateMockDatabase() {
    const parties: Party[] = mockParties.map((p) => ({
        ...p,
        id: createId(),
        createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
    }));

    const godowns = generateGodowns();
    const companies: Company[] = [];
    const items: Item[] = [];
    const vehicles: Vehicle[] = [];
    const godownStocks: GodownStock[] = [];

    parties.forEach((party, partyIndex) => {
        const companyCount = Math.floor(Math.random() * 3) + 2;
        for (let i = 0; i < companyCount; i++) {
            const company: Company = {
                id: createId(),
                partyId: party.id,
                companyName:
                    companyNames[Math.floor(Math.random() * companyNames.length)] +
                    ` ${partyIndex * 3 + i}`,
                agentName: `Agent ${partyIndex * 3 + i}`,
                godownName: godowns[Math.floor(Math.random() * godowns.length)].name,
                date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                source: Math.random() > 0.5 ? "add" : "unload",
                createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            };
            companies.push(company);

            const itemCount = Math.floor(Math.random() * 3) + 2;
            for (let j = 0; j < itemCount; j++) {
                const item: Item = {
                    id: createId(),
                    companyId: company.id,
                    itemName: itemNames[Math.floor(Math.random() * itemNames.length)],
                    quantity: Math.floor(Math.random() * 1000) + 100,
                    createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
                };
                items.push(item);

                const stockCount = Math.floor(Math.random() * 4) + 1;
                for (let k = 0; k < stockCount; k++) {
                    const stock: GodownStock = {
                        id: createId(),
                        itemId: item.id,
                        godownName: godowns[Math.floor(Math.random() * godowns.length)].name,
                        loadedQuantity: Math.floor(Math.random() * 500) + 50,
                        vehicleNumber: `${["KA", "KS"][Math.floor(Math.random() * 2)]}-${String(Math.floor(Math.random() * 99) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 9999) + 1000).padStart(4, "0")}`,
                        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
                            .toISOString()
                            .split("T")[0],
                        createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
                    };
                    godownStocks.push(stock);
                }
            }
        }

        const vehicleCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < vehicleCount; i++) {
            const vehicle: Vehicle = {
                id: createId(),
                partyId: party.id,
                vehicleNumber: `${["KA", "KS"][Math.floor(Math.random() * 2)]}-${String(Math.floor(Math.random() * 99) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 9999) + 1000).padStart(4, "0")}`,
                nameBoard: `${party.name}'s Vehicle ${i + 1}`,
                vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
                deliveryAt: godowns[Math.floor(Math.random() * godowns.length)].name,
                date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            };
            vehicles.push(vehicle);
        }
    });

    return {
        parties,
        companies,
        items,
        vehicles,
        godownStocks,
        godowns,
    };
}

/**
 * Clear all existing data and load mock data
 * This function will clear the entire database and populate it with fresh mock data
 */
export async function initializeMockData(): Promise<void> {
    try {
        console.log("🔄 Initializing mock data...");

        // Generate mock database
        const mockData = generateMockDatabase();

        // Write to storage
        await FileSystem.writeAsStringAsync(
            DB_FILE,
            JSON.stringify(mockData, null, 2),
        );

        console.log("✅ Mock data initialized successfully");
        console.log(`   📦 Parties: ${mockData.parties.length}`);
        console.log(`   🏢 Companies: ${mockData.companies.length}`);
        console.log(`   📋 Items: ${mockData.items.length}`);
        console.log(`   🚗 Vehicles: ${mockData.vehicles.length}`);
        console.log(`   📊 Godown Stocks: ${mockData.godownStocks.length}`);
    } catch (error) {
        console.error("❌ Error initializing mock data:", error);
        throw error;
    }
}

/**
 * Clear all data from the database
 */
export async function clearAllData(): Promise<void> {
    try {
        console.log("🧹 Clearing all data...");

        // Generate empty database with godowns
        const godowns = generateGodowns();
        const emptyDb = {
            parties: [],
            companies: [],
            items: [],
            vehicles: [],
            godownStocks: [],
            godowns,
        };

        await FileSystem.writeAsStringAsync(
            DB_FILE,
            JSON.stringify(emptyDb, null, 2),
        );

        console.log("✅ All data cleared successfully");
    } catch (error) {
        console.error("❌ Error clearing data:", error);
        throw error;
    }
}
