## v0.14.0 — Faz 5 Teknik Kontroller

- Her belge ilişki anahtarı (`linkType`, `linkId`), HTTPS URL ve kayıt ayrımıyla tutulur. Drive dosyası Firebase'de saklanmaz, yalnız meta veri saklanır. Eski bağlantıların içe aktarımı tekrarlı eşleştirmeyi önler.
- Google Drive doğrudan upload OAuth `drive.file` kapsamı ister. OAuth tokenı yalnız tarayıcı belleğindedir, Client ID yerel ayarlardadır. Mevcut GitHub origin Google OAuth konsoluna önceden tanımlanmalıdır. Dış servis gerçek oturum testi yapılmamıştır.
- Servis ziyaretleri ve tek tek müdahalelerin bedelleri toplamda toplanmaz; çifte sayım yapılmaz. Bağımsız arıza vaka sayısı parça değişim sayısından ayrıdır.
- Takvim `.ics` alarmı yalnız tarihli gelecekteki olaylar için hazırlanır. Km eşiği olay tarihini öne çekebilir; takvim yalnız tarih hatırlatmasıdır. Sunucu tarafında e-posta gönderimi yoktur.
- `schemaVersion 19` ve `t10xBatteryTracker_v19`; eski `v16` ve daha eski yedekler migrate edilir. Firebase UID/rules değiştirilmez.

---

# T10X v0.9.5 — SOH ve Sayfalar Arası Bilimsel/Teknik Denetim

**Kapsam:** v0.9.4 kodundan v0.9.5 güncellemesi. İnceleme statik kaynak kodu ve otomatik modül testlerini kapsar. Üretici BMS telemetrisi, gerçek Firebase hesabı ve iPhone Safari ile canlı doğrulama yapılmamıştır.

## Esas metodolojik düzeltme

- **Ölçüm–varsayım ayrımı:** Şarj istasyonu sayacı (kWh) bataryaya geçen net enerji değildir. Şarj kaybı kullanıcı tarafından bilinmediği için SOH testi zorunlu varsayılan `%8` kayıpla hesaplanmıyor.
- SOH üç ayrı giriş türüne ayrıldı: **BMS/servis SOH raporu**, **ölçülmüş net batarya enerjisi**, **istasyon enerjisinden duyarlılık senaryosu**.
- Sadece istasyon sayacı biliniyorsa AC için **örnek %5–15**, DC için **örnek %2–12** kayıp *senaryosu* hesaplanır. Bunlar üretici verisi, popülasyon tahmini, güven aralığı veya ömür ölçümü değildir. Kullanıcının gerçekten ölçtüğü kayıp varsa tek değer olarak girilebilir.
- SOH yüzdesini net enerjiyle türetmek için **aynı sınırları temsil eden yeni batarya kullanılabilir kapasite** referansı gerekir. 88,5 kWh nominal paket kapasitesi varsayılan kullanılabilir kapasite olarak kullanılmaz.
- Eski SOH kayıtları silinmez; `legacy` olarak tanınır. Eski `%8`/`%4` kayıp varsayımından üretilen SOH, yeni *SOH Ölçümü* ve *SOH Eğilimi* göstergelerine katılmaz.

## Diğer sayfaların denetim sonucu

