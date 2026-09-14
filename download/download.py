import gdown
import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(script_dir, "..", "data")

def download_file(file_id, output_path):
    url = f"https://drive.google.com/uc?id={file_id}"
    gdown.download(url, os.path.join(data_dir, output_path), quiet=False)

def download_data():
    os.makedirs(data_dir, exist_ok=True)

    with open(os.path.join(script_dir, "data.json"), "r", encoding="utf-8") as f:
        files = json.load(f)

    for file in files:
        file_id = files[file]
        output_path = f"{file}.json"
        download_file(file_id, output_path)

if __name__ == "__main__":
    download_data()