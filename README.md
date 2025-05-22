# Embedding demo

## Requirements

- Docker (to run Metabase and the setup containers)
- Node.js 20+, or Python 3.1x+ or PHP 8+
- Optional: a database to connect to
- Optional: git, to clone this repository via a command line

## How to run (all OS)

1) clone this repository and get into it (in case you don't want to use git, just simply download the zipped files and decompress them on the directory of your choice)
2) insert your Pro/Enterprise token in line 12 of the docker-compose.yml file. You can edit this file with the notepad or any text editor.
3) insert your database connection string on line 62 (you can leave the default if needed). Same as above, any text editor is fine.
4) run `docker compose up` on the base folder of the repository. It will take some time till all the services come up.
5) now choose your backend (python, node or php).
6) go to the directory where the backend of your choice is located (e.g. nodejs_backend you type `cd nodejs_backend`)
6) install the required dependencies (e.g. if you're using nodejs you'll have to type `npm install`)
7) fire up the server and go to http://localhost:9090 (e.g. if you're using nodejs you'll have to type `node --watch server.js`)

## How to run in Windows

1) Install Docker Desktop and WSL (ensure that WSL is installed as Docker desktop will otherwise fail). To install WSL you need to open a command prompt and type `wsl --install`. If it doesn't let you install WSL, you need to make sure that your computer allows you to run virtual machines on it, so check your computer manual for that (it's usually a feature you enable on the BIOS that you need to enable)
2) Start Docker desktop.
3) Follow the "how to run (all OS)" instructions above

Notes: 
- if this is the first time running Docker, it will ask you to allow the service through the firewall. Click Yes/Allow when the message appears
- if at some point the message "container metabase is unhealthy" appears, just execute `docker compose up` another time. This is due to the fact that the health check that's configured in the compose file is too low
- you'll see a lot of lines when the containers are starting, this is due to the fact that we're not running the stack in "detached" mode, since we want to see the errors and what's going on behind the scenes in case we want to debug

## Note for MacOS users

If you don't see that Metabase has initialized (or the setup container crashes), follow these steps on your machine:
- Open Docker Desktop (from your Applications folder or menu bar icon).
- Go to Settings/Preferences (the gear icon).
- Navigate to Resources > File Sharing and ensure that the root directory of your project (or a parent directory that contains it) is listed here and enabled. If your project is in, say, /Users/yourusername/my-project, then /Users or /Users/yourusername should be listed. If it's not, click the + button to add it.
- Apply & Restart Docker Desktop after making any changes here.

## How to delete everything

Just simply stop the service you started and then execute `docker compose down`, which will delete all containers from your system. You might want to do this to start over in case you need.