from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class StructuredSection(BaseModel):
    heading: str
    paragraphs: List[str] = []
    items: List[str] = []

class CrawlRequest(BaseModel):
    task_id: str
    url: str
    max_pages: int = Field(default=25, ge=1, le=100)
    wait_for_dynamic: bool = True
    follow_internal_only: bool = True

class PageData(BaseModel):
    url: str
    title: str
    word_count: int
    headings: List[str] = []
    sections: List[StructuredSection] = []
    text_content: str

class CrawlSummary(BaseModel):
    total_pages: int
    total_words: int
    duration_seconds: float

class CrawlResponse(BaseModel):
    task_id: str
    domain: str
    status: str
    summary: CrawlSummary
    pages: List[PageData]
    pdf_filename: Optional[str] = None
    json_filename: Optional[str] = None
