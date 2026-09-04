"""
ORCA Seed Demo Roles Script — PRD Decision D-6
Initializes pre-verified accounts and hardcoded invite tokens for hackathon jury demonstration.
"""

from typing import Dict, Any, List

SEEDED_ROLES: List[Dict[str, Any]] = [
    {
        "user_id": "usr_fisher_arumugam",
        "name": "K. Arumugam",
        "role": "fisherman",
        "verification_status": "VERIFIED_SELF_DECLARED",
        "craft_name": "Velankanni Matha",
        "reg_no": "IND-TN-02-MM-4491",
        "phone": "+91-98401-44910",
        "home_port": "Kasimedu Fishing Harbour",
        "session_days": 30,
        "token": "FISHER-SMS-OTP-VERIFIED",
    },
    {
        "user_id": "usr_res_ananya",
        "name": "Dr. Ananya Sen",
        "role": "researcher",
        "institution": "National Institute of Oceanography (NIO)",
        "email": "ananya.sen@nio.res.in",
        "verification_status": "VERIFIED_EMAIL_OTP",
        "session_days": 7,
        "token": "RES-NIO-GOA-2026",
    },
    {
        "user_id": "usr_port_ramanathan",
        "name": "Capt. M. Ramanathan",
        "role": "port",
        "organization": "Chennai Port Trust & Harbour Master",
        "email": "harbourmaster@chennaiport.gov.in",
        "verification_status": "VERIFIED_ORG_EMAIL",
        "session_days": 7,
        "token": "PORT-TRUST-2026-TOKEN",
    },
    {
        "user_id": "usr_ddmo_vijay",
        "name": "Thiru. S. Vijayaraghavan",
        "role": "ddmo",
        "district": "North Chennai Coastal Disaster Cell",
        "email": "ddmo.northchennai@tn.gov.in",
        "verification_status": "PENDING_APPROVAL",  # Used for live approval demo!
        "invite_code": "DDMO-INVITE-CHENNAI-04",
        "invited_by": "Senior Maritime Oversight Authority",
        "session_days": 7,
    },
    {
        "user_id": "usr_auth_admin",
        "name": "R. Sundaravadivelu, IAS",
        "role": "authority",
        "designation": "Principal Secretary & Coastal Commissioner",
        "verification_status": "VERIFIED_TWO_PERSON_SIGN",
        "two_person_approvers": ["Principal Secretary", "Director General INCOIS"],
        "session_days": 7,
        "token": "AUTH-ISRO-INCOIS-COMMISSION",
    },
]

def get_seeded_roles() -> List[Dict[str, Any]]:
    return SEEDED_ROLES

if __name__ == "__main__":
    print(f"==================================================")
    print(f"ORCA DEMO ROLE PROVISIONING (PRD Decision D-6)")
    print(f"==================================================")
    for u in SEEDED_ROLES:
        print(f"- [{u['role'].upper()}] {u['name']} | Status: {u['verification_status']}")
    print(f"\n[OK] 5 Demo Roles Successfully Seeded into ORCA Memory Store.")
