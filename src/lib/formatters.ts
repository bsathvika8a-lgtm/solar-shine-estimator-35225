// Utility functions for formatting numbers and units

export function formatCapacity(kwp: number): { value: string; unit: string } {
  if (kwp >= 1000) {
    return { value: (kwp / 1000).toFixed(2), unit: "MW" };
  }
  return { value: kwp.toFixed(2), unit: "kWp" };
}

export function formatEnergy(kwh: number): { value: string; unit: string; lakh?: string } {
  if (kwh >= 10000000) {
    return { 
      value: (kwh / 1000000).toFixed(2), 
      unit: "MWh",
      lakh: `${(kwh / 100000).toFixed(2)} Lakh kWh`
    };
  }
  if (kwh >= 100000) {
    return { 
      value: (kwh / 100000).toFixed(2), 
      unit: "Lakh kWh",
      lakh: `${(kwh / 100000).toFixed(2)} Lakh kWh`
    };
  }
  return { value: kwh.toLocaleString(), unit: "kWh" };
}

export function formatPower(watts: number): { value: string; unit: string } {
  if (watts >= 1000000) {
    return { value: (watts / 1000000).toFixed(2), unit: "MW" };
  }
  if (watts >= 1000) {
    return { value: (watts / 1000).toFixed(2), unit: "kW" };
  }
  return { value: watts.toFixed(0), unit: "W" };
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

export function formatCO2(tons: number): { value: string; unit: string } {
  if (tons >= 1000) {
    return { value: (tons / 1000).toFixed(2), unit: "kilotons" };
  }
  return { value: tons.toFixed(1), unit: "tons" };
}
