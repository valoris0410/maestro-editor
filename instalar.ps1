# Instalador AUTOMATICO del Maestro Editor (Windows 10/11). Uso (en PowerShell, dentro de esta carpeta):
#   powershell -ExecutionPolicy Bypass -File instalar.ps1
# Instala todo lo que el editor necesita y configura Claude Code. Se puede correr de nuevo: lo que ya esta, lo saltea.
# Requisito previo: Claude Code instalado (app de escritorio o terminal). Necesita internet. Tarda 10-20 minutos la primera vez.
# (Sin tildes a proposito: PowerShell 5.1 lee los scripts sin BOM como ANSI.)
$ErrorActionPreference = "Continue"
$R = Split-Path -Parent $MyInvocation.MyCommand.Path
$LOG = Join-Path $R "instalar-log.txt"
Start-Transcript -Path $LOG -Force | Out-Null
$fallas = @()
function Paso($t) { Write-Host "`n== $t" -ForegroundColor Cyan }
function Refrescar-Path { $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User") }
function Winget($id, $prueba) {
  if (& $prueba) { Write-Host "  ya instalado: $id"; return }
  Write-Host "  instalando $id ..."
  winget install --id $id -e --silent --accept-package-agreements --accept-source-agreements | Out-Host
  Refrescar-Path
  if (-not (& $prueba)) { $script:fallas += "No se pudo instalar $id (instalarlo a mano y volver a correr)" }
}
Write-Host "Maestro Editor - instalacion automatica en: $R"
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { Write-Host "Falta winget (App Installer de Microsoft Store). Instalarlo y volver a correr." -ForegroundColor Red; Stop-Transcript | Out-Null; exit 1 }

Paso "1/9 Programas (winget)"
Winget "Git.Git"            { [bool](Get-Command git -ErrorAction SilentlyContinue) }
Winget "OpenJS.NodeJS.LTS"  { [bool](Get-Command node -ErrorAction SilentlyContinue) }
Winget "Gyan.FFmpeg"        { [bool](Get-Command ffmpeg -ErrorAction SilentlyContinue) }
Winget "Python.Python.3.12" { Test-Path "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe" }
Winget "Google.Chrome.EXE"  { (Test-Path "C:\Program Files\Google\Chrome\Application\chrome.exe") -or (Test-Path "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") }
Winget "ByteDance.CapCut"   { Test-Path "$env:LOCALAPPDATA\CapCut\Apps" }
Refrescar-Path
$PY = "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"
if (-not (Test-Path $PY)) { $PY = (Get-Command python -ErrorAction SilentlyContinue).Source }
if (-not (Test-Path "C:\Program Files\Google\Chrome\Application\chrome.exe") -and (Test-Path "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe")) {
  [Environment]::SetEnvironmentVariable("CHROME_PATH", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe", "User"); $env:CHROME_PATH = "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
}

Paso "2/9 MCP de CapCut (entorno de Python)"
$API = Join-Path $R "herramientas\CapCut MCP\VectCutAPI"
$VPY = Join-Path $API ".venv\Scripts\python.exe"
if (-not (Test-Path $VPY)) { & $PY -m venv (Join-Path $API ".venv") }
if (Test-Path $VPY) { & $VPY -m pip install --quiet --disable-pip-version-check -r (Join-Path $API "requirements.txt") } else { $fallas += "No se pudo crear el entorno de Python de VectCutAPI" }

Paso "3/9 Configurar Claude Code (skill, subagente, instrucciones, MCP, fuentes)"
& $PY (Join-Path $R "configurar.py") $R $VPY
if ($LASTEXITCODE -ne 0) { $fallas += "configurar.py fallo (ver el log)" }

Paso "4/9 Skill /efectos (MediaPipe y modelos)"
$EF = Join-Path $env:USERPROFILE ".claude\skills\efectos"
if (-not (Test-Path (Join-Path $EF ".venv\Scripts\python.exe"))) { Push-Location $EF; powershell -ExecutionPolicy Bypass -File instalar.ps1; Pop-Location }
if (-not (Test-Path (Join-Path $EF ".venv\Scripts\python.exe"))) { $fallas += "El skill /efectos no termino de instalarse" } else { Write-Host "  /efectos listo" }

Paso "5/9 Dependencias de las herramientas (puppeteer-core)"
Push-Location (Join-Path $R "herramientas"); npm install --no-fund --no-audit | Out-Host; Pop-Location
if (-not (Test-Path (Join-Path $R "herramientas\node_modules\puppeteer-core"))) { $fallas += "npm install de herramientas fallo" }

Paso "6/9 ffmpeg-skill (cortar silencios, loudness, exportes)"
if (-not (Test-Path "$env:USERPROFILE\.claude\skills\ffmpeg-skill\SKILL.md")) { npx --yes ffmpeg-skill@3.2.3 | Out-Host }
if (-not (Test-Path "$env:USERPROFILE\.claude\skills\ffmpeg-skill\SKILL.md")) { $fallas += "ffmpeg-skill no se instalo" } else { Write-Host "  ffmpeg-skill listo" }

Paso "7/9 HyperFrames (transcripcion palabra por palabra con Parakeet)"
npx --yes hyperframes@0.8.166 --version | Out-Host

Paso "7b Higgsfield CLI (generar video e imagen con IA; usan los skills higgsfield-*)"
if (-not (Get-Command higgsfield -ErrorAction SilentlyContinue)) { npm install -g @higgsfield/cli@1.2.2 --no-fund --no-audit | Out-Host; Refrescar-Path }
if (Get-Command higgsfield -ErrorAction SilentlyContinue) { Write-Host "  higgsfield listo. Falta iniciar sesion una vez: higgsfield auth login" } else { $fallas += "Higgsfield CLI no se instalo (opcional)" }

Paso "8/9 DeepFilterNet (limpieza de voz)"
$DF = Join-Path $R "herramientas\DeepFilterNet\deep-filter.exe"
if (Test-Path $DF) { Write-Host "  incluido: $DF" } else { $fallas += "Falta deep-filter.exe" }

Paso "9/9 Chequeo final"
foreach ($c in "git", "node", "npm", "ffmpeg") { if (Get-Command $c -ErrorAction SilentlyContinue) { Write-Host "  OK  $c" } else { Write-Host "  FALTA $c"; $fallas += "Falta $c" } }
foreach ($f in "$env:USERPROFILE\.claude\skills\editor\SKILL.md", "$env:USERPROFILE\.claude\agents\editor.md", "$env:USERPROFILE\.claude\CLAUDE.md") { if (Test-Path $f) { Write-Host "  OK  $f" } else { Write-Host "  FALTA $f"; $fallas += "Falta $f" } }

if ($fallas.Count -eq 0) { Write-Host "`nTODO LISTO." -ForegroundColor Green } else { Write-Host "`nTermino con avisos:" -ForegroundColor Yellow; $fallas | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow } }
Write-Host "1) Cerra Claude Code por completo y abrilo de nuevo (para que cargue el skill, el subagente y el MCP de CapCut)."
Write-Host "2) Abri CapCut una vez (crea su carpeta de borradores)."
Write-Host "3) Para generar con IA (Higgsfield): en una terminal, higgsfield auth login (una sola vez)."
Write-Host "4) En Claude Code escribi: /editor"
Write-Host "Registro completo de la instalacion: $LOG"
Stop-Transcript | Out-Null
