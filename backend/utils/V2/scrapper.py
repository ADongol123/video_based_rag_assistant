import requests
from bs4 import BeautifulSoup
import re
from config import settings
from pymongo import MongoClient

mongo_client = MongoClient(settings.MONGO_URI)
db = mongo_client["course_database"]
collection = db["course_collection"]

def parse_hw_cell(cell):
    hw = {"title": "", "due": "", "parts": []}
    text = cell.get_text(" ", strip=True)
    match = re.search(r'(HW\d+.*?)(?:\(due (.*?)\))?', text)
    if match:
        hw["title"] = match.group(1).strip()
        hw["due"] = match.group(2).strip() if match.group(2) else ""
    links = cell.find_all("a")
    for link in links:
        hw["parts"].append({
            "text": link.text.strip(),
            "link": link.get("href")
        })
    return hw if hw["title"] or hw["parts"] else None

def parse_project_cell(cell):
    text = cell.get_text(" ", strip=True)
    match = re.search(r'(Project \d+.*?)\(due (.*?)\)', text)
    if match:
        project_title = match.group(1).strip()
        due = match.group(2).strip()
        link = cell.find("a")
        return {
            "title": project_title,
            "due": due,
            "link": link.get("href") if link else None
        }
    return None

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