| Sayfa / hesaplama | Bulgular | v0.9.5 uygulaması / sonuç |
|---|---|---|
| **Dashboard** | Eski “Batarya Sağlık Skoru”, SOH ile kullanıcı alışkanlığı indeksini matematiksel olarak birleştiriyordu. | **Kullanım Profili Skoru** adlandırıldı; SOH artık skora girmez. SOH ayrı kart. |
| **Şarj Kayıtları** | kWh eksikse nominal kapasite × SOC farkı istasyon enerjisi gibi sayılıyordu. | `chargeEnergyValue()` yalnızca gerçekten girilmiş kWh kullanır. Eksik oturum dışarıda kalır, kapsam gösterilir. |
| **Tüketim / Sürüş** | Mülkiyetin tamamı ile örnek sürüş kapsamı ayrılıyor; enerji dengesi AC/DC verimine bağlı. | v0.9.4 kapsam kontrolü korunur. Eksik veri kesin ortalama diye gösterilmez. |
| **SOH Testleri** | Kullanıcıdan bilemeyeceği şarj kaybı isteniyor, tek varsayımla kesin SOH üretiliyordu; nominal/usable referans ayrılmıyordu. | Yeni üç kaynaklı model, senaryo, kaynak, eksik referans etiketleri. |
| **C-rate Simülatörü** | Güç / nominal enerji kapasitesi hücre C-rate değil yaklaşık paket proxy'sidir. | Bu uyarı korunur; sonuçlar doğrudan batarya ömür kaybı/teşhis sayılmaz. |
| **Şarj Planlayıcı** | Tüketim, sıcaklık, şarj gücü, AC/DC verimleri ve SOC model varsayımlarına bağlı. | Tahmin/proxy açıklamaları korunur; gerçek zamanlı batarya ısısı ve şarj eğrisi olmadığı için sonuç yaklaşık. |
| **Analizler** | SOH eğilimi eski varsayımsal testlerle kesin yüzdelik gibi dolabiliyordu. Aylık tüketim grafiğinde eksik değer `0` sayılabiliyordu. | SOH eğiliminde yalnız BMS ve net-enerji saha kestirimi bulunur. Eksik aylık tüketim sıfır sayılmaz. |
| **Stres Analizi** | Enerji ve SOC verisinin kapsayıcılığı aynı şeymiş gibi görülebiliyordu; enerji eksikleri tahmini kWh ile dolduruluyordu. | Enerji yalnız ölçülen kWh'den; kapsam **oturum sayısı ve enerji veri varlığı** üzerinden verilir. Kısmi enerji varsa puan *oturum ortalaması* olarak hesaplanır. |
| **Teknik Rapor** | “Charge-side EFC” hücre tam çevrimi ile karıştırılabilirdi. | `Σ istasyon kWh / nominal kWh` olarak belirtildi; **hücre EFC'si değildir**. SOH yöntem metni değiştirildi. |
| **Ayarlar / Firebase** | Verim varsayımı kullanıcıya açıklanmalı; kimlik/meteoroloji istekleri service worker önbelleğine girebiliyordu. | Verim varsayımları ayrı kaldı; service worker artık yalnız **aynı origin'deki statik içerikleri** önbellekliyor. UID erişim kuralları değiştirilmedi. |

## Önemli kalan belirsizlikler — sayısal hata anlamına gelmeyebilir

1. **Gerçek SOH:** BMS tarafından ölçülen/gösterilen değer veya servis raporu dışında kesin SOH verimiz yok. SOC×kWh örnekleri, hücre gerilim-akım ve sıcaklık eğrileri olmadan tanısal değildir.
2. **Gerçek C-rate:** İstasyon ekranındaki güç ve enerji, hücredeki DC akım zaman serisini temsil etmez. Tepe gücün ne kadar sürdüğü bilinmiyor.
3. **Takvim yaşlanması:** Açık/kapalı parkın gerçek paket sıcaklığı ölçülmüyor. Meteorolojik sıcaklık yalnız proxy'dir.
4. **BSI/CSI/CalSI:** Literatürden türetilmiş ama T10X hücresiyle kalibre edilmemiş, kullanıcı karar desteği amaçlı *heuristic* endekslerdir. **SOH veya kalan kullanım ömrü (RUL) öngörüsü değildir.**
5. **100 km maliyet:** Örneklemdeki maliyetli şarjlar ve ayarlı AC/DC verim varsayımlarına göre yaklaşık batarya-kWh başına maliyetten türetilir. Tüm harcama geçmişine veya fatura düzeyinde muhasebeye eşit değildir.
6. **Sahiplik tüketimi:** Tam şarj defteri kullanıcı tarafından onaylansa bile şarj verimi, kullanılabilir enerji, yardımcı tüketim ve kayıt başlangıç/bitiş SOC hataları sonucu etkiler.
7. **SOC-zaman:** Doğrulanmış park aralıkları kabul edilir; boşluklar ve bilinmeyen sürüş süreleri net yaşam maruziyeti sayılmaz. Ölçüm kapsamı artırılmalıdır.

