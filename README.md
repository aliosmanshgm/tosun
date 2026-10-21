# T10X Araç & Batarya Takip v0.10.0 — Faz 1: Kolay Günlük Kayıt

Kişisel T10X (88,5 kWh NMC) kullanımı için local-first + Firebase senkronizasyonlu, iPhone/PWA uyumlu batarya ve şarj takip uygulaması.

## v0.9.0 ana değişiklikleri

- **AC/DC artık sağlık skoru değildir.** DC/AC oranı istatistik olarak kalır; batarya stresi C-rate, SOC penceresi, şarj derinliği ve termal bağlamla değerlendirilir.
- **Düşük güçlü DC ayrı değerlendirilir.** Örn. 50 kW DC yaklaşık 0,56C, 180 kW yaklaşık 2,03C teorik paket oranıdır.
- **%20–80 koruma bandı** olarak tutulur; %20'yi bekleme veya her şarjı %80'e tamamlama zorunluluğu yoktur. Sığ şarjlar ΔSOC ile ayrı değerlendirilir.
- **SOC × zaman**: zaman damgalı şarj başlangıç/bitişleri ve manuel güncel SOC noktalarından ortalama SOC, >%80 saat ve >%90 saat proxy'si hesaplanır. 72 saatten uzun veri boşlukları integrasyona dahil edilmez.
- **CSI / CalSI / BSI**:
  - CSI: C-rate + ΔSOC + SOC pencere konumu
  - CalSI: SOC×zaman + termal bağlam
  - BSI: açıklanabilir birleşik maruziyet indeksi; SOH/RUL değildir.
- **Dinamik Şarj Planlayıcı**: mevcut SOC, planlanan mesafe, tüketim, rezerv, güvenlik payı, şarj gücü, hareket saati ve hava/park bağlamından gereken minimum hareket SOC'sini ve yaklaşık şarj zamanını hesaplar.
- **Saatlik termal zamanlama**: hava tahmini varsa, %80 altı hedeflerde termal açıdan daha uygun şarj penceresini arar; %80 üstü hedeflerde yüksek-SOC bekleme süresini azaltmak için hareket saatine yakın tamamlamayı önceler.
- **Termal proxy**: ortam sıcaklığı gerçek pack sıcaklığı olarak gösterilmez. Varsa BMS/servis batarya sıcaklığı önceliklidir; aksi halde ortam + park tipi + park süresi + şarj öncesi sürüşten nitel termal bağlam üretilir.
- **Konumdan hava**: iPhone Geolocation yalnızca sorgu anında kullanılır; enlem/boylam Firebase'e kaydedilmez. Browser-safe otomatik veri Open-Meteo'dan alınır. MGM resmi saatlik sayfasına uygulama içinden referans bağlantısı bulunur.
- **Teknik Rapor**: NMC/LFP, lithium plating, OCV-SOC, SEI/CEI, EFC, calendar/cycle aging ve uygulamanın v0.9 karar mantığı ayrı menüde açıklanır.

## Veri modeli

Firebase Realtime Database yolu:

`users/<uid>/appData`

Ana veri kümeleri:
- `settings`
- `providers`
- `charges`
- `trips`
- `consumptionSnapshots`
- `sohTests`
- `socSnapshots`
- `meta`

Şema sürümü: **15**. Eski local veriler otomatik migrate edilir.

## Güvenlik

- Firebase Authentication: Email/Password
- Web arayüzünde üyelik oluşturma yoktur.
- `database.rules.json` tek kullanıcı UID'sine kilitlidir.
- Firebase web config istemci tarafında bulunur; veri erişimi Authentication + Realtime Database Rules ile sınırlandırılır.

## GitHub Pages

Repo köküne bu klasörün içindeki dosyaları yükleyin.

Settings > Pages > Deploy from a branch > `main` / `(root)`

Yeni service-worker cache anahtarı `t10x-battery-v0.9.6-soh-audit` olarak güncellendi; önceki sürümlerin önbellekleri aktivasyon sırasında temizlenir.

## Bilimsel sınır

