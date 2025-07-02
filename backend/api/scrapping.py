from fastapi import APIRouter,HTTPException,FastAPI,Query
from utils.V2.scrapper import scrape_schedule_table_with_links, save_to_mongodb,crawl_all_pages
from pathlib import Path
from api.transcription import transcribe_and_process
from utils.V2.scrapper import collection,extract_page_content
from urllib.parse import urlparse, urljoin, parse_qs
from utils.db import scraped_collection,transcripts_collection
from utils.website_scrapper import get_chapter_links, extract_page_content


app = APIRouter(prefix="/scrapping", tags=["scrapping"])


@app.post("/scrape-and-save",tags=["Scraping"])
def scrape_and_save():
    try:
        rows = scrape_schedule_table_with_links("https://inst.eecs.berkeley.edu/~cs188/su25/")
        if not rows:
            raise HTTPException(status_code=404, detail="No data scraped from the website.")
        inserted_count = save_to_mongodb(rows)
        return {"message": f"{inserted_count} rows inserted into MongoDB."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




@app.post("/scrape-table", tags=["Scraping"])
async def scrape_table():
    try:
        audio_folder = Path("videos")
        video_folder = Path("videos")
        supported_extensions = [".webm", ".mkv", ".mp4"]

        processed_files = 0

        for audio_file in audio_folder.iterdir():
            if not audio_file.is_file() or audio_file.suffix.lower() not in supported_extensions:
                continue

            # Extract base name like [YOUTUBEID]
            base_name = audio_file.stem  # e.g., "[EEMP1AlPpaI]"
            youtube_id = base_name.strip("[]")
            title = f"Local Video [{youtube_id}]"

            video_path = audio_file
            if not video_path.exists():
                print(f"❌ Skipping: Video file not found for {youtube_id}")
                continue

            print(f"\n🎞️ Processing local video: {youtube_id}")
            await transcribe_and_process(str(video_path), str(audio_file), video_title=title)
            processed_files += 1

        return {"message": f"✅ Processed {processed_files} local audio-video file(s)."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


    
@app.post("/scrape-table-website", tags=["Scraping"])
async def scrape_table_website():
    base_url = "https://inst.eecs.berkeley.edu/~cs188/"
    try:
        print("Website scraping started")
        documents = list(collection.find())
        total_url = 0
        
        for doc in documents:
            for section_key in ["Week", "Date", "Lecture", "Readings", "Discussion", "HW"]:
                section = doc.get(section_key, {})
                for link in section.get("links", []):
                    raw_href = link.get("href", "")
                    if not raw_href:
                        continue

                    full_url = urljoin(base_url, raw_href) if raw_href.startswith("/") else raw_href
                    total_url += 1
                    print(full_url)
                    
                    if full_url.startswith(base_url):
                        print(full_url)
                        # total_url += 1
                        try:
                            print("Scrapping started for url:", full_url)
                            scrapped_data = extract_page_content(full_url)
                            result = scraped_collection.insert_one(scrapped_data)
                            print(f"Scraped and saved data from {full_url} with ID: {result.inserted_id}")
                        except Exception as scrape_err:
                            print(f"Failed scraping {full_url}: {scrape_err}")
                            continue
                    print("Total URL found:", total_url)


        return {"message": "Scraping and saving to collection completed successfully."}
        print("Total URL found:", total_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))





@app.delete("/delete-website-data", tags=["Delete"])
async def delete_website_data():
    result = scraped_collection.delete_many({"type": "website"})
    return {"message": "Deleted documents with type='website'", "deleted_count": result.deleted_count}



@app.post("/website-scrape", tags=["Scraping"])
async def universal_website_scrape(url: str = Query(..., description="URL to scrape")):
    try:
        print("Scrapping started for url:", url)
        scrapped_data = crawl_all_pages(url)
        result = scraped_collection.insert_one(scrapped_data)
        print(f"Scraped and saved data from {url} with ID: {result.inserted_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    


@app.get("/scrape/website")
def scrape_all_chapters():
    try:
        links = get_chapter_links()
        print(f"Found {len(links)} chapters to scrape.")
        
        inserted_ids = []
        for url in links:
            doc  = extract_page_content(url)
            result = transcripts_collection.insert_one(doc)
            inserted_ids.append(str(result.inserted_id))
            
        return {
            "message": "Scraping compeleted",
            "total": len(inserted_ids),
            "inserted_ids": inserted_ids
        }
    
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


