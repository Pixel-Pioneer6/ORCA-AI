class SmsService:
    """
    Formats compact 2G SMS payloads (<=160 characters, FR-4.4/FR-6.10) for
    offline transmission via NavIC transponders and coastal GSM cell broadcast.
    """

    VERDICT_TA = {
        "SAFE": "பாதுகாப்பானது",
        "CAUTION": "எச்சரிக்கை",
        "DO NOT VENTURE": "செல்ல வேண்டாம்",
        "INSUFFICIENT_DATA": "தரவு இல்லை",
    }

    @classmethod
    def format_sms_alert(cls, verdict: str, swh: float, wind: float, valid_until: str = "18:00 IST") -> dict:
        # Ultra-compact English SMS (<=160 chars)
        en_text = (
            f"[ORCA-INCOIS Alert] {verdict.upper()}: Kasimedu wave {swh}m, wind {wind}kt gusts. "
            f"Vessels <12m stay inside harbour. Valid to {valid_until}. VHF Ch16."
        )
        if len(en_text) > 160:
            en_text = en_text[:157] + "..."

        # Ultra-compact Tamil SMS (<=160 chars) — verdict itself must be in
        # Tamil (FR-6.10: "in the user's registered language"), not the raw
        # English verdict string embedded inside otherwise-Tamil text.
        verdict_ta = cls.VERDICT_TA.get(verdict.upper(), verdict)
        ta_text = (
            f"[ஆர்கா எச்சரிக்கை] {verdict_ta}: காசிமேடு அலை {swh}மீ, காற்று {wind}kt. "
            f"12மீ குறைவான படகுகள் செல்ல வேண்டாம். {valid_until} வரை. VHF Ch16."
        )
        if len(ta_text) > 160:
            ta_text = ta_text[:157] + "..."

        return {
            "en": en_text,
            "ta": ta_text,
            "char_count_en": len(en_text),
            "char_count_ta": len(ta_text),
            "standard_sms_limit": 160,
        }
