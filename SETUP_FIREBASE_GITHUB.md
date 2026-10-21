# v0.11.0 · Faz 2 Kurulum ve İlk Kullanım

## v0.11.0 · Faz 2 — Periyodik Bakım Yönetimi

**ÖNCEKİ DOSYALARIN TÜMÜ + `maintenance-model.js`** GitHub Pages köküne yüklenmelidir. Firebase tek kullanıcı UID ve Realtime Database Rules değiştirilmez. Önce JSON yedeği alın.

### İlk kurulum

1. **Periyodik Bakım** menüsünü açın.
2. İlk tescil/bakım başlangıç tarihini **aracınızın belgelediği gerçek tarihe** göre girin. Bu, ikinci el satın alma tarihiniz olmayabilir; uygulama tarih uydurmaz.
3. Başlangıç kilometresi varsayılan 0 km'dir. Belgeye göre güncellenebilir.
4. Varsayılan bakım aralığı 24 ay veya 40.000 km, hangisi önce ise. Aracınızın üretici/servis dokümanındaki gerçek koşulu doğrulayın. Uyarılar varsayılan 90 gün ve 3.000 km kala görünür.
5. Daha önce tamamlanan **periyodik bakımları** 1., 2. ... olarak geçmiş tarihler ve km ile girin. Böylece sıradaki bakım hesabına geçilir. Lastik, ara kontrol ve diğer servis işlemleri otomatik sıradaki bakıma sayılmaz.
6. Bakım sonrası servis tarafından verilen bir sonraki tarih/km bilgisi varsa ilgili kayıt altında ayrıca kaydedin. Bu veri ana takvimi otomatik uzatmaz veya kısaltmaz; karşılaştırma amaçlı gösterilir.
7. İsteğe bağlı Drive belge bağlantısını ekleyin. Belgeler GitHub reposuna yüklenmez; erişim izinlerini kendiniz kısıtlayın.

### Yeni özellikler

- Dashboard'da **bir sonraki bakım**: kilometre taşı, son tarih, km sınırı, kalan gün/km, durum.
- Yeni **Periyodik Bakım** sekmesi: başlangıç takvimi, zaman/km uyarı eşikleri, geçmiş bakım ve rutin servis işlemleri, notlar, harcama, servis, özel öneri, belge bağlantısı.
- Kayıt **ekle / düzenle / sil** ve **CSV indir**. Eski veriler korunur.
- 1. bakım erken yapılsa dahi 2. bakım üretici-referanslı sabit takvimde 48 ay / 80.000 km olarak hesaplanır. Erken servis yeni bir 'sıfır noktası' değildir.
- Bakım zamanı: tarihin dolması **veya** kilometre sınırına ulaşılması. Tarih ya da km tek başına eşik olabilir.
- Model bellekte `maintenance.config` ve `maintenance.records` altında tutulur, Firebase JSON içerisinde otomatik senkronize edilir.
- Şema v16; localStorage v15. Önceki local v14 ve eski Firebase/JSON yapıları veri kaybı olmadan okunur.

### Sınırlar

- Servis fişi ve üretici bakım planı esas alınmalıdır. Uygulama garanti uygunluğu veya servis performansını doğrulamaz.
- Uygulama kapalıyken planlı e-posta / push göndermez; uyarılar Dashboard açıldığında güncellenir.
- Fabrika garantisi, batarya garantisi, garanti uzatması, açık servis dosyası, arıza ve parça tekrar analizi **Faz 3–4** kapsamındadır, Faz 2 kapsamında değildir.
- Kayıt işlemleri lokal Chromium ve birim testlerinde doğrulandı; gerçek Firebase oturumu ve iPhone Safari canlı ortamında ayrıca doğrulanmalıdır.

### Kontrol

`node tests/maintenance-model.test.js`

Ardından var olan diğer `tests/*.test.js` dosyalarıyla hesaplama regresyon testi çalıştırılabilir.

---

# Firebase + GitHub Pages Kurulum Kontrol Listesi — v0.9.9

## 1. Tamamlananlar
- Firebase projesi: `t10x-battery-tracker`
- Web app config uygulamaya işlendi.
- Realtime Database URL tanımlandı.
- Local-first / Firebase sync kodu hazır.
- UID-bazlı Realtime Database Rules dosyası hazır.
- GitHub Pages için `.nojekyll`, manifest ve service worker hazır.

## 2. Firebase Authentication
Firebase Console > Authentication > Sign-in method bölümünde **Email/Password** yöntemini etkinleştirin.