Uygulamadaki CSI, CalSI, BSI ve Kullanım Profili Skoru üretici BMS algoritması değildir. Bunlar literatürde tanımlanan mekanizmaları saha verisine açıklanabilir biçimde uygulayan karar-destek göstergeleridir. Gerçek hücre sıcaklığı, pack current, hücre gerilim dağılımları ve üretici SOH/DCIR verileri erişilebilir hale gelirse model geliştirilebilir.


## v0.9.1 - Terimler ve Kısaltmalar

- Ayrı **Terimler & Kısaltmalar** menüsü eklendi.
- 40+ teknik terim Türkçe karşılığı, İngilizce adı/kısaltması ve uygulamadaki pratik anlamıyla açıklanır.
- Arama kutusu ile terimler filtrelenebilir.
- Kullanıcı arayüzünde bazı İngilizce teknik ifadeler Türkçe öncelikli hale getirildi (ör. Enerji Geçişi / Throughput, Batarya Stres İndeksi / BSI).


## v0.9.2 - C-rate göstergeleri ve kayıt bağlamı

- **En Yüksek Şarj Ortalaması (C-rate):** Sahiplik dönemi oturumlarında enerji/süre ile ölçülebilen ortalama C-rate değerlerinin maksimumu. Tarih, sağlayıcı ve seans ortalama kW'si gösterilir.
- **En Yüksek Anlık Şarj Hızı (C-rate):** Girilmiş opsiyonel maksimum güçten hesaplanan tepe C-rate'lerin maksimumu. Tarih, sağlayıcı ve maksimum kW gösterilir.
- **Enerji Ağırlıklı Ortalama C-rate:** Yalnız hem istasyondan alınan kWh hem şarj süresi mevcut olan oturumlarda Σ(enerji × oturum ortalama C-rate) / Σ(enerji). Eksik kayıtlar değere sıfır olarak katılmaz; kapsanan kWh ve oturum sayısı gösterilir.
- Metrikler Gösterge Paneli, Analizler ve Stres Analizi içinde tutarlıdır. Bu gösterimler geçmiş Firebase verilerini veya batarya stres puanı formüllerini değiştirmez.
- Önceki sahip kayıtları kullanıcıya ait şarj istatistiklerinin dışında kalır.
- Service worker sürümü `t10x-battery-v0.9.2-crate-metrics` olarak güncellendi.


## v0.9.3 - sürüş / park / SOC zaman modeli

- Dashboard'da **Sürüşe Başla / Sürüşü Bitirdim / Yalnızca Durumu Güncelle**.
- İsteğe bağlı sürüş ortalaması: kWh/100 km; eşleşmiş sürüşlerde ayrıca ayrıntılı sürüş kayıtlarına eklenir. Son şarjdan beri tüketim sayaç kaydıyla karıştırılmaz.
- Başlangıç noktası olmadan sürüşü bitirme mümkün; kayıt, belirsiz sürüş dönemi olarak tutulur.
- `driveSessions` ve `activeDrive` verileri Firebase JSON içeriğine dahil edilir; şema v11, eski v10 otomatik okunur.
- SOC-zaman hesabında yalnızca gözlenen park süreleri CalSI'ye girer: **aynı km, SOC farkı en çok 3 yüzde puanı, aralık en çok 72 saat**. Giriş-çıkış zamanlarıyla bilinen sürüş ve şarj ayrılır. Uzun ve belirsiz boşluklar hesap dışında kalır.
- Doğrulanan parkın bitişi henüz gelmediyse, sürekli park varsayılıp süre ileriye doğru hesaplanmaz.
- Stres Analizi sayfasında ayrı park / sürüş / şarj / belirsiz saat ve veri güveni; son sürüşler ve CSV.
- ÖNEMLİ: Bu park ayrımı **mühendislik amaçlı konservatif zaman modeli**; doğrudan BMS telemetrisi veya doğrulanmış SOH tahmini değildir.
- Tek kullanıcı Firebase Rules ve Firebase config aynen korunur; GitHub Pages köküne yeni `soc-model.js` de yüklenmelidir.

### Test

