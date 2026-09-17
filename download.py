import io
import os
import zipfile
import requests

script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(script_dir, "data")

base_url = "https://contratacionesabiertas.oece.gob.pe/api/v1/file/seace_v3/json/{year}/{month}"

years = ["2023", "2024", "2025"]
months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]

def download_file(url, output_path):
    response = requests.get(url, timeout=60)
    response.raise_for_status()

    with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
        json_name = next(n for n in zf.namelist() if n.endswith(".json"))
        with zf.open(json_name) as src, open(output_path, "wb") as dst:
            dst.write(src.read())


def download_data():

    for year in years:

        os.makedirs(f"{data_dir}/{year}", exist_ok=True)

        for month in months:
            url = base_url.format(year=year, month=month)
            output_path = os.path.join(data_dir, year, f"{month}.json")

            try:
                download_file(url, output_path)
            except requests.exceptions.HTTPError as e:
                pass


if __name__ == "__main__":
    download_data()
