export const MADRID_BOUNDS = {
  lamin: 40.0,
  lomin: -4.5,
  lamax: 41.5,
  lomax: -2.5,
};

export const MADRID_CENTER = [-3.7038, 40.4168];

export const AIRCRAFT_SOURCE_ID = "aircraft";
export const ALERT_SOURCE_ID = "alert-aircraft";
export const SELECTED_SOURCE_ID = "selected-aircraft";

export const AIRCRAFT_LAYER_ID = "aircraft-symbols";
export const ALERT_LAYER_ID = "alert-aircraft-halos";
export const SELECTED_LAYER_ID = "selected-aircraft-halo";

export const AIRCRAFT_IMAGE_ID = "aircraft-marker-image";

export const MIN_SPEED_KMH = 0;
export const MAX_SPEED_KMH = 1050;
export const MIN_ALTITUDE_M = 0;
export const MAX_ALTITUDE_M = 13000;

export const ALERT_COLORS = [
  "#ef4444",
  "#a855f7",
  "#22c55e",
  "#06b6d4",
  "#eab308",
  "#ec4899",
];

export const AIRCRAFT_MODELS = [
  "A319",
  "A320",
  "A320NEO",
  "A321",
  "A321NEO",
  "A330",
  "A340",
  "A350",
  "A380",
  "B737",
  "B738",
  "B38M",
  "B747",
  "B757",
  "B767",
  "B777",
  "B787",
  "E190",
  "CRJ9",
];

export const AIRLINES = [
  "IBE",
  "RYR",
  "AEA",
  "VLG",
  "DLH",
  "EZY",
  "BAW",
  "AFR",
  "KLM",
  "TAP",
  "QTR",
  "UAE",
  "THY",
];

export const COUNTRIES = [
  { value: "", label: "🌍 Todos los países" },

  { value: "Spain", label: "🇪🇸 Spain" },
  { value: "France", label: "🇫🇷 France" },
  { value: "Germany", label: "🇩🇪 Germany" },
  { value: "United Kingdom", label: "🇬🇧 United Kingdom" },
  { value: "Italy", label: "🇮🇹 Italy" },
  { value: "Portugal", label: "🇵🇹 Portugal" },
  { value: "Netherlands", label: "🇳🇱 Netherlands" },
  { value: "Belgium", label: "🇧🇪 Belgium" },
  { value: "Ireland", label: "🇮🇪 Ireland" },
  { value: "Switzerland", label: "🇨🇭 Switzerland" },
  { value: "Austria", label: "🇦🇹 Austria" },
  { value: "Poland", label: "🇵🇱 Poland" },
  { value: "Denmark", label: "🇩🇰 Denmark" },
  { value: "Norway", label: "🇳🇴 Norway" },
  { value: "Sweden", label: "🇸🇪 Sweden" },
  { value: "Finland", label: "🇫🇮 Finland" },
  { value: "Czech Republic", label: "🇨🇿 Czech Republic" },
  { value: "Greece", label: "🇬🇷 Greece" },
  { value: "Hungary", label: "🇭🇺 Hungary" },
  { value: "Romania", label: "🇷🇴 Romania" },
  { value: "Bulgaria", label: "🇧🇬 Bulgaria" },
  { value: "Croatia", label: "🇭🇷 Croatia" },
  { value: "Serbia", label: "🇷🇸 Serbia" },
  { value: "Slovakia", label: "🇸🇰 Slovakia" },
  { value: "Slovenia", label: "🇸🇮 Slovenia" },
  { value: "Estonia", label: "🇪🇪 Estonia" },
  { value: "Latvia", label: "🇱🇻 Latvia" },
  { value: "Lithuania", label: "🇱🇹 Lithuania" },
  { value: "Luxembourg", label: "🇱🇺 Luxembourg" },
  { value: "Iceland", label: "🇮🇸 Iceland" },
  { value: "Malta", label: "🇲🇹 Malta" },
  { value: "Cyprus", label: "🇨🇾 Cyprus" },
  { value: "Ukraine", label: "🇺🇦 Ukraine" },

  { value: "United States", label: "🇺🇸 United States" },
  { value: "Canada", label: "🇨🇦 Canada" },
  { value: "Mexico", label: "🇲🇽 Mexico" },
  { value: "Brazil", label: "🇧🇷 Brazil" },
  { value: "Argentina", label: "🇦🇷 Argentina" },
  { value: "Chile", label: "🇨🇱 Chile" },
  { value: "Colombia", label: "🇨🇴 Colombia" },
  { value: "Peru", label: "🇵🇪 Peru" },

  { value: "Turkey", label: "🇹🇷 Turkey" },
  { value: "Qatar", label: "🇶🇦 Qatar" },
  { value: "United Arab Emirates", label: "🇦🇪 United Arab Emirates" },
  { value: "Saudi Arabia", label: "🇸🇦 Saudi Arabia" },
  { value: "Israel", label: "🇮🇱 Israel" },
  { value: "Jordan", label: "🇯🇴 Jordan" },
  { value: "China", label: "🇨🇳 China" },
  { value: "Japan", label: "🇯🇵 Japan" },
  { value: "South Korea", label: "🇰🇷 South Korea" },
  { value: "India", label: "🇮🇳 India" },
  { value: "Singapore", label: "🇸🇬 Singapore" },
  { value: "Thailand", label: "🇹🇭 Thailand" },
  { value: "Malaysia", label: "🇲🇾 Malaysia" },
  { value: "Indonesia", label: "🇮🇩 Indonesia" },

  { value: "Morocco", label: "🇲🇦 Morocco" },
  { value: "Algeria", label: "🇩🇿 Algeria" },
  { value: "Tunisia", label: "🇹🇳 Tunisia" },
  { value: "Egypt", label: "🇪🇬 Egypt" },
  { value: "South Africa", label: "🇿🇦 South Africa" },
  { value: "Ethiopia", label: "🇪🇹 Ethiopia" },
  { value: "Kenya", label: "🇰🇪 Kenya" },

  { value: "Australia", label: "🇦🇺 Australia" },
  { value: "New Zealand", label: "🇳🇿 New Zealand" },
];