# Learn github actions

## 1. Creating a First Workflow
[.github/workflows/first-action.yml](https://github.com/techarm/github-actions/blob/first-action/.github/workflows/first-action.yml)
```yml
name: First Workflow
on: workflow_dispatch
jobs:
  first-job:
    runs-on: ubuntu-latest
    steps:
      - name: Print greeting
        run: echo "Hello World!"
      - name: Print goodbye
        run: echo "Done - Bye!"
```

## 2. Deployment Project (Multiple Jobs In Sequential)
[.github/workflows/deployment.yml](https://github.com/techarm/github-actions/blob/second-action/.github/workflows/deployment.yml)
```yml
name: Deployment Project
on: [push, workflow_dispatch]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Get Code
        uses: actions/checkout@v3
      - name: Install NodeJS
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Get Code
        uses: actions/checkout@v3
      - name: Install NodeJS
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Build project
        run: npm run build
      - name: Deploy
        run: echo "Deploying ..."
```

## 3. Expressions & Context Object
[.github/workflows/output.yml](https://github.com/techarm/github-actions/blob/main/.github/workflows/output.yml)
```yml
name: Output information
on: workflow_dispatch
jobs:
  info:
    runs-on: ubuntu-latest
    steps:
      - name: Output Github context
        run: echo "${{ toJSON(github) }}"
```

## 4. Job Artifacts & Outputs & Cache
[.github/workflows/deployment.yml](https://github.com/techarm/github-actions/blob/third-action/.github/workflows/deployment.yml)

### Name of action used
- actions/upload-artifact@v3
- actions/download-artifact@v3
- actions/cache@v3

```yml
name: Action 3 Deployment Project
on:
  push:
    branches:
      - third-action
    # paths-ignore:
    #   - '.github/workflows/**'
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Get Code
        uses: actions/checkout@v3
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      script-file: ${{ steps.publish.outputs.script-file }}
    steps:
      - name: Get Code
        uses: actions/checkout@v3
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        run: npm ci
      - name: Build project
        run: npm run build
      - name: Publish JS filename
        id: publish
        run: find dist/assets/*.js -type f -execdir echo 'script-file={}' >> $GITHUB_OUTPUT ';'
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist-files
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Get build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist-files
      - name: Output contents
        run: ls -al
      - name: Output filename
        run: echo ${{ needs.build.outputs.script-file }}
      - name: Deploy
        run: echo "Deploying..."
```
