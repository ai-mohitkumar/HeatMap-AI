import type { LanguageCode } from '../types';

export const LOCALIZATION_DATA: Record<LanguageCode, Record<string, string>> = {
  en: {
    // App Header & Branding
    app_title: "HeatShield AI",
    tagline: "Unsupervised Climate Intelligence & Personal Heat Safety",
    emergency_badge: "EMERGENCY MODE",
    alerts_on: "Alerts Active",
    alerts_off: "Enable Alerts",
    alerts_denied: "Alerts Blocked",
    test_notification: "Send Test Alert",

    // Navigation Tabs
    tab_home: "Home",
    tab_apps: "iOS & Android Suite",
    tab_villages: "Villages & Districts",
    tab_map: "Live Map",
    tab_risk: "Heat Risk",
    tab_plan: "Plan & Routine",
    tab_family: "Family Watchlist",
    tab_worker: "Worker Mode",
    tab_sos: "Cooling & SOS",
    tab_chat: "AI Assistant",
    tab_research: "Research Mode",
    tab_data: "Data Explorer",
    tab_insights: "Model Insights",
    tab_reports: "Reports & Export",

    // Weather & Biometeorological Metrics
    temp: "Temperature",
    feels_like: "Feels Like",
    humidity: "Humidity",
    wind: "Wind Speed",
    uv_index: "UV Index",
    aqi: "Air Quality",
    heat_index: "Rothfusz Heat Index",
    heat_stress_index: "Continuous HSI",
    heat_risk: "Heat Risk",
    peak_risk: "Peak Risk Window",
    daily_brief: "Daily Heat Brief",
    what_to_do: "What To Do Right Now",

    // 5-Tier Safety Matrix
    tier_low: "Low",
    tier_moderate: "Moderate",
    tier_high: "High",
    tier_very_high: "Very High",
    tier_extreme: "Extreme",
    tier_low_desc: "Routine precautions. Stay hydrated during normal outdoor activities.",
    tier_moderate_desc: "Hydration reminders. Wear breathable sun protection.",
    tier_high_desc: "Severe discomfort. Outdoor laborers must take scheduled rest in shade.",
    tier_very_high_desc: "Heat cramps and exhaustion probable. Avoid direct afternoon sun.",
    tier_extreme_desc: "Life-threatening emergency. Physiological heatstroke risk.",

    // Hourly Forecast Strip
    hourly_forecast: "Hourly Heat Stress Forecast",
    hourly_strip_subtitle: "6:00 AM – 8:00 PM Diurnal Solar Curve & Peak Risk Prediction",
    peak_window_badge: "PEAK RISK WINDOW",
    coolest_window: "Coolest Window",
    diurnal_heating: "Thermal Trajectory",
    hourly_peak_alert: "Peak heat expected between",

    // Welfare Check-in ("I'm Safe Today")
    welfare_beacon: "Family Welfare Beacon",
    im_safe_today: "I'm Safe Today",
    im_safe_subtext: "Tap to record your welfare status & sync with your family",
    checkin_recorded: "Checked In Today",
    checkin_timestamp: "Last Check-in",
    checkin_pending: "Check-in Pending",
    nudge_whatsapp: "Nudge via WhatsApp",
    checkin_success_msg: "Welfare check-in recorded! Family dashboard updated.",
    water_intake_logged: "Hydration logged",

    // Cooling Shelters & Water Points
    cooling_shelters: "Cooling Shelters & Water Points",
    shelter_open: "Open",
    shelter_crowded: "Near Capacity",
    shelter_full: "Full",
    water_refill: "Cold Drinking Water Active",
    verified_today: "Verified Today",
    report_shelter_update: "Report Shelter Status",
    distance: "Distance",
    spots_available: "spots available",

    // Emergency Mode & SOS
    emergency_mode: "Heat Emergency Mode",
    emergency_siren: "Emergency Siren",
    siren_active: "Siren Playing",
    siren_mute: "Mute Siren",
    call_108: "Call 108 Ambulance",
    evacuate_shelter: "Navigate to Nearest Shelter",
    broadcast_family: "Broadcast SOS to Family",
    emergency_title: "CRITICAL HEAT EMERGENCY DETECTED",
    emergency_directive: "Heat Index has exceeded life-threatening threshold (≥45°C). Halt all outdoor exertion immediately.",
    first_aid_title: "Immediate NIOSH First-Aid Protocols",
    first_aid_shade: "Move person to air-conditioned shelter or deep shade.",
    first_aid_water: "Douse skin with cool water and fan aggressively.",
    first_aid_hydrate: "Sip cool water or electrolyte oral rehydration salts.",

    // Vulnerability Personas
    persona_laborer: "Construction Laborer",
    persona_gig: "Gig Delivery Courier",
    persona_agri: "Agricultural Farmer",
    persona_elderly: "Elderly Citizen (65+)",
    persona_child: "Infants & Young Children",
    persona_chronic: "Chronic Health Patient",

    // Common Actions
    back_home: "Back to Home",
    close: "Close",
    view_details: "View Details",
    call: "Call",
    share: "Share",
    save: "Save",
    target_liters: "Daily Target",
    water: "WATER",
    shade: "SHADE",
    break: "BREAK",
    protection: "PROTECTION"
  },
  hi: {
    // App Header & Branding
    app_title: "हीटशील्ड एआई",
    tagline: "असंरचित जलवायु विश्लेषण एवं व्यक्तिगत ग्रीष्म सुरक्षा साथी",
    emergency_badge: "आपातकालीन मोड",
    alerts_on: "अलर्ट सक्रिय",
    alerts_off: "अलर्ट चालू करें",
    alerts_denied: "अलर्ट अवरुद्ध",
    test_notification: "परीक्षण अलर्ट भेजें",

    // Navigation Tabs
    tab_home: "होम",
    tab_apps: "मोबाइल और टैबलेट सूट",
    tab_villages: "गांव एवं जिला खोज",
    tab_map: "लाइव नक्शा",
    tab_risk: "गर्मी जोखिम",
    tab_plan: "दैनिक योजना",
    tab_family: "मेरे अपने (परिवार)",
    tab_worker: "श्रमिक मोड",
    tab_sos: "शीतल केंद्र व एसओएस",
    tab_chat: "एआई सहायक",
    tab_research: "शोध एवं विश्लेषण",
    tab_data: "डेटा एक्सप्लोरर",
    tab_insights: "मॉडल अंतर्दृष्टि",
    tab_reports: "रिपोर्ट एवं डाउनलोड",

    // Weather & Biometeorological Metrics
    temp: "तापमान",
    feels_like: "महसूस तापमान",
    humidity: "नमी (आर्द्रता)",
    wind: "हवा की गति",
    uv_index: "पराबैंगनी (UV)",
    aqi: "वायु गुणवत्ता",
    heat_index: "रोथफ्यूज हीट इंडेक्स",
    heat_stress_index: "निरंतर हीट स्ट्रेस स्कोर",
    heat_risk: "गर्मी का खतरा",
    peak_risk: "सर्वाधिक खतरे का समय",
    daily_brief: "दैनिक हीट बुलेटिन",
    what_to_do: "अभी क्या करें",

    // 5-Tier Safety Matrix
    tier_low: "सामान्य",
    tier_moderate: "मध्यम",
    tier_high: "उच्च जोखिम",
    tier_very_high: "अत्यधिक गंभीर",
    tier_extreme: "घातक / आपातकाल",
    tier_low_desc: "सामान्य सावधानी बरतें। नियमित अंतराल पर जल पीते रहें।",
    tier_moderate_desc: "निर्जलीकरण से बचें। धूप में निकलते समय सिर ढकें।",
    tier_high_desc: "गंभीर असहजता। खुले में काम करने वाले श्रमिक छांव में अनिवार्य विश्राम लें।",
    tier_very_high_desc: "लू लगने और मांसपेशियों में ऐंठन की भारी संभावना। दोपहर की धूप से बचें।",
    tier_extreme_desc: "जानलेवा आपातकाल। हीटस्ट्रोक का अत्यधिक जोखिम, तुरंत सुरक्षित स्थान जाएं।",

    // Hourly Forecast Strip
    hourly_forecast: "घंटेवार हीट स्ट्रेस पूर्वानुमान",
    hourly_strip_subtitle: "सुबह 6:00 से रात 8:00 बजे तक सौर चक्र व चरम जोखिम अनुमान",
    peak_window_badge: "चरम जोखिम समय",
    coolest_window: "सबसे ठंडा समय",
    diurnal_heating: "दैनिक तापमान वक्र",
    hourly_peak_alert: "सर्वाधिक गर्मी का समय:",

    // Welfare Check-in ("I'm Safe Today")
    welfare_beacon: "परिवार कल्याण बीकन",
    im_safe_today: "आज मैं सुरक्षित हूँ",
    im_safe_subtext: "अपनी कुशलता दर्ज करने व परिवार को सूचित करने हेतु दबाएं",
    checkin_recorded: "कुशलता दर्ज हो गई",
    checkin_timestamp: "अंतिम चेक-इन",
    checkin_pending: "चेक-इन प्रतीक्षारत",
    nudge_whatsapp: "व्हाट्सएप पर याद दिलाएं",
    checkin_success_msg: "सुरक्षा चेक-इन दर्ज कर लिया गया! परिवार को संदेश प्रेषित।",
    water_intake_logged: "पानी की मात्रा दर्ज",

    // Cooling Shelters & Water Points
    cooling_shelters: "शीतल राहत केंद्र एवं निःशुल्क प्याऊ",
    shelter_open: "खुला है",
    shelter_crowded: "लगभग भरा हुआ",
    shelter_full: "पूर्ण",
    water_refill: "ठंडे पेयजल की सुविधा उपलब्ध",
    verified_today: "आज सत्यापित",
    report_shelter_update: "केंद्र की स्थिति अपडेट करें",
    distance: "दूरी",
    spots_available: "स्थान शेष",

    // Emergency Mode & SOS
    emergency_mode: "हीट इमरजेंसी मोड",
    emergency_siren: "आपातकालीन सायरन",
    siren_active: "सायरन बज रहा है",
    siren_mute: "सायरन बंद करें",
    call_108: "108 एम्बुलेंस को कॉल करें",
    evacuate_shelter: "निकटतम शीतल केंद्र जाएं",
    broadcast_family: "परिवार को एसओएस भेजें",
    emergency_title: "घातक ग्रीष्म आपातकाल चेतावनी",
    emergency_directive: "हीट इंडेक्स जानलेवा स्तर (≥45°C) पार कर चुका है। खुले में सभी शारीरिक गतिविधियां तत्काल रोक दें।",
    first_aid_title: "प्राथमिक उपचार निर्देश (NIOSH)",
    first_aid_shade: "व्यक्ति को तुरंत वातानुकूलित कमरे या घनी छांव में ले जाएं।",
    first_aid_water: "त्वचा पर ठंडा पानी छिड़कें और पंखे से तेज हवा दें।",
    first_aid_hydrate: "होश में होने पर ओआरएस घोल या ठंडा पानी घूंट-घूंट पिलाएं।",

    // Vulnerability Personas
    persona_laborer: "निर्माण श्रमिक (मजदूर)",
    persona_gig: "डिलीवरी एवं राइडर साथी",
    persona_agri: "किसान एवं खेत मजदूर",
    persona_elderly: "वरिष्ठ नागरिक (65+)",
    persona_child: "शिशु एवं छोटे बच्चे",
    persona_chronic: "दीर्घकालिक रोगी (बीपी/किडनी)",

    // Common Actions
    back_home: "मुख्य पृष्ठ पर लौटें",
    close: "बंद करें",
    view_details: "विवरण देखें",
    call: "कॉल करें",
    share: "साझा करें",
    save: "सुरक्षित करें",
    target_liters: "दैनिक लक्ष्य",
    water: "पानी",
    shade: "छांव",
    break: "विश्राम",
    protection: "सुरक्षा"
  },
  pa: {
    // App Header & Branding
    app_title: "ਹੀਟਸ਼ੀਲਡ ਏਆਈ",
    tagline: "ਅਣ-ਨਿਗਰਾਨੀ ਵਾਲੀ ਮੌਸਮ ਖੁਫੀਆ ਜਾਣਕਾਰੀ ਅਤੇ ਗਰਮੀ ਸੁਰੱਖਿਆ ਸਾਥੀ",
    emergency_badge: "ਐਮਰਜੈਂਸੀ ਮੋਡ",
    alerts_on: "ਸੂਚਨਾਵਾਂ ਚਾਲੂ",
    alerts_off: "ਸੂਚਨਾਵਾਂ ਚਾਲੂ ਕਰੋ",
    alerts_denied: "ਸੂਚਨਾਵਾਂ ਬੰਦ ਹਨ",
    test_notification: "ਟੈਸਟ ਅਲਰਟ ਭੇਜੋ",

    // Navigation Tabs
    tab_home: "ਮੁੱਖ ਪੰਨਾ",
    tab_apps: "ਮੋਬਾਈਲ ਸੂਟ",
    tab_villages: "ਪਿੰਡ ਅਤੇ ਜ਼ਿਲ੍ਹੇ",
    tab_map: "ਲਾਈਵ ਨਕਸ਼ਾ",
    tab_risk: "ਗਰਮੀ ਦਾ ਖ਼ਤਰਾ",
    tab_plan: "ਰੋਜ਼ਾਨਾ ਯੋਜਨਾ",
    tab_family: "ਮੇਰੇ ਆਪਣੇ",
    tab_worker: "ਮਜ਼ਦੂਰ ਮੋਡ",
    tab_sos: "ਠੰਢੇ ਕੇਂਦਰ ਅਤੇ ਐਸਓਐਸ",
    tab_chat: "ਏਆਈ ਸਹਾਇਕ",
    tab_research: "ਖੋਜ ਮੋਡ",
    tab_data: "ਡੇਟਾ ਐਕਸਪਲੋਰਰ",
    tab_insights: "ਮਾਡਲ ਇਨਸਾਈਟਸ",
    tab_reports: "ਰਿਪੋਰਟਾਂ ਅਤੇ ਨਿਰਯਾਤ",

    // Weather & Biometeorological Metrics
    temp: "ਤਾਪਮਾਨ",
    feels_like: "ਮਹਿਸੂਸ ਤਾਪਮਾਨ",
    humidity: "ਨਮੀ",
    wind: "ਹਵਾ ਦੀ ਰਫ਼ਤਾਰ",
    uv_index: "ਯੂਵੀ ਇੰਡੈਕਸ",
    aqi: "ਹਵਾ ਗੁਣਵੱਤਾ",
    heat_index: "ਹੀਟ ਇੰਡੈਕਸ",
    heat_stress_index: "ਲਗਾਤਾਰ ਹੀਟ ਸਟ੍ਰੈਸ",
    heat_risk: "ਗਰਮੀ ਦਾ ਖ਼ਤਰਾ",
    peak_risk: "ਸਭ ਤੋਂ ਖ਼ਤਰਨਾਕ ਸਮਾਂ",
    daily_brief: "ਰੋਜ਼ਾਨਾ ਹੀਟ ਬ੍ਰੀਫ",
    what_to_do: "ਹੁਣ ਕੀ ਕਰਨਾ ਹੈ",

    // 5-Tier Safety Matrix
    tier_low: "ਆਮ",
    tier_moderate: "ਦਰਮਿਆਨਾ",
    tier_high: "ਉੱਚ ਖ਼ਤਰਾ",
    tier_very_high: "ਬਹੁਤ ਗੰਭੀਰ",
    tier_extreme: "ਜਾਨਲੇਵਾ",
    tier_low_desc: "ਆਮ ਸਾਵਧਾਨੀ ਵਰਤੋ। ਪਾਣੀ ਪੀਂਦੇ ਰਹੋ।",
    tier_moderate_desc: "ਸਰੀਰ ਵਿਚ ਪਾਣੀ ਦੀ ਕਮੀ ਨਾ ਹੋਣ ਦਿਓ।",
    tier_high_desc: "ਗੰਭੀਰ ਬੇਚੈਨੀ। ਧੁੱਪ ਵਿਚ ਕੰਮ ਕਰਨ ਵਾਲੇ ਛਾਂ ਵਿਚ ਆਰਾਮ ਕਰਨ।",
    tier_very_high_desc: "ਲੂ ਲੱਗਣ ਦਾ ਵੱਡਾ ਖ਼ਤਰਾ। ਦੁਪਹਿਰ ਦੀ ਧੁੱਪ ਤੋਂ ਬਚੋ।",
    tier_extreme_desc: "ਐਮਰਜੈਂਸੀ ਸਥਿਤੀ। ਤੁਰੰਤ ਠੰਢੀ ਥਾਂ 'ਤੇ ਜਾਓ।",

    // Hourly Forecast Strip
    hourly_forecast: "ਘੰਟੇਵਾਰ ਹੀਟ ਸਟ੍ਰੈਸ ਭਵਿੱਖਬਾਣੀ",
    hourly_strip_subtitle: "ਸਵੇਰੇ 6:00 ਤੋਂ ਰਾਤ 8:00 ਵਜੇ ਤੱਕ ਸੂਰਜੀ ਚੱਕਰ ਅਤੇ ਖ਼ਤਰਾ",
    peak_window_badge: "ਚੋਟੀ ਦਾ ਖ਼ਤਰਾ",
    coolest_window: "ਸਭ ਤੋਂ ਠੰਢਾ ਸਮਾਂ",
    diurnal_heating: "ਤਾਪਮਾਨ ਚੱਕਰ",
    hourly_peak_alert: "ਸਭ ਤੋਂ ਵੱਧ ਗਰਮੀ ਦਾ ਸਮਾਂ:",

    // Welfare Check-in ("I'm Safe Today")
    welfare_beacon: "ਪਰਿਵਾਰ ਭਲਾਈ ਬੀਕਨ",
    im_safe_today: "ਅੱਜ ਮੈਂ ਸੁਰੱਖਿਅਤ ਹਾਂ",
    im_safe_subtext: "ਆਪਣੀ ਖ਼ੈਰੀਅਤ ਦਰਜ ਕਰਨ ਲਈ ਦਬਾਓ",
    checkin_recorded: "ਚੈੱਕ-ਇਨ ਦਰਜ ਹੋ ਗਿਆ",
    checkin_timestamp: "ਆਖਰੀ ਚੈੱਕ-ਇਨ",
    checkin_pending: "ਚੈੱਕ-ਇਨ ਉਡੀਕਿਆ ਜਾ ਰਿਹਾ ਹੈ",
    nudge_whatsapp: "ਵ੍ਹਟਸਐਪ 'ਤੇ ਪੁੱਛੋ",
    checkin_success_msg: "ਸੁਰੱਖਿਆ ਚੈੱਕ-ਇਨ ਦਰਜ ਹੋ ਗਿਆ!",
    water_intake_logged: "ਪਾਣੀ ਦਰਜ ਕੀਤਾ",

    // Cooling Shelters & Water Points
    cooling_shelters: "ਠੰਢੇ ਕੇਂਦਰ ਅਤੇ ਛਬੀਲਾਂ",
    shelter_open: "ਖੁੱਲ੍ਹਾ ਹੈ",
    shelter_crowded: "ਲਗਭਗ ਭਰਿਆ ਹੋਇਆ",
    shelter_full: "ਭਰਿਆ ਹੋਇਆ",
    water_refill: "ਠੰਢਾ ਪੀਣ ਵਾਲਾ ਪਾਣੀ ਉਪਲਬਧ",
    verified_today: "ਅੱਜ ਤਸਦੀਕ ਕੀਤਾ",
    report_shelter_update: "ਸਥਿਤੀ ਅੱਪਡੇਟ ਕਰੋ",
    distance: "ਦੂਰੀ",
    spots_available: "ਥਾਵਾਂ ਬਾਕੀ",

    // Emergency Mode & SOS
    emergency_mode: "ਹੀਟ ਐਮਰਜੈਂਸੀ ਮੋਡ",
    emergency_siren: "ਐਮਰਜੈਂਸੀ ਸਾਇਰਨ",
    siren_active: "ਸਾਇਰਨ ਵੱਜ ਰਿਹਾ ਹੈ",
    siren_mute: "ਸਾਇਰਨ ਬੰਦ ਕਰੋ",
    call_108: "108 ਐਂਬੂਲੈਂਸ ਕਾਲ ਕਰੋ",
    evacuate_shelter: "ਨੇੜਲੇ ਠੰਢੇ ਕੇਂਦਰ ਜਾਓ",
    broadcast_family: "ਪਰਿਵਾਰ ਨੂੰ ਐਸਓਐਸ ਭੇਜੋ",
    emergency_title: "ਖ਼ਤਰਨਾਕ ਗਰਮੀ ਦੀ ਚਿਤਾਵਨੀ",
    emergency_directive: "ਹੀਟ ਇੰਡੈਕਸ ਜਾਨਲੇਵਾ ਪੱਧਰ (≥45°C) ਪਾਰ ਕਰ ਗਿਆ ਹੈ। ਬਾਹਰ ਕੰਮ ਤੁਰੰਤ ਬੰਦ ਕਰੋ।",
    first_aid_title: "ਮੁੱਢਲੀ ਸਹਾਇਤਾ ਨਿਰਦੇਸ਼",
    first_aid_shade: "ਮਰੀਜ਼ ਨੂੰ ਤੁਰੰਤ ਠੰਢੀ ਛਾਂ ਵਿਚ ਲੈ ਜਾਓ।",
    first_aid_water: "ਸਰੀਰ 'ਤੇ ਠੰਢਾ ਪਾਣੀ ਛਿੜਕੋ ਅਤੇ ਪੱਖਾ ਚਲਾਓ।",
    first_aid_hydrate: "ਜੇਕਰ ਹੋਸ਼ ਵਿਚ ਹੋਵੇ ਤਾਂ ਠੰਢਾ ਪਾਣੀ ਪਿਲਾਓ।",

    // Vulnerability Personas
    persona_laborer: "ਮਜ਼ਦੂਰ ਵੀਰ",
    persona_gig: "ਡਿਲੀਵਰੀ ਰਾਈਡਰ",
    persona_agri: "ਕਿਸਾਨ ਵੀਰ",
    persona_elderly: "ਬਜ਼ੁਰਗ (65+)",
    persona_child: "ਛੋਟੇ ਬੱਚੇ",
    persona_chronic: "ਪੁਰਾਣੇ ਰੋਗੀ",

    // Common Actions
    back_home: "ਮੁੱਖ ਪੰਨੇ 'ਤੇ ਜਾਓ",
    close: "ਬੰਦ ਕਰੋ",
    view_details: "ਵੇਰਵੇ ਦੇਖੋ",
    call: "ਕਾਲ ਕਰੋ",
    share: "ਸਾਂਝਾ ਕਰੋ",
    save: "ਸੰਭਾਲੋ",
    target_liters: "ਰੋਜ਼ਾਨਾ ਟੀਚਾ",
    water: "ਪਾਣੀ",
    shade: "ਛਾਂ",
    break: "ਆਰਾਮ",
    protection: "ਬਚਾਅ"
  }
};

export const getTranslation = (lang: LanguageCode, key: string, fallback?: string): string => {
  return LOCALIZATION_DATA[lang]?.[key] || LOCALIZATION_DATA.en[key] || fallback || key;
};
