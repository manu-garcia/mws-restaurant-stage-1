# Mobile Web Specialist Certification Course
---

# Installing dependencies

After cloning the repository, install the project dependencies:

```bash
npm install
```

# Serving the pre-build project

You can find the pre-built-project in the ./build/ folder.

Use python3 to serve it:

```bash
cd ./build
python3 -m http.server
```

Open up a Chrome and browse http://localhost:8000

# Building the project

If you still want to build the project, from the root folder you can run (You may need to have gulp installed globally)

```bash
npm install -g gulp
gulp build
```

## How to start the project for development

This option does not need to build the before hand. It will serve the project and open it up in a browser tab for you

```bash
gulp watch
```

Gulp will watch for changes on the sources and rebuild the project automatically. The browser tab running the project will be automatically reloaded.

- Also the api server must be running locally: https://github.com/udacity/mws-restaurant-stage-3
