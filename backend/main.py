from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from database import create_tables
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000"), "*"],
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