`node tests/soc-model.test.js` (8 sentetik kontrol). Firebase Authentication / Realtime Database canlı bağlantısı ve iPhone Safari etkileşimi bu testlere dahil değildir.


## v0.9.4 - Dashboard tek ekrandan tüketim ve otomatik toplam
- Dashboard km/SOC hızlı formunda isteğe bağlı **Son şarjdan beri kWh/100 km** alanı.
- İsteğe bağlı **Bu sürüşün ortalama tüketimi** veri olarak ayrı kalır; son şarjdan beri sayacı ile karıştırılmaz.
- Toplam/sahiplik dönemi tüketimi elle girilmez. Mesafe ağırlıklı sürüş tüketimlerinden, tüketim yoksa tamamlanmış ve SOC düşüşü doğrulanmış sürüşlerden **yaklaşık** hesaplanır.
- Veri kapsamı (hesaba katılan km / sahiplik km), ölçülen ve SOC tahminli kilometreler ayrıca gösterilir. Önceki 1.181 km için eksik enerji verisi uydurulmaz.
- 100 km maliyeti, analizler ve şarj planlayıcısı aynı otomatik hesaplanan tüketim değerine dayanır.
- Eski manuel toplam tüketim değerleri JSON yedeğinde korunur ancak **artık hesaplamada kullanılmaz**.
- İkinci bir sürüş kaydı girip kilometreyi çift saymayın. Varsa mükerrer mesafe uyarısı gösterilir.
- Yeni dosya **consumption-model.js** GitHub köküne konulmalıdır.


### v0.9.4 — sahiplik dönemi enerji dengesi seçeneği

Dashboard, son şarjdan beri tüketim ve araç durumunun günlük giriş noktasıdır. Kullanıcı artık sahiplik dönemi toplam tüketimini elle giremez.

Toplam sahiplik tüketimi iki ayrı kanıt seviyesinde hesaplanır:

1. **Eksik şarj defteri veya doğrulanmamış bütünlük:** Sadece kaydedilmiş sürüş mesafelerinin mesafe-ağırlıklı ortalaması gösterilir. Bu, bütün sahiplik döneminin ölçülmüş ortalaması olarak sunulmaz. Kapsanan km payı görünür.
2. **Bütün şarjlar kayıtlı olarak açık onay verildiyse:** İstasyon kWh verisine tahmini AC/DC şarj verimi uygulanır, sahiplik başlangıç/güncel SOC farkı ile enerji dengesi kurulur, toplam sahiplik kilometresine bölünür. Sonuç kesin ölçüm değil, **yaklaşık toplam enerji tüketimi** olarak etiketlenir.

Formül: `E_tüketim ≈ Σ(E_AC × η_AC) + Σ(E_DC × η_DC) + (SOC_ilk − SOC_son) × E_kullanılabilir / 100`. Ardından `kWh/100km = E_tüketim × 100 / toplam kilometre`. Varsayılan η_AC=%90, η_DC=%96; bunlar T10X’e özel laboratuvarla doğrulanmış değerler değil, değiştirilebilir mühendislik varsayımlarıdır. 88,5 kWh nominal referanstır; gerçek kullanılabilir kapasite farklı olabilir.

Eksik kWh, tutarsız enerji dengesi veya başlangıç/güncel SOC/odometre yoksa sahte bir toplam sunulmaz. Eski manuel `total` değerleri korunur ancak hesaplamalarda kullanılmaz.


## v0.9.6 · SOH metodoloji ve gösterge denetimi

