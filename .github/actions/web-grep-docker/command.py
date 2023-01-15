import os
import re
import requests

def run():
    url = os.environ["INPUT_URL"]
    match_string = os.environ["INPUT_MATCH-STRING"]

    try:
        res = requests.get(url)
        match_list = re.findall(match_string, res.text)
        print(f'is-match={len(match_list) > 0}', file=gh_output)
        print(f'result={match_list}', file=gh_output)

    except Exception as e:
        print(f'error={e}', file=gh_output)

if __name__ == '__main__':
    run()