## 3. Realtime Database Rules
Firebase Console > Realtime Database > Rules bölümünde `database.rules.json` dosyasındaki içeriği yayınlayın.

Kural mantığı:
- giriş yapmamış kullanıcı okuyamaz/yazamaz;
- giriş yapan kullanıcı yalnızca kendi `users/<uid>/` alanına erişir.

## 4. Authorized domains
Firebase Console > Authentication > Settings > Authorized domains:
- local test için: `localhost`
- GitHub Pages yayını sonrası: `<github-kullaniciadi>.github.io`

## 5. Local test
Klasörde bir HTTP sunucusu çalıştırın:

```bash
python -m http.server 8080
```

Sonra tarayıcıdan `http://localhost:8080` açın.
`file://` ile açmak Firebase modülleri/service worker için uygun değildir.

## 6. GitHub repo
Yeni bir repo oluşturup klasör içeriğini repo köküne yükleyin.
Önerilen ad: `t10x-battery-tracker`

## 7. GitHub Pages
Repo > Settings > Pages:
- Source: Deploy from a branch
- Branch: `main`
- Folder: `/(root)`

Yayın URL'si genellikle:
`https://<kullaniciadi>.github.io/t10x-battery-tracker/`

## 8. İlk iPhone testi
Safari'de GitHub Pages URL'sini açın.
Firebase Console’da tanımlı tek kullanıcı hesabınızla giriş yapın.
Senkronizasyon doğrulandıktan sonra Safari Paylaş > Ana Ekrana Ekle ile PWA gibi kullanabilirsiniz.

## 9. Veri güvenliği
Firebase web config istemci tarafında görünür. Gerçek erişim kontrolü Authentication + Realtime Database Security Rules ile sağlanır.

## Tek kullanıcı modu (v0.9.6)

Bu sürümde uygulama giriş yapılmadan açılmaz ve web arayüzünde **Hesap Oluştur** seçeneği yoktur.

1. Firebase Console > Authentication > Users bölümüne gidin.
2. **Add user / Kullanıcı ekle** ile yalnızca kendi e-posta adresiniz ve bir şifre oluşturun.
3. Oluşan kullanıcının **User UID** değerini kopyalayın.
4. Realtime Database > Rules bölümünde `database.rules.single-user.template.json` dosyasını kullanın.
5. Dosyadaki `OWNER_UID_HERE` ifadesini kendi User UID değerinizle değiştirip Publish edin.

Bu kural, veritabanını yalnızca o UID'ye kilitler. Başka bir Firebase hesabı oluşturulsa dahi T10X veritabanını okuyamaz veya yazamaz.

GitHub'a v0.9.6 dosyalarını yükledikten sonra önceki service worker önbelleği nedeniyle eski ekranı görürseniz sayfayı yenileyin. Ana ekrana eklenmiş iPhone sürümünde uygulamayı tamamen kapatıp yeniden açmak da yeni service worker'ın devreye girmesini hızlandırır.


## v0.9.6 ek notlar
- `weather.js` GitHub Pages üzerinde otomatik hava sorgusu için gereklidir; repo kökünde tutulmalıdır.
- Konum izni yalnızca HTTPS/GitHub Pages (ve localhost geliştirme ortamı) üzerinde çalışır.
- Uygulama konum koordinatlarını Firebase veri modeline yazmaz.
- MGM resmi sayfası referans bağlantısıdır; tarayıcıdan otomatik sıcaklık için Open-Meteo kullanılır.
- Eski v0.8 verileri uygulama tarafından şema 10'a migrate edilir. JSON yedeğini yine de koruyun.


**v0.9.6:** GitHub Pages kök klasörüne `soc-model.js` ve yeni `consumption-model.js` dosyalarını koyun. Firebase kuralları değişmez. v12 veri modeli local/bulut v11 verilerini okuyabilir.


## v0.9.6 sürüm geçişi

1. Önce Dashboard > JSON Yedekle ile yedek alın.
2. ZIP içindeki **tüm** dosyaları (özellikle `consumption-model.js`, `app.js`, `index.html`, `app.css`, `sw.js`) mevcut GitHub Pages deposunun kök dizinine yerleştirin.
3. Mobil Safari sayfasını yenileyin; eski görünüm sürerse ana ekran uygulamasını kapatıp yeniden açın.
4. Dashboard > Güncel Araç Durumu formundan kilometre, SOC ve dilerseniz “Son şarjdan beri” tüketimini kaydedin.
5. Toplam sahiplik tüketimi manuel değildir. Yalnızca tüketimi bilinen sürüş km'leri ve uygun SOC tahmini bulunan tamamlanmış sürüşler kapsanır; önceki 1.181 km için otomatik enerji uydurulmaz.
6. Firebase Authentication veya Database Rules üzerinde değişiklik gerekmez.


