import re
from typing import Dict, Any, List, Optional
from .safety_agent import SafetyAgent
from .pfz_agent import PfzAgent
from .weather_agent import WeatherHazardAgent
from .port_agent import PortOperationsAgent
from .disaster_agent import DisasterAgent
from ..lib.geo import HARBOUR_REGISTRY
from ..lib.session_store import session_store
from ..connectors.nominatim import reverse_geocode
from ..lib.cache import ingestion_cache
from ..lib.nlu_resolve import resolve_relative_time, resolve_spatial_reference

CLARIFYING_QUESTION_EN = (
    "Before I can give you a departure or safety verdict, I need to know where you are — "
    "I can't safely guess it. Reply with your harbour name (e.g. \"Ennore\", \"Kasimedu\", "
    "\"Tuticorin\"), or allow location access and I'll use your GPS position."
)
CLARIFYING_QUESTION_TA = (
    "பாதுகாப்பு பதிலளிக்க முன், நீங்கள் எங்கு உள்ளீர்கள் என்பதை அறிய வேண்டும். "
    "உங்கள் துறைமுகத்தின் பெயரை (எ.கா. \"Ennore\", \"Kasimedu\") பதிலளிக்கவும், "
    "அல்லது GPS அனுமதி அளிக்கவும்."
)
CLARIFYING_QUESTION_HI = (
    "सुरक्षा जवाब देने से पहले मुझे यह जानना ज़रूरी है कि आप कहाँ हैं — मैं इसका सही अंदाज़ा नहीं लगा सकता। "
    "अपने बंदरगाह का नाम बताएं (जैसे \"Ennore\", \"Kasimedu\", \"Tuticorin\"), या लोकेशन एक्सेस की अनुमति दें।"
)
CLARIFYING_QUESTION_ML = (
    "സുരക്ഷാ വിവരം നൽകുന്നതിന് മുമ്പ് നിങ്ങൾ എവിടെയാണെന്ന് അറിയേണ്ടതുണ്ട് — ഇത് ഊഹിക്കാൻ കഴിയില്ല. "
    "നിങ്ങളുടെ തുറമുഖത്തിന്റെ പേര് പറയുക (ഉദാ: \"Ennore\", \"Kasimedu\", \"Tuticorin\"), "
    "അല്ലെങ്കിൽ ലൊക്കേഷൻ ആക്സസ് അനുവദിക്കുക."
)


