# config_secrets.py
from __future__ import annotations

import os
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)

try:
    from google.cloud import secretmanager  # installed locally & on GAE
except Exception:
    secretmanager = None  # fallback when lib isn't installed

# Load .env if present (local convenience only)
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

def _project_id() -> str:
    """
    Resolve project id for Secret Manager calls.
    Priority: explicit override -> env (ADC) -> gcloud config -> error.
    """
    # Explicit override lets you pin a project in dev if needed
    override = os.getenv("SECRET_MANAGER_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCLOUD_PROJECT")
    if override:
        return override

    # As a last resort, try gcloud config (works after `gcloud config set project ...`)
    try:
        # Avoid importing subprocess at module import to keep GAE happy
        import subprocess, json
        out = subprocess.check_output(
            ["gcloud", "config", "get-value", "project", "--format=json"],
            stderr=subprocess.DEVNULL,
        )
        proj = json.loads(out)
        if proj and proj != "(unset)":
            return proj
    except Exception:
        pass

    raise RuntimeError(
        "No GCP project id found. Set SECRET_MANAGER_PROJECT or GOOGLE_CLOUD_PROJECT (or run `gcloud config set project ...`)."
    )

@lru_cache(maxsize=None)
def _fetch_secret(secret_id: str) -> str:
    """
    Fetch latest version of a secret via ADC.
    Works locally (after gcloud ADC auth) and on App Engine.
    """
    if secretmanager is None:
        raise RuntimeError("google-cloud-secret-manager not installed. `pip install google-cloud-secret-manager`")

    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{_project_id()}/secrets/{secret_id}/versions/latest"
    try:
        resp = client.access_secret_version(name=name)
        return resp.payload.data.decode("utf-8")
    except Exception as e:
        raise RuntimeError(f"Failed to access secret {secret_id!r}: {e}")

def load_secrets_into_environ(secret_names: list[str], *, force: bool = False) -> None:
    """
    Load secrets from Secret Manager into os.environ.
    If force=True, overwrite existing env vars with SM values.
    """
    for name in secret_names:
        if not force and os.getenv(name):
            continue
        value = _fetch_secret(name)
        value = value.strip().strip('"').strip("'")
        os.environ[name] = value
