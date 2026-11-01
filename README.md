# RainCraft Studio

**RainCraft Studio**, masaüstü özelleştirme aracı [Rainmeter](https://www.rainmeter.net/) için hem **görsel sürükle-bırak tuvali** hem de **akıllı canlı `.ini` kod düzenleyicisi** sunan web tabanlı bir tema/kabuk (skin) geliştirme stüdyosudur.

## Öne Çıkan Özellikler

- **Çift Yönlü Canlı Senkronizasyon:** Tuval üzerinde sürükleyip boyutlandırdığınız her katman anında `.ini` koduna yansır; kod editöründe yaptığınız değişiklikler gerçek zamanlı olarak tuvalde önizlenir.
- **Hazır Sürükle-Bırak Bileşen Kütüphanesi:**
  - **Saat & Tarih:** Modern Dijital Saat, Analog Kadran Saat, Takvim & Gün Bloğu
  - **Sistem Bilgileri:** CPU & RAM İkili Halka, Disk & Pil Durum Çubuğu, Canlı Ağ Trafik Grafiği
  - **Hava Durumu:** Anlık Sıcaklık ve Gökyüzü Durumu Kartı
  - **Müzik Oynatıcı:** Medya Oynatıcı Kontrolleri (Önceki / Oynat / Sonraki, ilerleme çubuğu, albüm kapağı) ve Canlı Ses Ekolayzır (VU)
- **Zengin Rainmeter Bileşen Desteği:**
  - **10 Meter Türü:** `String`, `Shape`, `Bar`, `Roundline`, `Histogram`, `Line`, `Image`, `Button`, `Rotator`, `Bitmap`
  - **12 Measure Türü:** `Time`, `CPU`, `Memory`, `FreeDiskSpace`, `NetIn`, `NetOut`, `NetTotal`, `Uptime`, `Calc`, `Plugin (NowPlaying / AudioLevel)`, `WebParser`, `Loop`
- **Akıllı `.INI` Kod Editörü:** Sözdizimi vurgulama, bağlama duyarlı otomatik kod tamamlama (`Ctrl+Space`), satır bazlı canlı hata/uyarı denetimi ve tıklanabilir sorun çekmecesi.
- **Gerçek `.rmskin` Kurulum Paketi Üretici:** Rainmeter Skin Installer standardına uygun `RMSKIN.ini`, `@Resources/Variables.inc`, tema klasör yapısı ve ikili (binary) 16-bayt `RMSKIN\0` altbilgi imzasıyla tek tıkla kurulabilir `.rmskin` paketi indirir.

## Yerel Kurulum ve Çalıştırma

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın (http://localhost:3000)
npm run dev
```

## Test ve Derleme

```bash
# Birim testlerini çalıştırın
npm test

# TypeScript tip kontrolü
npm run lint

# Üretim (production) paketini oluşturun
npm run build
```

## GitHub Pages ile Otomatik Yayınlama

Depoda `.github/workflows/deploy.yml` iş akışı hazır olarak yapılandırılmıştır:
1. Kodu GitHub deponuzun `main` dalına gönderin.
2. GitHub deponuzda **Settings → Pages → Build and deployment → Source** bölümünden **GitHub Actions** seçeneğini işaretleyin.
3. Her `push` işleminde birim testleri çalıştırılır, üretim derlemesi alınır ve uygulama otomatik olarak GitHub Pages üzerinde yayınlanır.
