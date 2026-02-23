// src/services/streamService.js

// --- Configuration ---
export const PROVIDERS = [
  { label: "OvoGoals", key: "ovogoals", url: "https://raw.githubusercontent.com/gowrapavan/shortsdata/main/json/ovogoal.json" },
  { label: "Sportz", key: "sportzonline", url: "https://raw.githubusercontent.com/gowrapavan/shortsdata/main/json/sportsonline.json" },
  { label: "HesGoal", key: "hesgoal", url: "https://raw.githubusercontent.com/gowrapavan/shortsdata/main/json/hesgoal.json" },
  { label: "LiveKora", key: "livekora", url: "https://raw.githubusercontent.com/gowrapavan/shortsdata/main/json/livekora.json" },
  { label: "Siiir", key: "siiir", url: "https://raw.githubusercontent.com/gowrapavan/shortsdata/main/json/siiir.json" },
  { label: "SoccerHD", key: "soccerhd", url: "https://raw.githubusercontent.com/gowrapavan/shortsdata/main/json/soccerhd.json" },
  { label: "YallaShoot", key: "yallashoot", url: "https://raw.githubusercontent.com/gowrapavan/shortsdata/main/json/yallashooote.json" }
];

// --- Translation Dictionary ---
const ARABIC_TO_ENGLISH = {
  // --- Premier League ---
  "مانشستر سيتي": "manchestercity",
  "مان سيتي": "manchestercity", // Common short version
  "ليفربول": "liverpool",
  "أرسنال": "arsenal",
  "مانشستر يونايتد": "manchesterunited",
  "مان يونايتد": "manchesterunited", // Common short version
  "تشيلسي": "chelsea",
  "توتنهام": "tottenham",
  "نيوكاسل يونايتد": "newcastle",
  "أستون فيلا": "astonvilla",
  "برايتون": "brighton",
  "وستهام": "westham",
  "إيفرتون": "everton",           // <-- Added!
  "برينتفورد": "brentford",       // <-- Added!
  "فولهام": "fulham",             // <-- Added!
  "بورنموث": "bournemouth",       // <-- Added!
  "كريستال بالاس": "crystalpalace",// <-- Added!
  "نوتينغهام فورست": "nottinghamforest",// <-- Added!
  "وولفرهامبتون": "wolves",       // <-- Added!
  "ليستر سيتي": "leicester",      // <-- Added!
  "إيبسويتش تاون": "ipswich",     // <-- Added!
  "ساوثهامبتون": "southampton",   // <-- Added!

  // --- La Liga ---
  "ريال مدريد": "realmadrid",
  "برشلونة": "barcelona",
  "أتلتيكو مدريد": "atleticomadrid",
  "جيرونا": "girona",
  "أتلتيك بلباو": "athleticbilbao",
  "ريال سوسيداد": "realsociedad",
  "ريال بيتيس": "realbetis",
  "فالنسيا": "valencia",
  "إشبيلية": "sevilla",
  "فياريال": "villarreal",

  // --- Serie A ---
  "إنتر ميلان": "intermilan",
  "يوفنتوس": "juventus",
  "ميلان": "acmilan",
  "نابولي": "napoli",
  "روما": "roma",
  "لاتسيو": "lazio",
  "أتالانتا": "atalanta",
  "فيورنتينا": "fiorentina",
  "بولونيا": "bologna",
  "تورينو": "torino",

  // --- Bundesliga ---
  "بايرن ميونخ": "bayernmunich",
  "باير ليفركوزن": "bayerleverkusen",
  "بوروسيا دورتموند": "borussiadortmund",
  "لايبزيج": "leipzig",
  "شتوتجارت": "stuttgart",
  "آينتراخت فرانكفورت": "frankfurt",
  "فولفسبورج": "wolfsburg",
  "بوروسيا مونشنغلادباخ": "monchengladbach",
  "هوفنهايم": "hoffenheim",
  "بريمن": "werderbremen",

  // --- Ligue 1 ---
  "باريس سان جيرمان": "psg",
  "موناكو": "monaco",
  "مرسيليا": "marseille",
  "ليون": "lyon",
  "ليل": "lille",
  "نيس": "nice",
  "لانس": "lens",
  "رين": "rennes",
  "ستاد ريمس": "reims",
  "ستراسبورج": "strasbourg",

  // --- Saudi Pro League ---
  "الهلال": "alhilal",
  "النصر": "alnassr",
  "الأهلي": "alahli",
  "الاتحاد": "alittihad",
  "الاتفاق": "alettifaq",
  "الشباب": "alshabab",
  "التعاون": "altaawoun",
  "الفتح": "alfateh",
  "ضمك": "damac",
  "الفيحاء": "alfayha"
};

// --- Helpers ---
const normalize = (str) => {
  if (!str) return "";
  
  let text = str.toLowerCase().trim();

  // 1. Fast path: If the whole string is exactly in our dictionary, return it.
  if (ARABIC_TO_ENGLISH[text]) {
    text = ARABIC_TO_ENGLISH[text];
  } else {
    // 2. Smart translation: Search the text to see if it contains any known Arabic team names
    // This helps translate merged labels like "مباراة إيفرتون ومانشستر"
    Object.keys(ARABIC_TO_ENGLISH).forEach(arabicKey => {
      if (text.includes(arabicKey)) {
        text = text.split(arabicKey).join(ARABIC_TO_ENGLISH[arabicKey]);
      }
    });
  }

  // 3. Strip special characters and spaces (keeps Arabic chars just in case)
  return text.replace(/[^\w\u0600-\u06FF]/g, "");
};

export const fetchAllStreams = async () => {
  const promises = PROVIDERS.map(async (provider) => {
    try {
      const res = await fetch(provider.url);
      if (!res.ok) return [];
      const data = await res.json();
      
      if (!Array.isArray(data)) return [];

      return data.map((stream, index) => ({
        ...stream,
        uniqueId: `${provider.key}-${index}-${Date.now()}`,
        source: provider.label, 
        cleanLabel: stream.label || `${stream.home_team} vs ${stream.away_team}`
      }));
    } catch (err) {
      console.warn(`Failed to load ${provider.label}`, err);
      return [];
    }
  });

  const results = await Promise.all(promises);
  return results.flat();
};

export const findStreamsForMatch = (allStreams, appHomeTeam, appAwayTeam) => {
  const targetHome = normalize(appHomeTeam); 
  const targetAway = normalize(appAwayTeam);

  return allStreams.filter(stream => {
    const streamHome = normalize(stream.home_team);
    const streamAway = normalize(stream.away_team);
    const streamLabel = normalize(stream.label);

    if (streamHome && streamAway) {
      // Direct Match
      const matchDirect = (streamHome.includes(targetHome) || targetHome.includes(streamHome)) &&
                          (streamAway.includes(targetAway) || targetAway.includes(streamAway));
      
      // Swapped Match
      const matchSwap = (streamHome.includes(targetAway) || targetAway.includes(streamHome)) &&
                        (streamAway.includes(targetHome) || targetHome.includes(streamAway));

      if (matchDirect || matchSwap) return true;
    }

    // Fallback Label Match
    if (streamLabel) {
      return (streamLabel.includes(targetHome) && streamLabel.includes(targetAway));
    }

    return false;
  });
};