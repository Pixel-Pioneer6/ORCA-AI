class SmsService:
    """
    Formats compact 2G SMS payloads (<160 characters) for offline transmission 
    via NavIC transponders and coastal GSM cell broadcast.
    """

    @classmethod
    def format_sms_alert(cls, verdict: str, swh: float, wind: float, valid_until: str = "18:00 IST") -> dict:
        # Ultra-compact English SMS (under 160 chars)
        en_text = (
            f"[ORCA-INCOIS Alert] {verdict.upper()}: Kasimedu wave {swh}m, wind {wind}kt gusts. "
            f"Vessels <12m stay inside harbour. Valid to {valid_until}. VHF Ch16."
        )
        if len(en_text) > 160:
            en_text = en_text[:157] + "..."

        # Ultra-compact Tamil SMS (Unicode / Transliterated under 160 chars)
        ta_text = (
            f"[ஆர்கா எச்சரிக்கை] {verdict}: காசிமேடு அலை {swh}மீ, காற்று {wind}kt. "
            f"12மீ குறைவான படகுகள் செல்ல வேண்டாம். {valid_until} வரை. VHF Ch16."
        )

        return {
            "en": en_text,
            "ta": ta_text,
            "char_count_en": len(en_text),
            "char_count_ta": len(ta_text),
            "standard_sms_limit": 160,
        }
