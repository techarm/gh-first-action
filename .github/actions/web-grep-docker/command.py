import os
import re
import requests

def run():
    url = os.environ["INPUT_URL"]
    match_string = os.environ["INPUT_MATCH-STRING"]

    try:
        res = requests.get(url)
        match_list = re.findall(match_string, res.text)
        print(f"::set-output name=is-match::{len(match_list) > 0}")
        print(f"::set-output name=result::{match_list}")
    except Exception as e:
        print(f"::set-output name=error::{e}")

if __name__ == '__main__':
    run()