- SOH girişleri **BMS/servis beyanı**, **ölçülmüş net batarya kWh** ve **istasyon kWh (duyarlılık senaryosu)** olarak ayrıldı. Şarj kaybı artık zorunlu/değerli varsayılan alan değil; boş bırakılırsa örnek AC %5–15 ve DC %2–12 *kullanıcıyı yönlendirmeyen duyarlılık senaryoları* gösterilir. Bunlar T10X için doğrulanmış verim veya güven aralığı değildir.
- 88,5 kWh nominal paket kapasitesi otomatik yeni-batarya **kullanılabilir** SOH referansı olarak alınmaz. Referans yoksa SOH yüzdesi hesaplanmaz.
- Geçmiş SOH testleri korunur fakat eski tek-değerli varsayımlı SOH sonuçları referans/sağlık ölçümü dışında tutulur.
- BMS/servis SOH değerleri uygulama tarafından bağımsız doğrulanmaz; kullanıcı tarafından sağlanan rapor ölçümüdür.
- Kullanım Profili Skoru (heuristic) ve SOH ölçümü tamamen ayrıldı. Profil skoru kapasite kaybı veya gelecekteki ömrü ölçmez.
- Enerji toplamları, kWh eksik şarjlarda SOC farkından kWh uydurmaz. Gözlenmiş enerji kapsamı gösterilir.
- 100 km maliyet, istasyondan alınan şebeke enerjisi ile bataryanın kullandığı enerji ayrımına göre AC/DC verim varsayımı üzerinden yaklaşık hesaplanır. Bu bir fatura tahmini değil, analitik gösterge.
- Service worker yalnız aynı origin'deki başarılı statik kaynakları önbellekler; Firebase/kimlik/hava verisini önbelleklemez.
- Analizler / Stres / Planlayıcı için sıcaklık, güç, SOC, enerji varsayımları hâlâ gözlemsel göstergelerdir. Kalibre edilmiş hücre ömür modeli olmadığı için SOH veya RUL öngörmez.

**Kaynaklar:** DOI:10.1002/ese3.1581 (SOC/SOH referans test prosedürleri), DOI:10.1016/j.energy.2017.03.015 (şarj verimliliğinin ölçüme ve donanıma bağımlılığı).

**Teknik denetim:** Detay ve kısıtlar için `TEKNIK_DENETIM_NOTLARI.md` dosyasına bakınız.

## v0.9.6 — Dashboard: kişisel menzil tahmini

### Hangi veriler kullanılıyor?

1. **Tercih edilen birincil yöntem:** `driveSessions` içindeki başlangıç/bitiş kilometresi, SOC ve zaman damgası bulunan tam sürüşler. Kayıtlı şarj işlemi sürüş zaman aralığına giriyorsa veri dışlanır. SOC farkı en az 4 yüzde puanı, sürüş en az 20 km olmalı; 48 saatten uzun sürüşler ve fiziksel açıdan tutarsız km/SOC değerleri kullanılmaz.
2. Birinci kaynak yoksa, **bağımsız manuel yolculuklarda** (`trips`) mesafe + SOC başlangıç/bitiş kullanılır. Otomatik oluşturulmuş ve `linkedDriveId` içeren tekrarlar dahil edilmez. Manuel kayıtların tutarlılığı kullanıcıya bağlıdır.
3. Uygun SOC/km verisi yoksa, tüketim modeli tarafından türetilen ve kaynağı belirtilen tüketim değeri veya en son **son şarjdan beri kWh/100 km** sayacı kullanılır. Bu yedek yöntem kapasite bilgisi gerektirir.

### Hesap formülleri

- **SOC/km temelli %100 eşdeğer menzil:** `100 × toplam uygun sürüş km / toplam SOC düşüşü (yüzde puanı)`.
- **Tüketim temelli menzil:** `100 × kullanılabilir kapasite (kWh) / tüketim (kWh/100 km)`.
- Kullanılabilir kapasite girilmemişse **88,5 kWh nominal kapasite ile kaba senaryo** gösterilir; bu net kullanılabilir enerji veya üretici gerçek menzil ölçümü değildir.
- **Güncel SOC'den rezerv SOC'ye:** `%100 eşdeğer menzil × max(0, güncel SOC - rezerv SOC)/100`.
- **%20–80 aralığı:** `%100 eşdeğer menzil × 0,60`.
- **523 km WLTP karşılaştırması:** `(%100 eşdeğer menzil / 523 - 1) × 100`; WLTP ve gerçek kullanım koşulları aynı olmadığı için fark, batarya SOH kaybı anlamına gelmez.

### Güvenilirlik