## v0.9.6 — Dashboard tüketim değişikliği

- GitHub Pages kök klasörüne yeni `consumption-model.js` dosyasını da yükleyin. `index.html`, `app.js`, `app.css`, `sw.js` ve `README.md` dosyalarını güncelleyin.
- Firebase Security Rules veya kimlik doğrulama ayarları **değişmedi**. Yeni ayarlar aynı `users/<uid>/appData.settings` altında saklanır; şema v13'e yükselir ve eski kayıtlar korunur.
- Önce JSON yedeği alın. iPhone Safari'de önbelleğe takılırsa sayfayı tamamen yeniden yükleyin veya kurulu ana ekran kısayolunu kapatıp açın.
- Dashboard'daki “Şarjlarım eksiksiz” kutusunu yalnızca sahiplik başlangıcından bugüne tüm şarjların kWh değerlerini girdiyseniz işaretleyin. Hesap yaklaşık enerji dengesi tahminidir; üretici BMS verisinin yerine geçmez.


## v0.9.6 — SOH ve teknik denetim geçişi

1. Önce uygulamadaki **JSON yedeğini** kaydedin.
2. ZIP içindeki klasörün **içindeki tüm dosyaları** GitHub Pages deponuzun köküne yükleyin. Özellikle **`soh-model.js`**, `app.js`, `index.html`, `sw.js` ve mevcut `soc-model.js` / `consumption-model.js` eksik kalmamalı.
3. Firebase config, tek-kullanıcı UID ve Database Rules dosyaları değişmedi. Bunları gevşetmeyin; yeni rules yayımlamak gerekmez.
4. v0.9.4 yerel/veritabanı nesneleri şema v14'e dönüştürülür; eski SOH testleri `legacy` olarak korunur. Bunların yüzdesi artık BMS/servis SOH kartına dahil edilmez.
5. İlk açılışta **SOH Testleri → Veri Türü** menüsünü kontrol edin. Şarj kaybını bilmiyorsanız boş bırakın.
6. iPhone Safari eski dosyaları gösterirse uygulamayı tamamen kapatıp yeniden açın. Firebase oturumunu ve eski kayıtların yerinde olduğunu doğrulayın.
7. `TEKNIK_DENETIM_NOTLARI.md` bulgularını ve halen kalibre edilmemiş modelleri okuyun.


## v0.9.7 yayın notu

- Eski v0.9.6 dosyalarını, yeni ZIP'teki **bütün** uygulama dosyalarıyla değiştirin. `range-model.js` yeni SOC/km–tüketim kıyaslama mantığını içerir; `app.js` + `index.html` + `app.css` birlikte güncellenmelidir.
- Firebase Auth kimliği/kuralları değiştirilmez. Veri şeması v15 kalır. JSON yedeğini yayımlamadan önce alın.
- Panel canlı OBD verisi göstermiyor. Rakamlar girişlerinizden veya açıkça işaretli hesaplamalardan geliyor.
- Ekranda eski sürüm görünürse iPhone'da Safari/ana ekrana ekli web uygulamasını kapatıp yeniden açın; `sw.js` cache `t10x-battery-v0.9.7-cockpit`.


## v0.9.8 güncellemesi

Önce uygulamanızdan JSON yedeği alın. ZIP içindeki bütün dosyaları GitHub depo köküne yükleyin (`range-model.js`, `app.js`, `app.css`, `index.html`, `sw.js` birlikte). Veri şeması, Firebase yapılandırması ve tek kullanıcı kuralları değişmedi. Safari ana ekran uygulamasında eski kart görünürse uygulamayı yeniden açın. Son 90 gün düğmesi yalnızca menzil görünümünü filtreler, Firebase'e yazmaz.


## v0.9.9 Yaz/Kış Menzil geçişi

1. GitHub'a dosya yüklemeden önce çalışan uygulamanızdan **JSON Yedekle** kullanın.
2. Bu ZIP içindeki **bütün** dosyaları depo köküne aktarın; özellikle yeni `seasonal-range.js` olmadan app.js'deki yeni kart açılamaz.
3. Sayfayı tekrar açıp Dashboard > **Yaz / Kış Menzil Analizi** kartını ve **Sıcak / Soğuk Hava** düğmesini deneyin.
4. Eski cihaz önbelleği kalırsa iPhone Safari/PWA'yı tamamen kapatıp yeniden açın. Güncel cache: `t10x-battery-v0.9.9-seasonal-range`.
5. Yeni veriler eski Firebase nesnelerine opsiyonel `temp`, `tempSource`, `tempObservedAt` alanları olarak eklenir. Veri şeması **15** değişmez ve Firebase güvenlik kuralları aynı kalır.
6. Konum izni yalnızca açıkça “Konumdan Sıcaklık Al” düğmesi seçilince istenir. Koordinatlar DB'ye yazılmaz. Dış hava sıcaklığı batarya sıcaklığı değildir.


