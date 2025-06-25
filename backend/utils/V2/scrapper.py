import requests
from bs4 import BeautifulSoup
import re
from config import settings
from pymongo import MongoClient
from urllib.parse import urljoin
from datetime import datetime
import re
import pandas as pd
from bson import ObjectId
from urllib.parse import urljoin, urlparse

mongo_client = MongoClient(settings.MONGO_URI)
db = mongo_client["course_database"]
collection = db["course_collection"]
MODULE_NAME = "CS188"


def scrape_schedule_table_with_links(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    table = soup.find("table")
    rows = table.find_all("tr")

    skip_cells = {}  # col_idx -> (text, links, rows_remaining)

    data = []
    for row in rows:
        cells = row.find_all(["td", "th"])
        row_data = []

        col_idx = 0  # current column index for the row
        cell_idx = 0  # index to iterate cells in this row

        while cell_idx < len(cells) or col_idx in skip_cells:
            if col_idx in skip_cells:
                # Fill cell from previous rowspan
                cell_text, cell_links, remaining = skip_cells[col_idx]
                row_data.append({
                    "text": cell_text,
                    "links": cell_links
                })
                if remaining > 1:
                    skip_cells[col_idx] = (cell_text, cell_links, remaining - 1)
                else:
                    del skip_cells[col_idx]
                col_idx += 1
            else:
                cell = cells[cell_idx]
                cell_idx += 1

                text = " ".join(cell.stripped_strings)

                links = []
                for a in cell.find_all("a", href=True):
                    href = a['href']
                    link_text = a.get_text(strip=True)
                    links.append((link_text, href))

                rowspan = int(cell.get("rowspan", 1))
                if rowspan > 1:
                    skip_cells[col_idx] = (text, links, rowspan - 1)

                row_data.append({
                    "text": text,
                    "links": links
                })
                col_idx += 1

        data.append(row_data)

    headers = ["Week", "Date", "Lecture", "Readings", "Discussion", "HW", "Project"]

    structured_data = []
    for row in data:
        while len(row) < len(headers):
            row.append({"text": "", "links": []})
        entry = {header: cell for header, cell in zip(headers, row)}
        structured_data.append(entry)

    return structured_data

def prepare_for_mongo(data):
    """
    Recursively convert tuples inside 'links' to dicts to make JSON serializable for MongoDB.
    """
    if isinstance(data, list):
        return [prepare_for_mongo(item) for item in data]
    elif isinstance(data, dict):
        new_data = {}
        for k, v in data.items():
            if k == "links" and isinstance(v, list):
                # Convert list of tuples to list of dicts
                new_links = []
                for link in v:
                    if isinstance(link, tuple) and len(link) == 2:
                        new_links.append({"text": link[0], "href": link[1]})
                    else:
                        new_links.append(link)
                new_data[k] = new_links
            else:
                new_data[k] = prepare_for_mongo(v)
        return new_data
    else:
        return data

def save_to_mongodb(rows):
    if not rows:
        print("No data to insert.")
        return 0

    # Prepare each row for MongoDB
    prepared_rows = [prepare_for_mongo(row) for row in rows]

    result = collection.insert_many(prepared_rows)
    print(f"✅ Inserted {len(result.inserted_ids)} documents into MongoDB.")
    return len(result.inserted_ids)



def extract_page_content(url):
    resp = requests.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")

    title_tag = soup.find("h1")
    title = title_tag.text.strip() if title_tag else "No Title"

    sidebar_texts = []
    for box in soup.select(".sidebar, .note, .admonition, .boxed"):
        text = box.get_text(separator=" ", strip=True)
        sidebar_texts.append(text)

    main_text_parts = []
    for tag in soup.select("main, article, #content, .content"):
        main_text_parts.append(tag.get_text(separator=" ", strip=True))
    main_text = " ".join(main_text_parts).strip()

    content = main_text + " " + " ".join(sidebar_texts)
    content = " ".join(content.split())

    images = []
    for img in soup.find_all("img"):
        src = img.get("src")
        if src:
            images.append(urljoin(url, src))

    lecture_number = None
    m = re.search(r"chapter(\d+)", url)
    if m:
        lecture_number = int(m.group(1))

    metadata = {
        "date": datetime.today().strftime("%Y-%m-%d"),
        "module": "",
        "lecture_number": lecture_number,
        "topic": title,
        "chunk_id": 1
    }

    return {
        "source": url,
        "embedings": [],
        "type": "website",
        "title": title,
        "content": [{"text":content}],
        "images": images,
        "metadata": metadata
    }



    

MODULE_NAME = "CS188"  # You can make this dynamic if needed

def universal_scrapper(url):
    resp = requests.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")

    title_tag = soup.find("h1")
    title = title_tag.text.strip() if title_tag else "No Title"

    sidebar_texts = []
    for box in soup.select(".sidebar, .note, .admonition, .boxed"):
        text = box.get_text(separator=" ", strip=True)
        sidebar_texts.append(text)

    main_text_parts = []
    for tag in soup.select("main, article, #content, .content"):
        main_text_parts.append(tag.get_text(separator=" ", strip=True))
    main_text = " ".join(main_text_parts).strip()

    content = main_text + " " + " ".join(sidebar_texts)
    content = " ".join(content.split())

    images = []
    for img in soup.find_all("img"):
        src = img.get("src")
        if src:
            images.append(urljoin(url, src))

    lecture_number = None
    m = re.search(r"chapter(\d+)", url)
    if m:
        lecture_number = int(m.group(1))

    return format_scraped_doc(
        source=url,
        title=title,
        text_content=content,
        content_type="universal-website",
        lecture_number=lecture_number,
        images=images
    )

def crawl_all_pages(start_url, max_pages=50):
    visited = set()
    to_visit = [start_url]
    base_domain = urlparse(start_url).netloc
    scraped_docs = []

    while to_visit and len(visited) < max_pages:
        current_url = to_visit.pop()
        if current_url in visited:
            continue

        try:
            print(f"🌐 Scraping: {current_url}")
            doc = universal_scrapper(current_url)
            scraped_docs.append(doc)
            visited.add(current_url)

            soup = BeautifulSoup(requests.get(current_url).text, "html.parser")
            for link in soup.find_all("a", href=True):
                href = link["href"]
                full_url = urljoin(current_url, href)
                parsed = urlparse(full_url)
                if parsed.netloc == base_domain and full_url not in visited:
                    to_visit.append(full_url)
        except Exception as e:
            print(f"❌ Failed on {current_url}: {e}")
            continue

    return scraped_docs

def format_scraped_doc(source, title, text_content, content_type="website", lecture_number=None, images=None):
    return {
        "_id": str(ObjectId()),
        "source": source,
        "embeddings": [],
        "type": content_type,
        "title": title,
        "content": [{"text": text_content}],
        "metadata": {
            "date": datetime.today().strftime("%Y-%m-%d"),
            "module": MODULE_NAME,
            "topic": title,
            "chunk_id": 1,
            "lecture_number": lecture_number
        },
        "images": images or []
    }