Kaynak ve hesaplama varsayımları Dashboard kartında görünür. Birkaç sürüşten oluşturulan menzil tahmini sürüş hızı, klima/ısıtma, yokuş, hava ve sıcaklık değiştikçe anlamlı şekilde oynar. Bu değer BMS menzil değeri, SOH ölçümü veya garanti edilen mesafe değildir. Eksik veriler için `—` gösterilir; sahte menzil değeri üretilmez.

### Yükleme

v0.9.6 paketindeki **yeni `range-model.js`** dahil tüm dosyaları GitHub Pages deponuzun köküne koyun. Önce JSON yedeği alın. Yeni `wltpRangeKm` ayarı varsayılan 523 km olup Ayarlar'dan değiştirilebilir. Veri şeması 15'tir; önceki sürümlerin verileri korunur. Firebase kurallarının değiştirilmesi gerekmez. Service worker önbelleği `t10x-battery-v0.9.6-range` adını taşır.


## v0.9.7 — Akıllı Araç Paneli ve menzil karşılaştırması

- Dashboard üst kısmında ekran görüntüsünden esinlenilmiş, **gerçek kayıtlardan beslenen** iPhone uyumlu panel: mevcut SOC çubuğu (%20–80 işaretli), odometre, rezervli menzil, son şarjdan beri tüketim sayacı ve yalnız doğrulanmış SOH kaydı.
- **OBD/BMS canlı bağlantısı mevcut değildir**; doğrudan OBD akımı, gerçek paket sıcaklığı, SOH ya da hücre voltajı üretilmez. Örnek ekran görüntüsünün canlı OBD verileri taklit edilmez.
- Tek dokunuşla Durum/Sürüş Gir, Şarj Kaydı, Şarj Planla. Günlük hızlı veri girişi, menzil kartının hemen altında; uzun teknik gösterge listesi açılır bölümde.
- `range-model.js` artık birbirinden ayrı **km/SOC eşdeğer menzili** ve **tüketim/kapasite eşdeğer menzili** hesaplayıp yan yana gösterir. İlki, en az 30 km ve 8 SOC puanı değişen, arada kayıtlı şarj olmayan sürüşleri kullanır. Otomatik sürüş kaydı varsa ayrıca eklenen manuel sürüşler aynı havuza katılarak çift sayılmaz. Manuel kayıtlarda arada şarj olmaması kullanıcı kontrolüne bağlıdır.
- İki hesap arasındaki fark göreli %25 içinde ise SOC/km tahminine **en az %80**, nominal kapasite senaryosuna en fazla %20 ağırlık veren **yaklaşık uzlaşım** hesaplanır. Doğrulanmış kullanılabilir kapasite girdisinde SOC ağırlığı örnekleme göre %65–85 olur. Bu algoritma bilimsel olarak kalibre edilmiş kapasite kestiricisi değildir; iki tahmin aynı yolculuklardan türeyebilir, dolayısıyla bağımsız ölçüm sayılmaz.
- Uyuşmazlık >%25 olduğunda uzlaşım yapılmaz; SOC/km eşdeğer tahmini ana kartta korunur, tüketim senaryosu ayrı gösterilir ve uyuşmazlık belirtilir.
- Kullanılabilir kapasite bilinmiyorsa 88,5 kWh nominal paket enerjisi yalnızca **iyimser olabilen senaryo** olarak kullanılır. `%100 SOC eşdeğeri` %100'e gerçekten şarj edilerek test edilmiş menzil değildir.
- Rezervli menzil, %20–80 aralığı ve 523 km WLTP farkı ayrıdır; WLTP laboratuvar koşullarıyla gerçek kullanım birebir karşılaştırılmaz.
- Mevcut Firebase yapılandırması, tek kullanıcılı RTDB kuralları, JSON yedekleme, şarj geçmişi ve `schemaVersion:15` değişmedi. `sw.js` önbellek sürümü `t10x-battery-v0.9.7-cockpit` oldu.

### Kullanım

`index.html`, `app.css`, `app.js`, `range-model.js`, `sw.js` dahil **ZIP içindeki tüm dosyaları** GitHub Pages depo köküne yükleyin. Önce mevcut uygulamadan JSON yedeği alın. Daha sonra iPhone Safari'de menzil kartı ile Dashboard hızlı girişini deneyin; varsa eski service worker güncellenmesi için sayfayı yeniden açın.


