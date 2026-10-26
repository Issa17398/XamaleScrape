import os
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import CrawlRequest, CrawlResponse, PageData, CrawlSummary
from app.crawler import crawl_website
from app.pdf_generator import generate_exports, RESULTS_DIR

app = FastAPI(
    title="XamaleScrape Scraper Service",
    description="Service interne d'extraction de contenu web et de génération PDF/JSON",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "scraper-service",
        "timestamp": datetime.utcnow().isoformat(),
        "storage_ready": RESULTS_DIR.exists(),
    }

@app.post("/crawl", response_model=CrawlResponse)
async def perform_crawl(request: CrawlRequest):
    try:
        pages, summary, domain = await crawl_website(
            start_url=request.url,
            max_pages=request.max_pages,
            wait_for_dynamic=request.wait_for_dynamic,
            follow_internal_only=request.follow_internal_only,
        )

        if not pages:
            raise HTTPException(
                status_code=422,
                detail="Aucun contenu textuel valide n'a pu être extrait de cette URL."
            )

        json_path, pdf_path = generate_exports(
            task_id=request.task_id,
            domain=domain,
            start_url=request.url,
            pages=pages,
            summary=summary,
        )

        return CrawlResponse(
            task_id=request.task_id,
            domain=domain,
            status="completed",
            summary=summary,
            pages=pages,
            pdf_filename=f"{request.task_id}.pdf",
            json_filename=f"{request.task_id}.json",
        )

    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur d'extraction : {str(exc)}")

@app.get("/download/pdf/{task_id}")
def download_pdf(task_id: str):
    file_path = RESULTS_DIR / f"{task_id}.pdf"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier PDF introuvable.")
    return FileResponse(
        path=str(file_path),
        filename=f"xamale-{task_id}.pdf",
        media_type="application/pdf",
    )

@app.get("/download/json/{task_id}")
def download_json(task_id: str):
    file_path = RESULTS_DIR / f"{task_id}.json"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier JSON introuvable.")
    return FileResponse(
        path=str(file_path),
        filename=f"xamale-{task_id}.json",
        media_type="application/json",
    )
