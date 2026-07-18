from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from database import create_tables, SessionLocal, Product
from routers.auth import router as auth_router
from routers.buyer import router as buyer_router
from routers.vendor import router as vendor_router
from routers.ws import router as ws_router

load_dotenv()

app = FastAPI(
    title="Jugaad — AI Negotiation Engine",
    description="Agentic AI negotiation for Meesho buyers. Voice-driven, Hindi-first.",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Two separate frontend origins (buyer Next.js app + vendor Vite app) need to
# call this API from the browser. A wildcard "*" is invalid together with
# allow_credentials=True per the CORS spec (browsers reject it), so this must
# be an explicit list — ALLOWED_ORIGINS is comma-separated in the environment.
_default_origins = "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176"
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(buyer_router)
app.include_router(vendor_router)
app.include_router(ws_router)


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    create_tables()

    # Defense-in-depth for ephemeral-filesystem deploys: if the DB comes up
    # genuinely empty (fresh volume, first deploy, or a platform that doesn't
    # persist disk), seed it automatically instead of 500ing on every buyer/
    # vendor request. Never runs against a DB that already has data — seed()
    # calls reset_tables() (drop + recreate), which would wipe live negotiation
    # history/vendor listings if it ran unconditionally.
    db = SessionLocal()
    try:
        is_empty = db.query(Product).count() == 0
    finally:
        db.close()

    if is_empty:
        print("⚠ Empty database detected — running seed()...")
        from seed import seed
        seed()

    print("✓ Jugaad backend running")
    print("  Docs: http://localhost:8000/docs")


@app.get("/")
def root():
    return {
        "app": "Jugaad",
        "tagline": "India ka pehla AI negotiation engine",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