## v0.9.8 — Menzil kartında bilimsel netlik ve son 90 gün

- Dashboard kartı **“Kullanımıma Göre Tahmini Menzil”** olarak adlandırıldı. %100 SOC değeri gerçek test değil, %100 eşdeğeri tahmindir.
- Sonucun SOC/km, tüketim veya ağırlıklı birleşik **senaryo** olduğu görünür biçimde açıklanır. WLTP farkının SOH olmadığı ayrıca belirtilir.
- **Tüm kayıtlar / Son 90 gün** düğmeleri eklendi. Son 90 gün görünümü sadece tarihi bilinen yakın sürüşleri ve yakın tarihte kaydedilen tüketim sayacını içerir; eski sahiplik tüketimi yakın dönem verisi gibi kullanılmaz. Yeterli kayıt yoksa tahmin boş kalır.
- Son uygun sürüşün tarihi ve kullanılan veri kapsamı gösterilir. Dönem seçimi geçicidir; Firebase'e, yerel veri dosyasına veya veri şemasına yeni alan yazılmaz.
- Yeni veri alanı yoktur; eski Firebase kayıtları ve güvenlik kuralları korunur. Service worker cache: `t10x-battery-v0.9.8-range-clarity`.

**Bilimsel not:** SOC/km menzili araç SOC göstergesine göre doğrusal %100 eşdeğeridir. Tüketim + nominal 88,5 kWh hesabı kullanılabilir kapasiteyi ölçmez. İki yöntemin ortak kaydı kullanması sebebiyle birleşik değer bağımsız doğrulama sayılmaz. Düşük sıcaklık/yüksek hız, WLTP farkı ve batarya yıpranması birbirinden ayrılmalıdır.


## v0.9.9 — Yaz / Kış Menzil Analizi (15 Ekim 2026)

- Dashboard'da yeni **Yaz / Kış Menzil Analizi** kartı: haziran–ağustos / aralık–şubat dönemlerinde kayıtlı kilometre-SOC sürüşlerinin tahmini %100 eşdeğer menzili. İlkbahar ve sonbahar ayrı dönemdir, kıyaslamaya katılmaz.
- İkinci görünüm **Sıcak / Soğuk Hava**: yalnızca sürüş sonundaki **gerçekten kaydedilmiş dış hava sıcaklığına** göre ≥25 °C ile ≤10 °C karşılaştırılır. Geçmiş sıcaklık uydurulmaz, ortam değeri BMS batarya sıcaklığı değildir.
- **Veri yeterliliği:** her grupta en az iki bağımsız sürüş ve ≥100 km; SOC/km yöntemi için ayrıca ≥20 SOC puanlık düşüş varsa aynı yöntemle mevsim farkı gösterilir. Yetersiz veri için ön gözlem olabilir; **yüzdelik kıyas üretilmez**.
- Kaynağı doğrudan sürüş olan km + SOC önceliklidir. Tarihli sürüşe özgü tüketim varsa ayrı değerlendirilir (mesafe ağırlıklı); yalnızca sahiplik ortalaması, şarj kWh toplamı ve son şarjdan beri sayaç **mevsimsel sürüş olarak sınıflandırılmaz**.
- Mevcut ve geçmiş `driveSessions`, `trips`, `charges` kayıtları korunur. Dashboard'un **Sürüşü Bitirdim** alanına opsiyonel dış hava sıcaklığı + konumdan anlık Open-Meteo sıcaklığı eklendi. Koordinat Firebase'e yazılmaz. Dış hava kaynağı ve gözlem zamanı kaydedilir.
- Sürüşün ortalama tüketimi girilmişse önceki gibi bağlantılı ayrıntılı sürüş oluşturulur; mevsimsel hesapta bu otomatik bağlantı çift sayılmaz.
- Yeni modül `seasonal-range.js`, 18 senaryo testi `tests/seasonal-range.test.js`, SW cache `t10x-battery-v0.9.9-seasonal-range`.
- Veri şeması **15** değişmedi; Firebase UID güvenliği ve mevcut JSON yedekleri korunur.

