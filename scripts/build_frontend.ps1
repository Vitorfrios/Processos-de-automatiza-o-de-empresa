$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$Esbuild = Join-Path $Root 'node_modules\.bin\esbuild.cmd'
$OutDir = Join-Path $Root 'codigo\public\dist'

if (-not (Test-Path $Esbuild)) {
    throw "esbuild nao encontrado em $Esbuild"
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

& $Esbuild 'codigo/public/scripts/01_Create_Obra/pages/client-login.js' `
    --bundle `
    --format=esm `
    --minify `
    --outfile='codigo/public/dist/client-login.min.js'

& $Esbuild 'codigo/public/scripts/01_Create_Obra/pages/create-obras-page.js' `
    --bundle `
    --format=esm `
    --minify `
    --outfile='codigo/public/dist/create-obras-page.min.js'

& $Esbuild 'codigo/public/scripts/01_Create_Obra/pages/embed-obra-page.js' `
    --bundle `
    --format=esm `
    --minify `
    --outfile='codigo/public/dist/embed-obra-page.min.js'

& $Esbuild 'codigo/public/scripts/01_Create_Obra/main.js' `
    --bundle `
    --format=esm `
    --minify `
    --outfile='codigo/public/dist/obra-app.min.js'

& $Esbuild 'codigo/public/scripts/03_Edit_data/main.js' `
    --bundle `
    --format=esm `
    --minify `
    --outfile='codigo/public/dist/admin-data.min.js'
