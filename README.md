# Embedding demo

## Requirements

- Docker (to run Metabase and the setup containers)
- Node.js 20+, or Python 3.1x+ or PHP 8+
- Optional: a database to connect to
- Optional: git, to clone this repository via a command line

## How to run

1) clone this repository and get into it. If you don't have git installed, just download the files by clicking the "Code" button and unzip them into a folder.
2) insert your Pro/Enterprise token in line 12 of the docker-compose.yml file
3) insert your database connection string on line 62 (you can leave the default if needed)
4) run `docker compose up` on the base folder of the repository
5) now choose your backend (python, node or php)
6) install the required dependencies (using the tools that you want)
7) fire up the server and go to http://localhost:9090