### Kullanım

1. Sürüşü Dashboard'dan başlatın; bitirirken kilometre ve SOC'yi güncelleyin.
2. İsterseniz sürüş sonundaki **dış hava sıcaklığını** elle girin ya da “Konumdan Sıcaklık Al” düğmesine dokunun.
3. **Yaz/Kış** kartı yeterli kayıt biriktikçe hesaplanır; **Sıcak/Soğuk Hava** görünümü yalnızca sıcaklık kaydı olan sürüşleri kapsar.
4. Karttaki değerler gerçek %100 menzil testi veya SOH ölçümü değildir. Rota/hız/klima/ısıtma/lastik vb. etkiler ayrıştırılmadığı için mevsimler arası fark nedensel bir batarya ölçümü sayılamaz.

**Kurulum:** v0.9.9 ZIP içindeki bütün uygulama dosyalarını (`seasonal-range.js` dahil) GitHub Pages kök dizinine yükleyin. Öncesinde JSON yedeği alın. `database.rules.json` güncellemesi gerekmez.


## v0.10.0 — Faz 1: Sürüş kaydı sadeleştirme (21 Ekim 2026)

- Günlük kullanım: Dashboard > **Araç Durumunu Güncelle** > km, SOC > **Güncel Km + SOC Kaydet**. Sürüş başlangıcı/bitişi zorunlu değil.
- Eski `Sürüşe Başla / Sürüşü Bitirdim` araçları açılır **İsteğe bağlı ayrıntılı sürüş kaydı** bölümünde kaldı; önceki `driveSessions` ve bağlı ayrıntılı `trips` korunur.
- Yeni menzil motoru `socSnapshots` içindeki normal `observation` kayıtlarını kronolojik toplar. Art arda küçük düşüşleri yeterli SOC/km elde edilene dek birleştirir; tamamlanan aralıklar çifte sayılmaz. Minimum 30 km ve 8 SOC puanı, 100–1.000 km makul menzil koşulu geçerlidir.
- İki günlük gözlem arasında **şarj oturumu kaydedilmişse** aralık dışlanır; 7 günü aşan iki ölçüm arası boşluklar da kullanılmaz. 14 günü aşan birikmiş aralık dışlanır. **Kaydedilmemiş şarjı saptayamaz**; şarjların tamamını girmek gerekir.
- Başlangıcı ve bitişi aynı mevsimde olmayan gözlem aralıkları mevsimsel karşılaştırmaya katılmaz. **Sıcak/soğuk** görünümünde gözlem aralıklarının iki ucunda da dış hava sıcaklığı bulunması, her ikisinin aynı sıcaklık sınıfında olması ve sürenin en fazla 24 saat olması gerekir.
- Günlük kayıt formunda isteğe bağlı dış hava sıcaklığı/konumdan anlık hava okuma var; yalnız sıcaklık ve veri kaynağı saklanır, koordinat saklanmaz.
- SOC×zaman hesabında günlük farklı km gözlemleri **sürüş süresi veya park süresi olarak varsayılmaz**; eski doğrulanmış sürüş/şarj ve aynı kilometrede park gözlemleri hesaplanmaya devam eder.
- Veri şeması v15 / localStorage anahtarı v14 korunur. Yeni Firebase kuralları, OAuth yapılandırması veya JSON dönüştürme işlemi gerekmez.
- İleri fazlar (bakım, garanti, servis) **henüz bu sürüme dahil değildir**.

### Kullanım notu

1. Gün sonunda km ve SOC girin. İster günlük ister 2–3 günde bir kayıt yapabilirsiniz.
2. AC/DC şarj ettiyseniz Şarj Kayıtları bölümüne mutlaka kaydedin, aksi halde gözlem aralığının şarjsız olduğu doğrulanamaz.
3. Aynı menzil hesabına bağlı tüketim sayacı girişi isteğe bağlıdır.
4. Eski sürüş geçmişi silinmemeli; yeni kayıtları zorunlu manuel sürüş gibi oluşturmanız gerekmez.