class OrcaRouterAgent:
    """
    MASTER MULTI-AGENT ORCHESTRATOR:
    - Classifies natural language queries in Tamil (தமிழ்), Hindi (हिन्दी), and English.
    - Dispatches to specialized domain agents or coordinates multi-agent consensus.
    - Strictly clamps probabilistic outputs with the Deterministic Hydrodynamic Guardrail.
    - Carries real multi-turn session memory (FR-1.3), asks a clarifying
      question rather than guessing when location is unresolvable (FR-1.2),
      and answers compound multi-part queries in one turn by combining every
      matched intent's section into a single reply (FR-1.4), instead of
      picking only the first matching branch.
    """

    MARITIME_DOMAIN_KEYWORDS = [
        "pfz", "fish", "catch", "zone", "weather", "wind", "cyclone", "gust", "squall",
        "port", "harbour", "harbor", "bar", "berth", "depth", "vhf", "ais",
        "disaster", "ddmo", "siren", "sms", "shelter", "evacuat",
        "boat", "sea", "ocean", "venture", "safe", "safety", "wave", "swell", "tide",
        "sail", "voyage", "depart", "launch", "storm", "marine", "coast", "tsunami",
        "warning", "advisory", "vessel", "craft", "sst", "chlorophyll", "current",
        # Tamil
        "மீன்", "மண்டலம்", "காற்ற", "புயல்", "துறைமுகம்", "அபாயம்", "ஆபத்து",
        "கடல்", "படகு", "அலை", "பாதுகாப்பான", "செல்ல",
        # Hindi
        "मछली", "मौसम", "हवा", "बंदरगाह", "आपदा", "समुद्र", "नाव", "लहर", "सुरक्षित",
        # Malayalam
        "മീൻ", "മേഖല", "കാലാവസ്ഥ", "കാറ്റ്", "ചുഴലിക്കാറ്റ്", "തുറമുഖം", "ദുരന്തം",
        "കടൽ", "ബോട്ട്", "വള്ളം", "തിരമാല", "സുരക്ഷിതം", "പോകാം",
    ]

    @classmethod
    def is_out_of_scope(cls, query: str) -> bool:
        q_lower = (query or "").lower().strip()
        if not q_lower:
            return True
        return not any(kw in q_lower for kw in cls.MARITIME_DOMAIN_KEYWORDS)

    @staticmethod
    def _match_harbour_mention(q_lower: str) -> Optional[Dict[str, Any]]:
        """FR-1.2/FR-1.3: a harbour name mentioned in free text resolves and
        remembers location — also how a user answers the clarifying question."""
        for full_name, coords in HARBOUR_REGISTRY.items():
            short = full_name.replace(" fishing harbour", "").replace(" port", "").strip()
            if short and (short in q_lower or full_name in q_lower):
                return {"lat": coords["lat"], "lon": coords["lon"], "name": full_name.title()}
        return None

    @staticmethod
    def _label_for_location(location: Dict[str, float]) -> str:
        if location.get("name"):
            return location["name"]
        cache_key = f"geocode:{round(location['lat'], 3)}:{round(location['lon'], 3)}"
        geo = ingestion_cache.get_or_fetch(cache_key, 86400, lambda: reverse_geocode(location["lat"], location["lon"]))
        return geo["place_name"] if geo else f"({location['lat']:.2f}, {location['lon']:.2f})"

    @classmethod
    def process_query(
        cls,
        query: str,
        vessel_loa: Optional[float] = None,
        vessel_hp: Optional[float] = None,
        language: str = "en",
        session_id: str = "s_default",
        location: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        session = session_store.get(session_id)
        session_store.append_turn(session_id, "user", query)

        # FR-1.3: a value omitted this turn falls back to what the session
        # already learned, rather than silently resetting to hardcoded defaults.
        loa = vessel_loa if vessel_loa is not None else (session.get("vessel_loa") or 8.2)
        hp = vessel_hp if vessel_hp is not None else (session.get("vessel_hp") or 9.9)
        session_store.update(session_id, vessel_loa=loa, vessel_hp=hp)

        q_lower = (query or "").lower()

        # A bare harbour-name reply to a pending clarifying question (FR-1.2)
        # is legitimately in-scope even though it carries no maritime keyword
        # of its own — it must resolve and resume, not hit the out-of-scope gate.
        awaiting_location = bool(session.get("pending_clarification"))
        mentions_harbour_now = bool(cls._match_harbour_mention(q_lower)) or bool(location)

        if cls.is_out_of_scope(query) and not (awaiting_location and mentions_harbour_now):
            reply_en = (
                "I'm ORCA — a marine safety and fishing-conditions assistant. I can help with departure "
                "safety, nearest fishing zones, weather/squall warnings, port conditions, or disaster alerts. "
                "Could you ask something in that space?"
            )
            reply_ta = (
                "நான் ஆர்கா — கடல் பாதுகாப்பு உதவியாளர். கடலுக்கு செல்வது பாதுகாப்பானதா, மீன்பிடி மண்டலங்கள், "
                "வானிலை எச்சரிக்கைகள் அல்லது துறைமுக நிலவரம் பற்றி கேளுங்கள்."
            )
            reply_hi = (
                "मैं ORCA हूं — एक समुद्री सुरक्षा और मछली पकड़ने की स्थिति सहायक। मैं प्रस्थान सुरक्षा, निकटतम "
                "मछली पकड़ने के क्षेत्र, मौसम/तूफान चेतावनी, बंदरगाह की स्थिति या आपदा अलर्ट में मदद कर सकता हूं। "
                "कृपया इस विषय में कुछ पूछें।"
            )
            reply_ml = (
                "ഞാൻ ORCA ആണ് — ഒരു കടൽ സുരക്ഷാ, മീൻപിടിത്ത സാഹചര്യ സഹായി. യാത്രാ സുരക്ഷ, ഏറ്റവും അടുത്ത "
                "മീൻപിടിത്ത മേഖല, കാലാവസ്ഥ/ചുഴലിക്കാറ്റ് മുന്നറിയിപ്പുകൾ, തുറമുഖ സ്ഥിതി അല്ലെങ്കിൽ ദുരന്ത "
                "അലേർട്ടുകൾ എന്നിവയിൽ എനിക്ക് സഹായിക്കാനാകും. ദയവായി ആ വിഷയത്തിൽ എന്തെങ്കിലും ചോദിക്കൂ."
            )
            return {
                "reply": reply_en,
                "reply_ta": reply_ta,
                "reply_hi": reply_hi,
                "reply_ml": reply_ml,
                "verdict": "OUT_OF_SCOPE",
                "verdict_ta": "வரம்புக்கு வெளியே",
                "verdict_hi": "दायरे से बाहर",
                "verdict_ml": "പരിധിക്ക് പുറത്ത്",
                "confidence": "N/A",
                "sources": [],
                "reasoning_chain": [{
                    "step": 1,
                    "agent": "SupervisorAgent",
                    "finding": "Query matched no maritime-domain keyword — classified out-of-scope per FR-2.5, redirected instead of fabricating a safety verdict.",
                }],
                "suggested_followups": [
                    "Can I venture out tomorrow morning?",
                    "Where is the nearest PFZ?",
                    "Is there a squall warning today?",
                ],
                "target_window": None,
            }

        # FR-1.2/FR-1.3: resolve location for this turn — an explicit harbour
        # mention or a live GPS fix both update and persist session memory.
        mentioned = cls._match_harbour_mention(q_lower)
        if mentioned:
            location = mentioned
        if location:
            location = {**location, "name": location.get("name") or cls._label_for_location(location)}
            session_store.update(session_id, location=location)
        resolved_location = location or session.get("location")

        # If the user was already asked to clarify their location and this
        # turn supplies one (harbour name, or a GPS fix just came through)
        # with no new maritime intent of its own, resume the original query
        # instead of asking them to repeat themselves — real multi-turn memory.
        pending = session.get("pending_clarification")
        if pending and resolved_location and mentioned and not any(
            w in q_lower for w in ["pfz", "fish", "port", "harbour", "weather", "cyclone", "disaster", "ddmo"]
        ):
            query = pending
            q_lower = query.lower()
            session_store.update(session_id, pending_clarification=None)

        if not resolved_location:
            session_store.update(session_id, pending_clarification=query)
            harbour_names = [k.title() for k in HARBOUR_REGISTRY.keys()]
            return {
                "reply": CLARIFYING_QUESTION_EN,
                "reply_ta": CLARIFYING_QUESTION_TA,
                "reply_hi": CLARIFYING_QUESTION_HI,
                "reply_ml": CLARIFYING_QUESTION_ML,
                "verdict": "NEED_LOCATION",
                "verdict_ta": "இருப்பிடம் தேவை",
                "verdict_hi": "स्थान आवश्यक है",
                "verdict_ml": "സ്ഥലം ആവശ്യമാണ്",
                "confidence": "N/A",
                "sources": [],
                "reasoning_chain": [{
                    "step": 1,
                    "agent": "SupervisorAgent",
                    "finding": "No resolvable location (no registered home port, no GPS fix, no harbour named in query) — asked a clarifying question per FR-1.2 instead of defaulting silently.",
                }],
                "suggested_followups": harbour_names,
                "target_window": None,
            }
        session_store.update(session_id, pending_clarification=None)

        lat, lon = resolved_location["lat"], resolved_location["lon"]

        # FR-2.3: resolve "tomorrow morning" / "this evening" / "5 AM" into a
        # real IST date+hour window, and detect "near me"-style phrasing —
        # both previously had no NLU at all behind the hardcoded defaults.
        time_ref = resolve_relative_time(query)
        spatial_ref = resolve_spatial_reference(query)

        # FR-1.4: detect every matched intent (not just the first) so a
        # compound query ("is it safe, and where's the nearest PFZ?") gets
        # one reply covering every part, not just whichever branch matched first.
        is_pfz = any(w in q_lower for w in ["pfz", "fish", "catch", "zone", "மீன்", "மண்டலம்", "मछली"])
        is_weather = any(w in q_lower for w in ["weather", "wind", "cyclone", "gust", "squall", "காற்ற", "புயல்", "मौसम", "हवा"])
        is_port = any(w in q_lower for w in ["port", "harbour", "bar", "berth", "depth", "vhf", "ais", "துறைமுகம்", "बंदरगाह"])
        is_disaster = any(w in q_lower for w in ["disaster", "ddmo", "siren", "shelter", "evacuat", "அபாயம்", "ஆபத்து", "आपदा"])

        reasoning_chain: List[Dict[str, Any]] = [{
            "step": 1,
            "agent": "SafetyAgent",
            "finding": f"Analyzed telemetry at {resolved_location.get('name', 'reported position')} against craft LOA ({loa}m).",
        }]
        if time_ref["resolved"]:
            reasoning_chain.append({
                "step": len(reasoning_chain) + 1,
                "agent": "NLU (relative-time resolver)",
                "finding": f"Resolved time reference in query to {time_ref['label']} (basis: {time_ref['basis']}).",
            })
        if spatial_ref["resolved"]:
            reasoning_chain.append({
                "step": len(reasoning_chain) + 1,
                "agent": "NLU (spatial resolver)",
                "finding": f"Resolved \"{spatial_ref['matched_phrase']}\" to {resolved_location.get('name', 'reported position')} (live GPS fix or registered home port), not a hardcoded default.",
            })
        safety_result = SafetyAgent.evaluate_departure_safety(loa=loa, hp=hp, lat=lat, lon=lon)
        if time_ref["resolved"]:
            safety_result["target_window"] = time_ref["label"]

        # All four supported languages built in parallel (FR-1.1/FR-1.5) —
        # previously only EN/TA sections existed here, so a Hindi- or
        # Malayalam-selected conversation always got the English reply back
        # regardless of what language the user actually spoke/selected.
        sections_en = [safety_result["advisory_en"]]
        sections_ta = [safety_result["advisory_ta"]]
        sections_hi = [safety_result["advisory_hi"]]
        sections_ml = [safety_result["advisory_ml"]]
        sources = list(safety_result["sources"])
        followups = ["When is the safest time to depart?"]

        reasoning_chain.append({
            "step": len(reasoning_chain) + 1,
            "agent": "HydrodynamicGuardrail",
            "finding": f"Clamped verdict to {safety_result['verdict']}: wave exceedance {safety_result['guardrail']['wave_exceedance_pct']}% above {safety_result['guardrail']['craft_max_wave']}m craft limit.",
        })

        if is_pfz:
            pfz_data = PfzAgent.get_ranked_zones(loa=loa, hp=hp)
            reasoning_chain.append({
                "step": len(reasoning_chain) + 1,
                "agent": "PfzAgent",
                "finding": f"Queried Oceansat-3 OCM chlorophyll-a fronts; identified {pfz_data['primary_zone']['name']}.",
            })
            sections_en.append(
                f"🎣 Nearest PFZ: {pfz_data['primary_zone']['name']} — {pfz_data['primary_zone']['distance_nm']} NM "
                f"{pfz_data['primary_zone']['bearing']}, {pfz_data['primary_zone']['probability_pct']}% catch probability "
                f"for {pfz_data['primary_zone']['species']}. {pfz_data['transit_advisory']}"
            )
            sections_ta.append(
                f"🎣 அருகிலுள்ள மீன்பிடி மண்டலம்: {pfz_data['primary_zone']['name']} ({pfz_data['primary_zone']['distance_nm']} NM). "
                f"{pfz_data['transit_advisory']}"
            )
            sections_hi.append(
                f"🎣 निकटतम मछली पकड़ने का क्षेत्र: {pfz_data['primary_zone']['name']} — {pfz_data['primary_zone']['distance_nm']} "
                f"नॉटिकल मील {pfz_data['primary_zone']['bearing']}, {pfz_data['primary_zone']['probability_pct']}% पकड़ की संभावना। "
                f"{pfz_data['transit_advisory']}"
            )
            sections_ml.append(
                f"🎣 ഏറ്റവും അടുത്ത മീൻപിടിത്ത മേഖല: {pfz_data['primary_zone']['name']} — {pfz_data['primary_zone']['distance_nm']} "
                f"നോട്ടിക്കൽ മൈൽ {pfz_data['primary_zone']['bearing']}, {pfz_data['primary_zone']['probability_pct']}% ലഭിക്കാനുള്ള സാധ്യത। "
                f"{pfz_data['transit_advisory']}"
            )
            sources += ["Oceansat-3 OCM-3", "INCOIS PFZ Model"]
            followups.append("What is the fuel savings estimate for that PFZ?")

        if is_port:
            port_data = PortOperationsAgent.get_harbour_status()
            reasoning_chain.append({
                "step": len(reasoning_chain) + 1,
                "agent": "PortOperationsAgent",
                "finding": f"Evaluated approach bar sounding datum ({port_data['current_depth_datum']}m) and tidal curve.",
            })
            sections_en.append(
                f"⚓ {port_data['port_name']}: {port_data['status_verdict']}. Depth over outer bar {port_data['current_depth_datum']}m "
                f"relative to datum. Next high tide {port_data['next_high_tide']}. Listening watch on {port_data['direct_vhf_channel']}."
            )
            sections_ta.append(
                f"⚓ துறைமுக நிலவரம்: {port_data['status_verdict']}. அடுத்த உயர் அலை {port_data['next_high_tide']}."
            )
            sections_hi.append(
                f"⚓ बंदरगाह की स्थिति: {port_data['status_verdict']}. अगला उच्च ज्वार {port_data['next_high_tide']}।"
            )
            sections_ml.append(
                f"⚓ തുറമുഖ സ്ഥിതി: {port_data['status_verdict']}. അടുത്ത വേലിയേറ്റം {port_data['next_high_tide']}."
            )
            sources.append("Kasimedu Port Radar AIS")
            followups.append("Show vessel berth queue")

        if is_weather:
            hazard = WeatherHazardAgent.get_active_hazard_summary()
            reasoning_chain.append({
                "step": len(reasoning_chain) + 1,
                "agent": "WeatherHazardAgent",
                "finding": f"Checked IMD Doppler radar: {hazard['hazard_title']} ({hazard['urgency']}), valid until {hazard['valid_until']}.",
            })
            sections_en.append(
                f"⛈️ Active weather hazard: {hazard['hazard_title']} — gusts up to {hazard['max_gusts_knots']} kt, "
                f"valid until {hazard['valid_until']}. {hazard['advisory']}"
            )
            sections_ta.append(f"⛈️ வானிலை எச்சரிக்கை: {hazard['hazard_title']} ({hazard['valid_until']} வரை).")
            sections_hi.append(f"⛈️ मौसम चेतावनी: {hazard['hazard_title']} ({hazard['valid_until']} तक).")
            sections_ml.append(f"⛈️ കാലാവസ്ഥാ മുന്നറിയിപ്പ്: {hazard['hazard_title']} ({hazard['valid_until']} വരെ).")
            sources.append("IMD Doppler Weather Radar")
            followups.append("When does this weather warning lift?")

        if is_disaster:
            ddmo = DisasterAgent.get_ddmo_status()
            reasoning_chain.append({
                "step": len(reasoning_chain) + 1,
                "agent": "DisasterAgent",
                "finding": f"DDMO alert level {ddmo['alert_level']}, bulletin {ddmo['bulletin_id']}.",
            })
            sections_en.append(
                f"🚨 DDMO alert level: {ddmo['alert_level']} (bulletin {ddmo['bulletin_id']}, valid until {ddmo['valid_until']}). "
                f"{ddmo['metrics']['shelters_ready']} shelters ready for {ddmo['metrics']['at_risk_population']:,} at-risk residents."
            )
            sections_ta.append(f"🚨 பேரிடர் மேலாண்மை எச்சரிக்கை நிலை: {ddmo['alert_level']}.")
            sections_hi.append(f"🚨 आपदा प्रबंधन चेतावनी स्तर: {ddmo['alert_level']}.")
            sections_ml.append(f"🚨 ദുരന്ത നിവാരണ മുന്നറിയിപ്പ് നില: {ddmo['alert_level']}.")
            sources.append("DDMO Coastal Resilience Cell")
            followups.append("Show nearest cyclone shelter")

        reply_en = "\n\n".join(sections_en)
        reply_ta = "\n\n".join(sections_ta)
        reply_hi = "\n\n".join(sections_hi)
        reply_ml = "\n\n".join(sections_ml)
        session_store.append_turn(session_id, "assistant", reply_en)

        return {
            "reply": reply_en,
            "reply_ta": reply_ta,
            "reply_hi": reply_hi,
            "reply_ml": reply_ml,
            "verdict": safety_result["verdict"],
            "verdict_ta": safety_result["verdict_ta"],
            "verdict_hi": safety_result["verdict_hi"],
            "verdict_ml": safety_result["verdict_ml"],
            "confidence": safety_result["confidence"],
            "sources": list(dict.fromkeys(sources)),  # de-dup, preserve order
            "reasoning_chain": reasoning_chain,
            "suggested_followups": followups,
            "target_window": safety_result["target_window"],
        }
