# backend/services/flow_storage.py

from utils.supabase import get_supabase

def get_flow_by_id(flow_id: str):
    supabase = get_supabase()
    res = supabase.table("flows").select("*").eq("id", flow_id).single().execute()

    if res.data:
        return res.data
    return None
