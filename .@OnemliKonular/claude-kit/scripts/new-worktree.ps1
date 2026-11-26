# Paralel ajan için ayrı bir git worktree + branch açar.
# Kullanım:  .\new-worktree.ps1 ab-result            (main'den)
#            .\new-worktree.ps1 webhook-retry -Base develop
#            .\new-worktree.ps1 ab-result -Remove     (işi bitince sil)
param(
  [Parameter(Mandatory = $true)][string]$Name,
  [string]$Base = "main",
  [switch]$Remove
)

$root = (git rev-parse --show-toplevel).Trim()
if (-not $root) { Write-Error "Bir git reposu içinde çalıştır."; exit 1 }
$repo = Split-Path $root -Leaf
$path = Join-Path (Split-Path $root -Parent) "$repo-wt-$Name"
$branch = "agent/$Name"

if ($Remove) {
  git worktree remove $path
  Write-Host "Silindi: $path (branch '$branch' duruyor; merge edildiyse: git branch -d $branch)"
  exit 0
}

git worktree add -b $branch $path $Base
if (-not $?) { exit 1 }

# .env git'te yok, worktree'ye kopyala
if (Test-Path "$root\.env") { Copy-Item "$root\.env" "$path\.env" }

Write-Host ""
Write-Host "Hazır: $path  (branch: $branch)"
Write-Host "Yeni bir terminalde:"
Write-Host "  cd `"$path`"; npm install; claude"
