from fastapi import FastAPI, Query, HTTPException
from utils.db import client, db, transcripts_collection
from utils.V2.scrapper import scrape_schedule_table_with_links, save_to_mongodb,crawl_all_pages

app = FastAPI()
scraped_collection = db["scraped_Data"]

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
