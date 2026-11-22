# Ask SSC – Gemini + Vercel sürümü

Yapı: `public/index.html` (arayüz) → `api/chat.js` (Vercel fonksiyonu) → Google Gemini API.

## 1. Gemini anahtarı (ücretsiz katman)
1. aistudio.google.com/apikey adresine Google hesabınla gir.
2. **Create API key** de, çıkan anahtarı kopyala.
Ücretsiz katman her ülkede/model için geçerli olmayabilir. Hata alırsan Google AI Studio'da faturalandırma ayarına bak.

## 2. GitHub + Vercel
1. Klasörün içindekileri yeni bir GitHub deposuna yükle (README önceki anlatıma göre).
2. vercel.com → Add New → Project → depoyu Import et → Deploy.
3. Settings → Environment Variables:
   - `GEMINI_API_KEY` = az önce aldığın anahtar
   - `GEMINI_MODEL` = isteğe bağlı. Varsayılan `gemini-flash-latest`. Hata verirse AI Studio'daki model listesinden güncel bir "flash" modelin adını yaz.
4. Deployments → Redeploy.

## Bilgi bankasını güncelleme
GitHub'da `knowledge/ssc.json` dosyasını düzenle, Commit changes de. Vercel ~1 dakikada yeniler.

## Dikkat
- Ücretsiz katmanda dakikalık/günlük istek sınırı düşüktür. Çok öğrenci aynı anda yazarsa "Too many messages" görebilir.
- Ücretsiz katmanda gönderilen içeriklerin Google tarafından ürün geliştirmede kullanılabileceği belirtilmiş olabilir. Google'ın güncel şartlarını oku ve öğrencilere kişisel bilgi yazmamalarını söyle.
- Anahtarı asla bir dosyaya yazma, sadece Vercel'e koy.
