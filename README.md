To run with Docker:

1. docker build webservice/ -t webservice
2. docker build tools/ -t flask
3. docker network create piwatch
4. docker run --network=piwatch --name flask -d -p 8000:8000 flask
5. docker run --network=piwatch --name node -d -p 8000:8000 webservice

Tada!