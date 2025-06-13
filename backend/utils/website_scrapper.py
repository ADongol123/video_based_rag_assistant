import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime
import re



BASE_URL = "https://inst.eecs.berkeley.edu/~cs188/textbook/"  
MODULE_NAME = "CS188"

def get_chapter_links():
    resp = requests.get(BASE_URL)
    soup = BeautifulSoup(resp.text, 'html.parser')
    links = []
    for a in soup.select("ul li a"):
        href = a.get("href")
        if href and href.endswith(".html"):
            full_url = urljoin(BASE_URL, href)
            links.append(full_url)
    return links



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
        "module": MODULE_NAME,
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