### v0.10.0 / Faz 1 yükseltmesi

1. Mevcut sürümde **JSON Yedekle** ile geçmiş verileri dışarı alın.
2. ZIP'in içindeki bütün uygulama dosyalarını GitHub deposunun **köküne** aktarın; `range-model.js`, `seasonal-range.js`, `app.js`, `app.css`, `index.html`, `sw.js` aynı sürüm olmalı.
3. Mevcut Firebase oturum ve tek kullanıcı kuralları değiştirilmez. Uygulama veri modeli `schemaVersion:15`, yerel kayıt anahtarı `t10xBatteryTracker_v14` olarak korunur.
4. Dashboard'da artık tek **Güncel Km + SOC Kaydet** düğmesi var. Eski sürüşler ve tüketimler yerinde kalır.
5. Menzil güncelliğinin güvenilirliği, arada yapılan şarjların **Şarj Kayıtları**na tam ve doğru girilmesine bağlıdır.
6. GitHub Pages güncellemesi sonrasında tarayıcıda eski ekran görünürse sekmeyi kapatıp yeniden açın veya sayfayı yeniden yükleyin (SW önbelleği sürümde değiştirildi).

> Bu yükseltme bakım/garanti/servis fazlarını **eklemez**. Yeni günlük durum kaydı, geçmiş kilometre ve SOC verileriyle birikerek çalışır.

### Faz 3 (v0.12.0) güncellemesi

- Mevcut uygulama içinden **JSON Yedekle** ile bir yedek alın.
- ZIP paketindeki uygulama klasörünün **tüm içeriğini** GitHub Pages depo köküne yükleyin. `coverage-model.js` mutlaka yüklenmelidir; `index.html` bu dosyayı `app.js` öncesinde çağırır.
- `database.rules.json` mevcut tek kullanıcı UID kuralını korur; Firebase kimlik bilgilerinizi veya veritabanı kurallarını genişletmeyin.
- İlk girişten sonra **Garantiler & Uzatmalar** sayfasında garanti belgelerindeki başlangıç tarihlerini girin. Varsayılan 36/96 ay ve 100.000/160.000 km sınırları düzenlenebilir.
- **Sigorta & Kasko** bölümünde trafik ve kasko poliçelerini ayrı ayrı kaydedin. Eski poliçeleri silmeyin: yenileme karşılaştırması için geçmiş veriye ihtiyaç vardır.
- İçe alma / dışa aktarma JSON, yeni `coverage` kayıtlarını da içerir. Belgelerin kendisi değil, yalnızca URL bağlantısı saklanır.
- Uyarılar uygulama açıldığında hesaplanır. Otomatik e-posta / bildirim henüz yoktur.

## v0.13.0 – Faz 4 yükseltme

1. Mevcut uygulamada **JSON Yedekle** ile güncel yedeği saklayın.
2. ZIP içindeki `t10x_arac_batarya_v0.13.0/` klasörünün **içindeki tüm dosyaları** GitHub Pages deponuzun kök dizinine taşıyın; `index.html`, `app.js`, `app.css`, `service-model.js` ve `sw.js` aynı sürüm olmalıdır.
3. Eski Firebase güvenlik kurallarını, kullanıcı UID'sini, giriş bilgilerini veya veritabanı adresini değiştirmeyin. Yeni `service` alanı mevcut kullanıcının kayıt nesnesine eklenir.
4. GitHub Pages üzerinden giriş yapıp **Servis & Arızalar** sayfasını açın; sırayla bileşen, servis ziyareti, arıza ve müdahale eklemeyi test edin. Kayıt sonrası sayfayı yenileyip girdilerin korunduğunu doğrulayın. Test kayıtlarını silin.
5. İlişkili servis belgelerini herkese açık GitHub'a değil, erişimi sınırlı Google Drive vb. bir alana yükleyip bağlantılarını saklayın.

**Önemli:** Servis ve poliçe kayıtlarındaki açıklamalar gerçek belgeleri esas alır. Poliçe seçmek, garanti kapsamının otomatik onaylandığı anlamına gelmez.
