# Google Drive entegrasyonu - v0.14.0

Bu entegrasyon **isteğe bağlıdır**. Drive bağlantısı vermek yeterliyse API/OAuth kurulumu gerekmiyor. Uygulama bağlantıları ve dosya açıklamalarını Firebase içinde, dosya içeriğini ise sizin Drive hesabınızda saklar.

## 1. Google Cloud kurulumu

1. https://console.cloud.google.com/ adresinden size ait bir proje seçin veya oluşturun.
2. **APIs & Services > Library > Google Drive API > Enable** yapın.
3. **Google Auth Platform / OAuth consent screen** kısmını yapılandırın. Uygulamayı yalnız kendi hesabınız kullanıyorsanız test kullanıcıları listesine kendi Google hesabınızı ekleyin; gerektiğinde OAuth onay ekranını kurallara göre yayınlayın. Test modunda token/süre kısıtları olabileceğini unutmayın.
4. **Clients / Credentials > Create OAuth Client ID > Web application** oluşturun. **Authorized JavaScript origins** içine `https://<kullanici>.github.io` origin'inizi yazın. Repo yolunu (`/repo`) ve sondaki eğik çizgiyi origin'e eklemeyin. Özel alan adınız varsa onu da ayrı kaydedin.
5. Oluşan ve `.apps.googleusercontent.com` ile biten **Client ID** değerini uygulamanın Belgeler sayfasındaki alana girin. Bu değer cihazın `localStorage` alanında saklanır, Firebase'e gönderilmez. **Client Secret, servis hesabı anahtarı veya API Key kesinlikle girmeyin.**
6. Belge seçip **Dosyayı Özel Drive'ıma Yükle** düğmesine tıklayın, Google hesabı seçimini ve sınırlı Drive iznini onaylayın. `T10X Arac Takip Belgeleri` adlı, uygulamanın oluşturduğu klasör kullanılır. Yükleme sonrası belge URL alanı doldurulur. İlgili bakım/servis/poliçe kaydını seçerek **Belge Referansını Kaydet** düğmesine de tıklayın.

## İzin kapsamı ve güvenlik

- İzin: `https://www.googleapis.com/auth/drive.file`. Uygulamanın oluşturduğu/açtığı dosyalarla sınırlıdır. Drive'ın tüm dosyalarına genel okuma izni istenmez.
- Yükleme doğrudan tarayıcıdan Google Drive API'ye yapılır. Kimlik tokenı Firebase'e kaydedilmez; uygulama sekmesinde geçicidir.
- PDF / JPG / PNG; her dosya en çok 10 MB. Google Drive kotanız geçerlidir.
- Dosyalar otomatik herkese açık yapılmaz. Google hesabıyla erişim gerekir; yetkisiz üçüncü kişilere bağlantı göndermeyin.
- **Belge referansı silmek dosyanın kendisini Google Drive'dan silmez.** Drive'daki silme/taşıma işlemlerini hesabınızdan yönetirsiniz.
- Drive bağlantısının bozulması, Google API kotası, OAuth kısıtlaması ve çevrimdışı durumunda **mevcut Drive belge URL'sini elle** ekleyebilirsiniz.
- Mevcut hizmet/poliçe formlarındaki eski `documentUrl` bağlantıları korunur. Merkezî Belgeler indeksi yeni referansları ayrıca saklar; önceki alanlar otomatik silinmez.
- Drive dosyalarının kendisi JSON yedeğine dahil değildir. ZIP/GitHub'a belge yüklemeyin.

## Test planı

Firebase oturumuyla GitHub Pages'te açın, Drive OAuth iznini onaylayın, küçük bir PDF yükleyin, belge referansını kaydedin. Başka cihazda aynı Firebase hesabıyla oturum açıp referansın görüntülendiğini, Google hesabınızla açılabildiğini doğrulayın. Özel belgelerin yanlışlıkla herkese açık olmadığını kontrol edin.

## 2. Yüklenmiş belgeleri yeniden seçmek (v0.14.1)

- **Belgeler → Belge Ekle / Düzenle → Daha önce yüklediğim / kaydettiğim belgeyi seç** menüsünde Firebase'e kaydedilmiş belgeler hemen görünür.
- **Drive Belgelerini Getir / Yenile** ile yalnız uygulamanın oluşturduğu `T10X Arac Takip Belgeleri` klasöründeki dosyaları sınırlı `drive.file` izniyle listelersiniz. Yetki süresi bitmişse Google hesabı seçimi yeniden açılabilir.
- Menüde bir dosya seçildiğinde **Belge adı** ve **Drive bağlantısı** doldurulur. Dosya adı değiştirilebilir. İlişkili bakım/garanti/servis kaydını seçip **Belge Referansını Kaydet** düğmesine basarak Firebase'e belge referansını kaydetmeniz gerekir.
- Drive'da görünmeyen eski dosyalar daha önce başka uygulamayla veya klasörde oluşturulmuş olabilir; bu durumda mevcut HTTPS Drive bağlantısını elle ekleyebilirsiniz.
- Dosyalar Firebase Storage'a yüklenmez; listeleme sırasında Drive dosyalarının tamamının bir kopyası Firebase'e yazılmaz.
