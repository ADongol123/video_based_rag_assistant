from pydantic import BaseModel
from typing import List


class SearchResult(BaseModel):
    text: str
    score: float

class SearchResultsByType(BaseModel):
    video_results: List[SearchResult]
    website_results: List[SearchResult]


class SearchRequest(BaseModel):
    query: str
    k: int = 5
    