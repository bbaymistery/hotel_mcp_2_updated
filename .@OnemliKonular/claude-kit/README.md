# claude-kit — Claude Code çalışma düzenim

Spec → test → kod → otomatik doğrulama → ikinci model review → merge.

## İki katman: GLOBAL ve PROJE

| Katman | Nereye kopyalanır | Ne zaman |
|---|---|---|
| `global/` | `C:\Users\User\.claude\` | **Bir kere.** Her projede otomatik geçerli. |
| `project/` | Projenin kök klasörüne | Her yeni projede. Sadece o projeye özel kısımlar (komutlar, klasörler, stack). |

Claude bir oturum açınca **ikisini birlikte** okur: önce `~/.claude/CLAUDE.md` (genel kurallar), sonra projedeki `CLAUDE.md` (proje kuralları).
Yani her projede genel kuralları tekrar yazmazsın. Proje `CLAUDE.md`'si 20–40 satırlık kısa bir dosyadır.

```
claude-kit/
├── global/                      → ~/.claude/
│   ├── CLAUDE.md                  genel kurallar (spec-first, TDD, doğrulama)
│   ├── agents/code-reviewer.md    sadece okuyan review ajanı
│   └── commands/
│       ├── ticket.md              /ticket  → kısa ticket dosyası üretir
│       └── judge.md               /judge   → Codex + Gemini ile ikinci görüş
├── project/                     → proje köküne
│   ├── CLAUDE.md                  bu projeye özel kurallar (hotel-booking)
│   ├── .mcp.json                  Playwright + projenin kendi MCP sunucusu
│   ├── .claude/settings.json      hook tanımları
│   ├── .claude/hooks/mark-dirty.mjs  kod değişti mi? işaretler
│   ├── .claude/hooks/verify.mjs      Claude "bitti" deyince typecheck + lint + test
│   └── tickets/TEMPLATE.md        ticket şablonu
└── scripts/new-worktree.ps1     paralel ajan için worktree açar
```

## Kurulum

### 1) Global (bir kere)
```powershell
$kit = "C:\Users\User\Desktop\hootel-booking-mcp-server\.@OnemliKonular\claude-kit"
Copy-Item "$kit\global\CLAUDE.md" "$HOME\.claude\CLAUDE.md"
New-Item -ItemType Directory -Force "$HOME\.claude\commands" | Out-Null
Copy-Item "$kit\global\agents\*"   "$HOME\.claude\agents\"
Copy-Item "$kit\global\commands\*" "$HOME\.claude\commands\"
```

### 2) Proje (her yeni projede)
```powershell
$proj = "C:\Users\User\Desktop\hootel-booking-mcp-server"
Copy-Item -Recurse -Force "$kit\project\*" $proj
Copy-Item -Recurse -Force "$kit\project\.claude" $proj
Copy-Item -Force "$kit\project\.mcp.json" $proj
Add-Content "$proj\.gitignore" ".claude/.needs-verify"
```
Sonra projedeki `CLAUDE.md` içindeki komutları ve klasörleri yeni projeye göre düzelt. Değişen kısım sadece orası.

### 3) OpenSpec (spec-first)
```powershell
npm install -g @fission-ai/openspec@latest
cd $proj
openspec init          # "Claude Code" seç → slash komutları eklenir
```
Akış: proposal komutu → `openspec/changes/<id>/` altında proposal + tasks + spec → **sen onaylarsın** → apply → archive.
Komut adları sürüme göre değişiyor. Kurduktan sonra `.claude/commands/` klasöründen kontrol et.

### 4) İkinci model (judge) CLI'ları
```powershell
npm install -g @openai/codex          # sonra: codex login
npm install -g @google/gemini-cli     # sonra: gemini (bir kere giriş)
```
Biri yoksa `/judge` onu atlar ve bunu raporda belirtir.

## Günlük akış (demo senaryosu)

1. `/ticket A/B sonucunu hesaplayan endpoint` → `tickets/003-ab-result.md`
2. OpenSpec proposal → spec'i oku, onayla
3. Paralel ajanlar:
   ```powershell
   .\scripts\new-worktree.ps1 ab-result
   .\scripts\new-worktree.ps1 webhook-retry
   ```
   Her worktree'de ayrı bir terminalde `claude` → "tickets/003 uygula"
4. Ajan bitirince **Stop hook** typecheck + test'i kendisi çalıştırır. Kırmızıysa Claude duramaz, düzeltmeye devam eder (en fazla 3 deneme).
5. `code-reviewer` agent + `/judge` → Claude, Codex ve Gemini bulgularını tablo olarak raporlar
6. Diff'i **sen** okursun → merge. Kararı veren ve sorumlu olan sensin.

## Hook nasıl çalışıyor

- `PostToolUse` (Edit/Write): kod dosyası değişince `.claude/.needs-verify` işaret dosyasını oluşturur. Sadece `.md` değiştiyse işaret koymaz.
- `Stop`: işaret varsa `typecheck → lint (script varsa) → test` çalıştırır.
  - Hepsi geçerse işareti siler ve Claude durur.
  - Biri kırmızıysa çıktıyı Claude'a geri verir (exit 2) ve Claude düzeltmeye devam eder.
  - 3 başarısız denemeden sonra durur ve sana uyarı gösterir. Sonsuz döngü olmaz.
- Test komutunu değiştirmek için: `$env:VERIFY_TEST_CMD = "npx vitest run tests/unit"`

Not: Claude dosyayı Bash ile (sed vb.) değiştirirse işaret konmaz. Kurallarda Edit/Write kullanması istendiği için bu genelde sorun olmaz.
