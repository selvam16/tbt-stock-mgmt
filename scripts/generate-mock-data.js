/**
 * Generate mock data for the TBT Stock Management app
 * This script creates a stock.json file with sample data for testing
 *
 * Usage: node scripts/generate-mock-data.js
 */

const fs = require("fs");
const path = require("path");

const createId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

const mockParties = [
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

function generateMockData() {
  const parties = mockParties.map((p) => ({
    ...p,
    id: createId(),
    createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
  }));

  const companies = [];
  const items = [];
  const vehicles = [];
  const godownStocks = [];

  const godowns = [];
  for (let i = 1; i <= 7; i++) {
    godowns.push({
      id: createId(),
      name: `KA-${i.toString().padStart(2, "0")}`,
    });
  }
  for (let i = 1; i <= 7; i++) {
    godowns.push({
      id: createId(),
      name: `KS-${i.toString().padStart(2, "0")}`,
    });
  }
  godowns.push({ id: createId(), name: "office" });

  parties.forEach((party, partyIndex) => {
    const companyCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < companyCount; i++) {
      const company = {
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
        const item = {
          id: createId(),
          companyId: company.id,
          itemName: itemNames[Math.floor(Math.random() * itemNames.length)],
          quantity: Math.floor(Math.random() * 1000) + 100,
          createdAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        };
        items.push(item);

        const stockCount = Math.floor(Math.random() * 4) + 1;
        for (let k = 0; k < stockCount; k++) {
          const stock = {
            id: createId(),
            itemId: item.id,
            godownName:
              godowns[Math.floor(Math.random() * godowns.length)].name,
            loadedQuantity: Math.floor(Math.random() * 500) + 50,
            vehicleNumber: `${["KA", "KS"][Math.floor(Math.random() * 2)]}-${String(Math.floor(Math.random() * 99) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 9999) + 1000).padStart(4, "0")}`,
            date: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            )
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
      const vehicle = {
        id: createId(),
        partyId: party.id,
        vehicleNumber: `${["KA", "KS"][Math.floor(Math.random() * 2)]}-${String(Math.floor(Math.random() * 99) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 9999) + 1000).padStart(4, "0")}`,
        nameBoard: `${party.name}'s Vehicle ${i + 1}`,
        vehicleType:
          vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
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

function main() {
  try {
    console.log("🔄 Clearing old mock data...");
    const mockData = generateMockData();

    console.log(`✅ Generated mock data:`);
    console.log(`   📦 Parties: ${mockData.parties.length}`);
    console.log(`   🏢 Companies: ${mockData.companies.length}`);
    console.log(`   📋 Items: ${mockData.items.length}`);
    console.log(`   🚗 Vehicles: ${mockData.vehicles.length}`);
    console.log(`   📊 Godown Stocks: ${mockData.godownStocks.length}`);
    console.log(`   🏭 Godowns: ${mockData.godowns.length}`);

    console.log("\n✨ Mock data ready!");
    console.log("\nRun the app with: npx expo start");
    console.log("The data will automatically load on first app startup.");
  } catch (error) {
    console.error("❌ Error generating mock data:", error);
    process.exit(1);
  }
}

main();
