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

### Name of action used
- [actions/checkout@v3](https://github.com/actions/checkout)
- [actions/setup-node@v3](https://github.com/actions/setup-node)

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
- [actions/upload-artifact@v3](https://github.com/actions/upload-artifact)
- [actions/download-artifact@v3](https://github.com/actions/download-artifact)
- [actions/cache@v3](https://github.com/actions/cache)

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

## 5. Using Environment Variables & Secrets
[.github/workflows/deployment.yml](https://github.com/techarm/github-actions/blob/environment-and-secrets/.github/workflows/deployment.yml)
- Environment variables: Using `vars` context to access
- Environment secrets: Using `secrets` context to access
- Environment variables for a single workflow: Using `env` context or `$NAME` to access.

> Note: By default, Linux runners use the bash shell, can use the syntax $NAME. But if the workflow specified a Windows runner, would use the syntax for PowerShell, $env:NAME

```yml
name: Environment And Secrets
on:
  push:
    branches:
      - environment-and-secrets
env:
  MONGODB_DB_NAME: gha-demo
jobs:
  test:
    environment: testing
    env:
      MONGODB_HOST: ${{ vars.MONGODB_HOST }}
      MONGODB_USERNAME: ${{ vars.MONGODB_USERNAME }}
      MONGODB_PASSWORD: ${{ secrets.MONGODB_PASSWORD }}
      PORT: 8080
    runs-on: ubuntu-latest
    steps:
      - name: Get Code
        uses: actions/checkout@v3
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: npm-deps-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        run: npm ci
      - name: Run server
        run: npm start & npx wait-on http://127.0.0.1:$PORT
      - name: Run tests
        run: npm test
      - name: Output information
        run: |
          echo "MONGODB_DB_NAME: ${{ env.MONGODB_DB_NAME }}"
          echo "MONGODB_HOST: ${{ env.MONGODB_HOST }}"
          echo "MONGODB_USERNAME: ${{ env.MONGODB_USERNAME }}"
          echo "MONGODB_PASSWORD: ${{ env.MONGODB_PASSWORD }}"
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Output information
        # Only the first line is available
        run: |
          echo "MONGODB_DB_NAME: ${{ env.MONGODB_DB_NAME }}"
          echo "MONGODB_HOST: ${{ env.MONGODB_HOST }}"
          echo "MONGODB_USERNAME: ${{ env.MONGODB_USERNAME }}"
          echo "MONGODB_PASSWORD: ${{ env.MONGODB_PASSWORD }}"
```

## 6. Controlling Workflow
### Special Conditional Functions
- Control step or job execution with if & dynamic expressions
- Change default behavior with `failure()`, `success()`, `always()` or `cancelled()`
- Use contine-on-error to ignore step failure

|Function|Description|
|------------|----------------------------------------------------------|
|failure()   |returns `true` when any previous step or job failed       |
|success()   |returns `true` when none of the previous steps have failed|
|always() 　　  |causes the step to always execute. even when cancelled.   |
|cancelled() |returns `true` if the workflow has benn cancelled.        |
  
[.github/workflows/execution-flow.yml](https://github.com/techarm/github-actions/blob/executionflow/.github/workflows/execution-flow.yml)
```yml
name: Execution Flow
on:
  push:
    branches:
      - executionflow
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Cache dependencies
        id: cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: npm ci
      - name: Lint code
        run: npm run lint
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Cache dependencies
        id: cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: npm ci
      - name: Test code
        id: run-tests
        run: npm run test
      - name: Upload test report
        if: failure() && steps.run-tests.outcome == 'failure'
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: test.json
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Cache dependencies
        id: cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: npm ci
      - name: Build website
        id: build-website
        run: npm run build
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
        run: ls
      - name: Deploy
        run: echo "Deploying..."
  report:
    needs: [lint, deploy]
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Output information
        run: |
          echo "Something went wrong"
          echo "${{ toJSON(github) }}"
```

## 7. Matrix Jobs
- Run multiple job configurations in paralles
- Add or remove individual combinations via `include` and `exclude`
- Control whether a single failing Job should cancel all other Matrix Jobs via `continue-on-err`

[.github/workflows/matrix.yml](https://github.com/techarm/github-actions/blob/executionflow/.github/workflows/matrix.yml)
```yml
name: Matrix Demo
on:
  push:
    branches:
      - executionflow
    paths-ignore:
      - '.github/workflows/**'
jobs:
  build:
    continue-on-error: true
    strategy:
      matrix:
        node-version: [12, 14, 16]
        operating-system: [ubuntu-latest, windows-latest]
        include:
          - node-version: 18
            operating-system: ubuntu-latest
        exclude:
          - node-version: 12
            operating-system: windows-latest
    runs-on: ${{ matrix.operating-system }}
    steps:
      - name: Get Code
        uses: actions/checkout@v3
      - name: Install NodeJS
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - name: Install Dependencies
        run: npm ci
      - name: Build project
        run: npm run build
```

## 8. Resuable Workflows
- Workflows can be reused via the `workflow_call` evnet
- Reuse any logic (as many Jobs & Steps as needs)
- Work with `inputs`, `outpus` and `secrets` as required

[.github/workflows/reusable.yml](https://github.com/techarm/github-actions/blob/executionflow/.github/workflows/reusable.yml)
```yml
name: Reusable Depoly
on:
  workflow_call:
    inputs:
      artifact-name:
        description: The name of the deployable artifact files
        type: string
        required: false
        default: dist
    secrets:
      some-secret:
        required: false
    outputs:
      result:
        description: The result of the deployment operation
        value: ${{ jobs.deploy.outputs.outcome }}
jobs:
  deploy:
    outputs:
      outcome: ${{ toJSON(steps.set-result.outputs) }}
    runs-on: ubuntu-latest
    steps:
      - name: Get Code
        uses: actions/download-artifact@v3
        with:
          name: ${{ inputs.artifact-name }}
      - name: List file
        run: ls -al
      - name: Print secret text
        run: echo "some-secret=${{ secrets.some-secret }}"
      - name: Output information
        run: echo "Deploying & uploading..."
      - name: Set result output
        id: set-result
        run: |
          echo "my-result=success" >> $GITHUB_OUTPUT
          echo "my-status='200'" >> $GITHUB_OUTPUT
```

[.github/workflows/use-reuse.yml](https://github.com/techarm/github-actions/blob/executionflow/.github/workflows/use-reuse.yml)
```yml
name: Use Reuse WorkFlow
on:
  push:
    branches:
      - executionflow
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Cache dependencies
        id: cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: npm ci
      - name: Lint code
        run: npm run lint
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Cache dependencies
        id: cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: npm ci
      - name: Test code
        id: run-tests
        run: npm run test
      - name: Upload test report
        if: failure() && steps.run-tests.outcome == 'failure'
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: test.json
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Cache dependencies
        id: cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: npm ci
      - name: Build website
        id: build-website
        run: npm run build
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist-files
          path: dist
  deploy:
    needs: build
    uses: ./.github/workflows/reusable.yml
    with:
      artifact-name: dist-files
    secrets:
      some-secret: ${{ secrets.PASSWORD }}
  print-deploy-result:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Print deploy output
        run: echo "${{ toJSON(needs.deploy.outputs) }}"
  report:
    needs: [lint, deploy]
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Output information
        run: |
          echo "Something went wrong"
          echo "${{ toJSON(github) }}"
```

## 8. Containers & Services
### Containers
- Packages of code + execution environment
- Great for creating re-usable execution packages & ensuring consistency
- Example: Sample environment for testing + production

### Containers for Jobs
- Can run Jobs in pre-defined environments
- Build your own container images or use public images
- Great for Jobs that needs extra tools or lots of customization

### Service Containers
- Extra services can be used by Steps in Jobs
- Example: Locally running, isolated testing database
- Based on custom images or public / community images

[.github/workflows/deployment.yml](https://github.com/techarm/github-actions/blob/containers/.github/workflows/deployment.yml)
```yml
name: Container Workflow Deployment
on:
  push:
    branches:
      - containers
env:
  CACHE_KEY: node-deps
  MONGODB_DB_NAME: gha-demo
jobs:
  test:
    environment: testing
    runs-on: ubuntu-latest
    env:
      MONGODB_CONNECTION_PROTOCOL: mongodb
      MONGODB_CLUSTER_ADDRESS: 127.0.0.1:27017
      MONGODB_USERNAME: root
      MONGODB_PASSWORD: password
      PORT: 8080
    services:
      mongodb-srv:
        image: mongo
        ports:
          - 27017:27017
        env:
          MONGO_INITDB_ROOT_USERNAME: root
          MONGO_INITDB_ROOT_PASSWORD: password
    steps:
      - name: Get Code
        uses: actions/checkout@v3
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ env.CACHE_KEY }}-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        run: npm ci
      - name: Run server
        run: npm start & npx wait-on http://127.0.0.1:$PORT
      - name: Run tests
        run: npm test
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Output information
        run: echo "deploying..."
```

## 9. Custom Actions
### Types of actions
|Type             |Operating System.    |
|-----------------|---------------------|
|Docker container |Linux                |
|Javascript       |Linux, masOS, Windows|
|Composite Actions|Linux, masOS, Windows|
> Note: Docker container actions are slower than JavaScript actions

### Composite Actions
- Create custom Actions by combining multiple Steps
- Composite Actions are like "Workflow Excerpts"
- Use Actions (via `uses`) and Commands (via `run`) as needed

### JavaScript & Docker Actions
- Write Action logic in JavaScript (NodeJS) with [@actions/toolkit](https://github.com/actions/toolkit)
- Alternatively: Create your own Action environment with Docker
- Either way: Use inputs, set outputs and perform any logic

### Example
- Composite: https://github.com/techarm/github-actions/tree/custom-actions/.github/actions/cached-deps
- JavaScript: https://github.com/techarm/github-actions/tree/custom-actions/.github/actions/web-grep-js
- Docker: https://github.com/techarm/github-actions/tree/custom-actions/.github/actions/web-grep-docker 
