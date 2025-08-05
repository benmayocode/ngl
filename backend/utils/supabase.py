from supabase import create_client, Client
import os
import logging

logging.basicConfig(level=logging.INFO)

_supabase: Client | None = None

def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        logging.info("🔄 Instantiating Supabase client...")
        url = os.getenv("SUPABASE_URL")
        key_present = "Yes" if os.getenv("SUPABASE_KEY") else "No"
        logging.info(f"SUPABASE_URL is {'set' if url else 'missing'}")
        logging.info(f"SUPABASE_KEY is {key_present}")
        
        _supabase = create_client(url, os.getenv("SUPABASE_KEY"))
        logging.info("✅ Supabase client instantiated.")
    return _supabase