## Doğrulama

- `node --check` (uygulama, SOH modülü, SW) başarılı.
- `node tests/soh-model.test.js`: senaryo, BMS, net enerji, hatalı veri, eski veri ayrımı başarılı.
- `node tests/consumption-model.test.js`: 16 enerji/tüketim testi başarılı.
- `node tests/soc-model.test.js`: 8 park/sürüş/zaman testi başarılı.
- HTML: 124 JavaScript DOM bağı ve 6 yerel JS dosyası mevcut; 212 HTML ID'si benzersiz.
- **Canlı Firebase + iPhone Safari:** doğrulanmadı; headless tarayıcı testi dış bağlantı zaman aşımı nedeniyle tamamlanamadı.

## Kaynak ve kısıtlar

- Song et al. (2023), [SOC/SOH referans test prosedürü](https://doi.org/10.1002/ese3.1581).
- [Measurement of power loss during electric vehicle charging and discharging](https://doi.org/10.1016/j.energy.2017.03.015): Verim değişkenliği.
- Deneysel aralıklar, şarj kayıp duyarlılık senaryolarını **kalibre etmiyor**. Senaryo aralıkları karar vericinin belirsizliği görmesi içindir.

## v0.9.6 Ek İnceleme: Gerçek Kullanım Menzili

- SOC tabanlı menzil, kaydedilmiş sürüş kilometresi ve SOC farkından türetilir; 88,5 kWh nominal kapasiteye ihtiyaç duymaz.
- Kaydedilmiş şarj oturumu sürüş aralığına giriyorsa SOC/km hesabı atlanır. Eksik veya kısmi zaman kayıtları menzil tahminine kesin veri olarak girmez.
- Bağımsız manuel yolculuklar ikinci seçimdir; Dashboard tarafından ayrıca türetilmiş yolculuklar (`linkedDriveId`) mükerrer sayılmaz.
- Enerji/tüketim yedeği açıkça kapasite varsayımı olarak adlandırılır. Kullanılabilir batarya kapasitesi teyit edilmemişse nominal 88,5 kWh'yi tam kullanılabilir kabul etmek fiziksel olarak doğrulanmamıştır.
- Menzil ile WLTP farkı batarya SOH ölçümü, üreticinin taahhüdünden sapma veya arıza teşhisi değildir.


## v0.9.7 — Menzil modeli ve arayüz denetimi

- Gönderilen görseldeki canlı OBD verilerini taklit etmek yerine, yalnız kullanıcı kayıtlarına dayanan SOC, kilometre, tüketim ve doğrulanmış SOH kullanıldı.
- SOC/km hesabında 30 km altı ve 8 SOC puanı altı seanslar, şarjla çakışan otomatik seanslar, mantıksız ve zamansal açıdan geçersiz seanslar hariç. Manuel yolculukların arada şarj olmaması kullanıcı tarafından doğrulanmalı.
- Tüketim/kapasite hesabında 88,5 kWh nominal referans, gerçek kullanılabilir enerji olarak sunulmaz.
- İki tahmin arasında %25'ten fazla sapma varsa otomatik ağırlıklı uzlaşım yapılmaz; uyuşmazlık görünür. %25 ve altındaki ağırlıklı değer **kalibre edilmiş menzil tahmini değildir**; algoritma bir yardımcı kestirimdir.
- SOC örneklemi sınıfı ve kullanılan yolculuk sayısı gösterilir; aynı araç verilerine dayanan iki yönteme bağımsız ölçüm muamelesi yapılmaz.
- Yerel hesaplama testleri ve Chromium önizleme testi yapılmıştır. Canlı Firebase hesabı ve iPhone Safari uçtan uca testi bu ortamda yapılmamıştır.


## v0.9.8 — Menzil açıklığı ve dönem karşılaştırması

- Ekran başlığı tahmini menzil olduğunu açıkça belirtiyor. WLTP farkı SOH olarak yorumlanmıyor.
- Ağırlıklı birleşim yalnızca yaklaşımsal uzlaşım: SOC ve tüketim hesaplarında paylaşılan veriler olabileceği için bağımsız iki ölçüm olarak sunulmuyor.
- Son 90 gün görünümü: tarihli tamamlanmış sürüşler, tarihli manuel yolculuklar ve tarihi uygun son tüketim kaydı; sahiplik dönemi enerji dengesi dışarıda. Birbirine karışan dönemlerin yanlış karşılaştırılmasını önler.
- Son sürüş tarihi görünür; dönem veri olmadan sonuç uydurmuyor.
- Mevcut kayıtlar, şema (15), servis işçisi kapsamı ve Firebase tek kullanıcı güvenliği korunuyor.


## v0.9.9 — Mevsimsel menzil metodoloji notu

- Meteorolojik mevsimler Türkiye yerel takvimi (Europe/Istanbul) ile sınıflandırılır. Yaz 6–8. aylar, kış 12/1/2. aylar. Diğer aylar dışarıda kalır.
- Sıcaklık görünümü mevsimle karıştırılmaz: gerçek dış hava ölçümü ≤10 °C veya ≥25 °C. Mevcut kayıtlarda temp yoksa sınıflandırılmaz; online hava sorgusu yapılıp eski veri icat edilmez.
- SOC kilometre menzili: 100 × Σkm / ΣSOC düşüşü. Her segment için en az 30 km ve 8 SOC puanı; 100–1000 km fiziksel-makul filtre. Tarih belli, sürüş süreleri uygun, arada bilinen şarj olmayan kayıtlar kullanılır. Elle girilen tarihsiz/şarjı belirsiz yolculuk sınırlamalarına dikkat.
- İkinci yöntem: Sürüşe özgü tüketimin Σ(kWh) / Σkm ağırlıklı ortalaması. İstasyondan alınan kWh, son şarj sayacı veya sahiplik ortalaması mevsimsel tüketim diye kullanılmaz. Kapasite bilinmiyorsa 88,5 kWh nominal varsayımı yalnız kaba menzil senaryosudur.
- **Kıyaslama şartları:** Her iki grupta aynı yöntem, en az 2 sürüş ve ≥100 km; SOC için toplam ≥20 SOC puanı. Yalnız tek taraf yeterliyse mevsim farkı gösterilmez. Birden fazla sezonda bulunan eski-yeni kayıtlar toplu karşılaştırmadır; eşleştirilmiş koşul araştırması değildir.
- Sonuçlar araç/batarya sağlık testi değildir. Ortam sıcaklığı pack/hücre sıcaklığı değildir; lastik, hız, tırmanış, rüzgar, klima, lastik ve sürüş profili karıştırıcı değişkenlerdir.


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

### Faz 3: Garanti ve poliçe metodolojisi (v0.12.0)

- İmalatçı garantileri: başlangıç tarihi ve `durationMonths` üzerinden tarih sınırı; `maxOdo` araç toplam kilometresindeki **mutlak üst sınır** olarak değerlendirilir. Erken dolan tarih/km koşulu statüyü bitirir. Başlangıç tarihi boşsa "bilgi eksik" gösterilir; varsayılan ilk tescil tarihi uydurulmaz.
- Araç genel: varsayılan 36 ay / 100.000 km; HV batarya: 96 ay / 160.000 km. Bu değerler kayıtta değiştirilebilir. Ek teminatlar ayrı durumlardır, üretici garantisinin takvimini değiştirmez.
- Poliçeler: her trafik/kasko sözleşmesi bağımsız dönem ve prim kaydıdır. Bitişten önceki `policyDays` eşiğinde uygulama içi uyarı çıkar. Gelecek dönem yenilemesi eski poliçeyi otomatik silmez.
- Prim karşılaştırması nominal TL yüzdesidir. Enflasyon düzeltmesi, gerçek teminat kapsam eşitliği, hasar sonrası fiyat değişimi veya prim yeniden değerleme bu sürümde yapılmaz.
- Firebase veri şeması v17; `coverage.warranties`, `coverage.extensions`, `coverage.policies`, `coverage.warnings`. Var olan şarj, tüketim, SOC, SOH, menzil, bakım ve geçmiş sürüş kayıtları migrate edilir. Firebase tek kullanıcı kuralları korunur.
- Garanti/hasar kararları hukuki güvence veya poliçe kapsam teyidi yerine geçmez. Belge bağlantısı yalnız HTTPS; uygulama bu sürümde Drive dosyasının kendisini yüklemez. Yerel/hesap testleri canlı Firebase doğrulaması değildir.

## Faz 4 (v0.13.0) doğrulama kapsamı

- Dört farklı nesne: `service.components`, `service.visits`, `service.issues`, `service.actions`.
- İkinci servis ziyareti ve **aynı vaka** tekrar sayılmaz; ikinci **bağımsız vaka** veya ikinci **parça değişimi** tekrar olarak işaretlenir.
- Garanti/kasko `coverageRecordId` bağları teminat kararından bağımsız tutulur; poliçe referansı kaldırılırsa işlem kaydı korunur, "bağlı kayıt bulunamıyor" olarak belirtilir.
- Servis ziyaretini/arıza vakasını/bileşeni silmek, ona bağlı kayıtlar mevcutken engellenir. Tarih ve maliyet doğrulamaları, belge URL'sinin HTTPS olması, aynı bileşen/parça katalog mükerrerliği kontrol edilir.
- `service-model.js` CommonJS + tarayıcı modülünde test edilir; tüm önceki Node model testleri ve ağsız mobil Chromium servis kaydı akışı çalıştırılmıştır. Canlı Firebase / gerçek iOS oturumu bu testlerin kapsamı dışındadır.

## v0.15.0 - Servis Surec Yonetimi

- `issues.firstVisitId` yeni kayitlarda opsiyonel; eski baglantilar korunur.
- Yeni diziler: `service.interactions`, `service.partOrders`, `service.followUps`; tumu benzersiz kayit kimlikleriyle iliskili servis dosyasina baglidir.
- Is emri/gercek servis ziyareti ayri, devam eden sikayet ayri tutulur. Ayni acik sikayete ait birden fazla gorusme ve ziyaret bagimsiz ariza sayisini artirmaz.
- Tarihli acik takip gorevleri, varsa tahmini parca temin tarihleri ve verilen randevu tarihleri `phase5-model.js` tarafindan hatirlatmalara/ICS'ye dahil edilir. Tarihlerin gercekligi ve randevunun servis tarafindan teyidi kullanici verisine baglidir.
- Uygulama tasariminda `schemaVersion:21`, yerel anahtar `t10xBatteryTracker_v21`; v20 dahil gecmis anahtarlar okunur. Bulut ve yerel veri arasinda otomatik birlestirme yapilmaz; zaman damgasi temelli mevcut Firebase sync protokolu korunur.
- Testler: eski v20 veri migrasyonu, randevusuz sikayet, gorsusme, tedarik, takip, takvim, kimlik koruma ve 390 piksel mobil gorunum. Canli Firebase/iPhone Safari uctan uca testi yapilmamistir.


## v0.15.1 – Servis kronolojisi

Olaylar tarih, mevcutsa HH:mm ile sıralanır. Aynı günün saatli olayları önce kronolojik, saatsiz olayları sonra el ile düzenlenen sırayla gösterilir. Kullanıcı sırası olay kimliklerinden bağımsız bir metin olarak değil, `service.timelineOrders` içinde dosya/gün bazında kalıcı olay anahtarlarıyla tutulur. Gerçek servis, arıza, müdahale veya belge kayıtları yerinde bırakılır. Yeni kayıt saati yoksa tahmin edilmez. Uygulama başına eskinin şeması 21 korunur; yeni alanlar opsiyoneldir.
