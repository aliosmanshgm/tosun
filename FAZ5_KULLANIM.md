# Faz 5 – kısa kullanım kılavuzu

**Belgeler:** Eski bakım, garanti, sigorta/kasko, servis ziyareti, arıza veya servis işlemine bağlantı oluşturun. İlgili kaydı seçtiğinizde bu belgeyi raporlarda ve geçmişte eşleştirebilirsiniz. Tek bir servis ziyareti için birden çok belge eklenebilir. Önceki sürümlerin belge URL alanlarını topluca listelemek için **Eski belge bağlantılarını içe al** kullanın. Belge PDF/JPG olarak Drive'da tutulur; Firebase'e yalnızca ad, tür, bağlantı, tarih ve ilişki bilgileri yazılır.

**Servis Raporları:** Yıl seçin; servis ziyaretlerini, arıza vakalarını, parça değişimlerini, tekrarlayan bileşenleri ve poliçe/garanti karşılama kararlarını inceleyin. CSV indirin veya Yazdır/PDF seçeneğiyle iOS/masaüstü sistem yazdırma menüsünü kullanın. Ziyaret bedeli ve işlem bedeli birbirini tekrarlayabilir, toplam maliyet olarak toplanmaz.

**Hatırlatmalar:** Periyodik bakım takvimi; araç ve batarya garanti tarihleri; trafik sigortası, kasko ve ek teminatların son tarihlerini takip eder. Sadece kilometre ile biten teminatlarda takvim alarmı üretilemez; uygulama içi uyarı korunur. Gün ön uyarı eşikleri özelleştirilebilir. `.ics` dosyasını kendi takviminize aktarıp takvim bildirim izinlerini açın. Aynı dosyanın birden fazla aktarımı bazı takvimlerde mükerrer olay oluşturabilir; mevcut etkinlikleri kontrol edin.

**Sınır:** v0.14 uygulama kapalıyken kendi başına e-posta veya push göndermez. Takvim uygulamanız olay/hatırlatmaları içe aktardıktan sonra işletim sisteminin sunduğu bildirimleri kullanabilir. Kurumsal sunucu tarafı e-posta hatırlatma istenirse zamanlanmış bir servis ve uygun kimlik/doğrulama kurulumu ayrıca gerekir.

**Veri aktarımı:** Eski v0.13 verileri, servis/bakım/garanti kayıtları ve şarj geçmişi korunur; `phase5.documents` ve `phase5.preferences` eklenir. GitHub'a yeni `phase5-model.js`, `phase5-ui.js` dahil *bütün dosyaları* yükleyin. Önce JSON yedeği alın.
