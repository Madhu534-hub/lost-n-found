# TraceIt Android Release AAB Build Script
# Securely loads keystore.properties (ignored in git) and builds the signed release AAB.

param()

$ErrorActionPreference = "Stop"
$androidDir = $PSScriptRoot
$propsFile = Join-Path $androidDir "keystore.properties"

if (!(Test-Path $propsFile)) {
    Write-Error "keystore.properties not found at $propsFile"
    exit 1
}

$props = Get-Content $propsFile | ConvertFrom-StringData
$storeFile = Join-Path $androidDir $props.storeFile
$storePass = $props.storePassword
$keyAlias = $props.keyAlias
$keyPass = $props.keyPassword

# Ensure JDK and Android SDK paths are set for the build session
if (-not $env:JAVA_HOME -or !(Test-Path $env:JAVA_HOME)) {
    $env:JAVA_HOME = "C:\Program Files\Android\Android Studio1\jbr"
}
if (-not $env:ANDROID_HOME -or !(Test-Path $env:ANDROID_HOME)) {
    $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
}

Write-Host "Building TraceIt Release AAB..." -ForegroundColor Cyan
Set-Location $androidDir

.\gradlew.bat bundleRelease `
  "-Pandroid.injected.signing.store.file=$storeFile" `
  "-Pandroid.injected.signing.store.password=$storePass" `
  "-Pandroid.injected.signing.key.alias=$keyAlias" `
  "-Pandroid.injected.signing.key.password=$keyPass"

$aabPath = Join-Path $androidDir "app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aabPath) {
    Write-Host "`nSigned Release AAB successfully generated at:" -ForegroundColor Green
    Write-Host $aabPath -ForegroundColor Yellow
} else {
    Write-Error "AAB was not found after build."
}
