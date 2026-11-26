# İş İlanı Açıklaması — BOS.pro / Marketing OS

> Orijinal ilan: [is ilani.md](is ilani.md)

## Bu ilan ne anlatıyor

**Şirket:** BOS.pro. Girişimciler için bir platform kuruyorlar: CRM, görev yöneticisi, ERP gibi iş uygulamalarını yapay zekâ ajanları yazıyor ve yönetiyor.

**Pozisyon:** Fullstack mühendis. Senin alanın **Marketing OS** olacak, yani reklam kampanyalarını yöneten bir uygulama. Ürün şunları yapacak:

- Proje ve deney (A/B test) yönetimi
- Sürükle-bırak workflow editörü
- Reklam kanallarına bağlanma (Meta, Google Ads vb.)
- Hedef kitle, kreatif ve landing page'i ajanların hazırlaması
- **Video OS:** reklam videolarını yapay zekâ ile üretmek
- Döngü şu: hipotez → kampanyayı başlat → metrikleri ölç → yeni deney. Amaç CPA'yı (bir müşteri kazanmanın maliyeti) düşürmek.

**Stack:** TypeScript/Node, React, PostgreSQL/Supabase, API'ler, webhook'lar.

**Çalışma şekli:**

- Kodu elle yazmıyorsun. Claude Code, Codex gibi CLI ajanlarını paralel çalıştırıp yönetiyorsun.
- Önce spec yazılıyor (OpenSpec), kod sonra geliyor.
- Merge'den önce farklı şirketlerin modelleri ("judge" modeller) kodu kontrol ediyor. Sonuçtan yine sen sorumlusun.
- İlk hafta platformu öğreniyorsun. Sonrasında **günde yaklaşık 100 kapanmış görev** bekleniyor. Bunlar küçük ticket'lar (bug, test, fix) ve paralel ajanlar yapıyor.

## Mülakatta senden ne istiyorlar

Klasik mülakat yok. **Tek görüşme var, yaklaşık 30 dakika, canlı demo.** Ekranını paylaşıp şunu gösteriyorsun:

1. Ajanların **gerçek bir görevi** nasıl yaptığı
2. Sonucu **nasıl doğruladığın**

Yani "Claude Code kullanıyorum" demek yetmiyor. Kurduğun düzeni çalışırken görmek istiyorlar.

## Neler hazırlamalısın

### 1. Gösterilecek gerçek bir proje

Bu klasördeki `hotel-booking-mcp` işe yarayabilir. İlana daha çok uyan küçük bir proje de yapabilirsin, mesela "mini Marketing OS":

- Supabase'de `projects`, `experiments`, `variants`, `metrics` tabloları
- React arayüzü
- A/B sonucunu hesaplayan bir endpoint
- Sahte bir reklam API'si için webhook

Bu tam olarak onların alanı.

### 2. Paralel ajan düzeni (en önemli kısım)

- Aynı anda 2–4 ajan, her biri kendi `git worktree`'sinde ayrı bir görev üzerinde
- Görevlerin kısa ve net yazılması (ticket formatı)
- Proje kurallarını anlatan `CLAUDE.md` / `AGENTS.md` dosyası
- Gerekirse ajanların gece de çalışabildiğini göstermek (background, `/loop` gibi)

### 3. Doğrulama zinciri (özellikle soracaklar)

- Ajan önce test yazsın, sonra kodu. Testlerin geçtiğini canlı göster.
- Lint, typecheck ve CI (GitHub Actions)
- **Başka bir modelle review:** Claude'un yazdığı kodu Codex veya Gemini'ye inceletmek. Bu, ilandaki "judge modeller" fikrinin birebir karşılığı.
- Ajanın hatalı yaptığı bir şeyi yakalayıp düzelttiğin bir örnek. Bu "körü körüne vibe coding yapmıyorum" mesajını verir.

### 4. Spec-first

Kod yazmadan önce bir spec dosyası (OpenSpec formatına bak) ve ajanın o spec'e göre çalışması.

### 5. Pazarlama bilgisi

- CPA, CPC, CTR, ROAS
- A/B testinde istatistiksel anlamlılık
- Meta/Google Ads API'lerinin genel mantığı
- Video üretimi tarafında Remotion, Runway, Veo gibi araçlara biraz göz atmak artı puan olur.

## Demo için önerilen akış (~30 dk)

| Süre | Adım |
|------|------|
| 2 dk | Düzenini ve klasör yapını tanıt |
| 5 dk | Bir spec göster ve 3 ajana 3 ayrı ticket ver |
| 5 dk | Ajanlar çalışırken bunu nasıl yönettiğini anlat |
| 10 dk | Testleri, ikinci model review'unu ve diff incelemeni göster |
| Kalan | Merge ve sorular |

## Başvurmadan önce dikkat edilecekler

- **Sözleşme iş sözleşmesi değil.** Bireysel girişimci (ИП) ya da hizmet sözleşmesi (ГПХ) olarak çalışıyorsun. Sosyal güvence yok ve vergiyi kendin ödüyorsun.
- **Çalışma düzeni 5/2 ile 6/1 arası.** Moskova saatiyle 12:00–19:00 sürekli ekran paylaşımı var. Üstüne sabah, gece ve hafta sonu ajanları kontrol etmen bekleniyor. Fiilen oldukça ağır bir tempo.
- **"Günde 100 görev" iddialı bir hedef.** Hesap verebilirlik sende olduğu için stres yüksek olabilir.
- **Paralel başka bir iş yasak** (full-time, başka proje yok).
- **Maaş ayda 2000–3000 USD.** Bulunduğun yere göre iyi ya da orta olabilir.
