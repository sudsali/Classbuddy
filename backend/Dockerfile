FROM python:3.11

WORKDIR /backend

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Convert line endings and make deploy script executable
RUN sed -i 's/\r$//' deploy.sh && \
    chmod +x deploy.sh

EXPOSE 8000

CMD ["./deploy.sh"]