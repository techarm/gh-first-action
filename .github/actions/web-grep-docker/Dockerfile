FROM python:3

COPY requirements.txt /requirements.txt

RUN pip install -r requirements.txt

COPY command.py /command.py

CMD ["python", "/command.py"]