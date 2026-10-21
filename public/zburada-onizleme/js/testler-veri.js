/* =========================================================================
   zBurada — testler-veri.js
   PROTOTİP NOTU: Üretimde seçeneklerin puan haritası tarayıcıya hiç
   gönderilmez; puanlama /oturum/{id}/tamamla uç noktasında sunucuda yapılır
   (bkz. 02-PLAN.md §3). Buradaki veriler yalnızca tasarımı ve akışı statik
   olarak gösterebilmek içindir. Üretime geçmeden önce bir ölçme uzmanı /
   psikolojik danışman tarafından onaylanmalıdır.
   ========================================================================= */
window.ZB_TESTLER = {
  hukuk: {
    ad: "Hukuk",
    baslik: "Hukuk sana ne kadar uyuyor?",
    aciklama: "6 kısa durumda ne yapacağını seç. Doğru ya da yanlış cevap yok; analiz, ikna, adalet duyarlılığı ve araştırma sabrı açısından tarzını göreceğiz.",
    rozetler: ["Hâkim", "Savcı", "Avukat", "Bilirkişi"],
    boyutlar: { ANL: "Analiz", IKN: "İkna", ETK: "Adalet duyarlılığı", ARS: "Araştırma sabrı" },
    profiller: {
      ANL: { ad: "Dosya Dedektifi", rol: "Savcı", metin: "Delilleri birleştirir, olayın resmini sen kurarsın. Ceza hukuku ve savcılık seni heyecanlandırabilir.", sonraki: "Savcı rolünde delilleri birleştir, iddianameyi ekibinle kur." },
      IKN: { ad: "Kürsü Hatibi", rol: "Avukat", metin: "Sözün gücünü biliyorsun ve karşındakini dinleyerek ikna ediyorsun. Avukatlık, arabuluculuk ve dava stratejisi sana uygun alanlar olabilir.", sonraki: "Avukat rolünde müvekkilini savun; baskı altında ikna edici bir savunma kur." },
      ETK: { ad: "Adalet Pusulası", rol: "Hâkim", metin: "İki tarafı da dinler, adil olanı ararsın. Hâkimlik ve insan hakları hukuku ilgini çekebilir.", sonraki: "Hâkim rolünde iki tarafı dinle, delilleri tart ve kararı sen ver." },
      ARS: { ad: "Kütüphane Stratejisti", rol: "Bilirkişi", metin: "Ayrıntıda kaybolmaz, kaynağı bulursun. Akademik hukuk, şirket hukuku ve bilirkişilik sana göre olabilir.", sonraki: "Dosyanın en ince ayrıntısını incele; davanın seyrini değiştirecek bilgiyi sen bul." }
    },
    sorular: [
      { metin: "Sınıfta bir arkadaşın haksız yere suçlanıyor. İlk ne yaparsın?", secenekler: [
        { metin: "Olayı baştan sona not alır, kim ne zaman ne dedi çıkarırım.", puan: { ANL: 2, ARS: 1 } },
        { metin: "Öğretmenle konuşup arkadaşımı savunurum.", puan: { IKN: 2, ETK: 1 } },
        { metin: "Kuralın herkese eşit uygulanıp uygulanmadığını sorgularım.", puan: { ETK: 2 } },
        { metin: "Karışmam; büyükler halleder.", puan: {} } ] },
      { metin: "Bir münazarada sana savunması zor bir taraf düştü. Ne hissedersin?", secenekler: [
        { metin: "Heyecanlanırım; zor tarafı ikna edici kılmak tam bana göre.", puan: { IKN: 2, ANL: 1 } },
        { metin: "Karşı tarafın argümanlarını tek tek çürütecek bir tablo hazırlarım.", puan: { ANL: 2, ARS: 1 } },
        { metin: "İki tarafın da haklı olduğu noktaları dürüstçe söylerim.", puan: { ETK: 2 } },
        { metin: "Tartışmalar bana göre değil; arka planda kalmayı tercih ederim.", puan: {} } ] },
      { metin: "Hangi gün sana daha “iyi geçmiş” gibi gelir?", secenekler: [
        { metin: "Karmaşık bir bulmacayı çözdüğüm gün.", puan: { ANL: 2 } },
        { metin: "Birini fikrini değiştirmeye ikna ettiğim gün.", puan: { IKN: 2 } },
        { metin: "Haksızlığa uğrayan birine yardım edebildiğim gün.", puan: { ETK: 2 } },
        { metin: "Elimle bir şey ürettiğim ya da tasarladığım gün.", puan: {} } ] },
      { metin: "Hukukta işin büyük kısmı uzun metin okumak ve yazmaktır. Bu sana nasıl geliyor?", secenekler: [
        { metin: "Sorun değil; uzun metinler beni yormaz, hatta severim.", puan: { ARS: 2 } },
        { metin: "Detayların arasındaki çelişkiyi yakalamak hoşuma gider.", puan: { ANL: 2, ARS: 1 } },
        { metin: "Amacını bilirsem sabrederim; hele mesele adaletse.", puan: { ETK: 1, ARS: 1 } },
        { metin: "Açıkçası uzun okumalar beni çabuk sıkar.", puan: {} } ] },
      { metin: "Bir dosyada zaman daralıyor ve hızlı karar vermen gerekiyor. Sen…", secenekler: [
        { metin: "Elimdeki bilgileri hızla sıralar, en tutarlı seçeneği bulurum.", puan: { ANL: 2 } },
        { metin: "Sakin kalır, karşımdakini ikna edecek cümleyi kurarım.", puan: { IKN: 2 } },
        { metin: "Doğru olanı yapmak benim için hızdan önemlidir.", puan: { ETK: 2 } },
        { metin: "Biraz zaman isterim; araştırmadan karar vermem.", puan: { ARS: 2 } } ] },
      { metin: "Bir hukuk simülasyonunda hangi rolü seçerdin?", secenekler: [
        { metin: "Savcı: delilleri birleştirip olayı kurarım.", puan: { ANL: 2, IKN: 1 } },
        { metin: "Avukat: müvekkilimi sonuna kadar savunurum.", puan: { IKN: 2, ETK: 1 } },
        { metin: "Hâkim: iki tarafı dinleyip adil kararı veririm.", puan: { ETK: 2, ANL: 1 } },
        { metin: "Bilirkişi: dosyayı en ince ayrıntısına kadar incelerim.", puan: { ARS: 2, ANL: 1 } } ] }
    ]
  },

  tip: {
    ad: "Tıp",
    baslik: "Tıp sana ne kadar uyuyor?",
    aciklama: "Acil servisten laboratuvara: baskı altında karar vermek, insanlarla çalışmak ve uzun soluklu takip sana nasıl geliyor? 6 durum, doğru/yanlış yok.",
    rozetler: ["Acil Tıp", "Pratisyen", "Cerrah", "Araştırmacı Hekim"],
    boyutlar: { SOG: "Soğukkanlılık", EMP: "Empati", DKK: "Dikkat ve hassasiyet", MRK: "Merak" },
    profiller: {
      SOG: { ad: "Kriz Pusulası", rol: "Acil tıp hekimi", metin: "Baskı arttıkça daha net düşünüyorsun. Hızlı karar, triyaj ve acil servis temposu seni yıpratmıyor, besliyor.", sonraki: "Acil serviste bir vardiya: saniyeler içinde öncelik belirle, ekibi yönlendir." },
      EMP: { ad: "Yanındaki Doktor", rol: "Pratisyen hekim", metin: "Hastayı dinlemek, güven kurmak senin doğal yönün. Aile hekimliği ve uzun süreli takip sana uygun olabilir.", sonraki: "Pratisyen hekim rolünde bir hastanın hikâyesini baştan sona dinle, tanıya birlikte ulaş." },
      DKK: { ad: "El İşçiliği Ustası", rol: "Cerrah", metin: "Detaya ve hassasiyete yatkınsın; planlı, adım adım ilerleyen işler seni çekiyor. Cerrahi branşlar ilgini çekebilir.", sonraki: "Ameliyathanede bir vaka: adım adım prosedürü ekibinle uygula." },
      MRK: { ad: "Laboratuvar Kâşifi", rol: "Araştırmacı hekim", metin: "“Neden böyle oluyor?” sorusu seni rahat bırakmıyor. Akademik tıp ve araştırma sana göre olabilir.", sonraki: "Bir vakanın nedenini laboratuvar verileriyle birlikte araştır." }
    },
    sorular: [
      { metin: "Acil serviste aynı anda üç hasta geldi. İlk tepkin?", secenekler: [
        { metin: "Kimin daha acil olduğuna hızla karar veririm, panik yapmam.", puan: { SOG: 2 } },
        { metin: "Önce hepsiyle kısaca konuşup nasıl hissettiklerini anlarım.", puan: { EMP: 2 } },
        { metin: "Vital bulguları tek tek, hiç atlamadan kontrol ederim.", puan: { DKK: 2 } },
        { metin: "Üçünün de hikâyesini anlamaya çalışırım, bağlantı ararım.", puan: { MRK: 1, EMP: 1 } } ] },
      { metin: "Bir hastan tedaviyi uygulamak istemiyor. Ne yaparsın?", secenekler: [
        { metin: "Nedenini sabırla dinler, onun diliyle anlatırım.", puan: { EMP: 2 } },
        { metin: "Riskleri net ve kısa biçimde anlatır, kararı ona bırakırım.", puan: { SOG: 1, DKK: 1 } },
        { metin: "Literatürde benzer vakalarda ne yapıldığını araştırırım.", puan: { MRK: 2 } },
        { metin: "Dosyasını yeniden, en baştan ayrıntılı incelerim.", puan: { DKK: 2 } } ] },
      { metin: "Hangi ortam sana daha enerjik gelir?", secenekler: [
        { metin: "Hızlı, değişken, her an farklı bir şey olan acil servis.", puan: { SOG: 2 } },
        { metin: "Aynı hastalarla uzun süre ilişki kurduğun bir klinik.", puan: { EMP: 2 } },
        { metin: "Sessiz, odaklanmayı gerektiren bir ameliyathane ya da laboratuvar.", puan: { DKK: 1, MRK: 1 } },
        { metin: "Yeni bir sorunun kaynağını araştırdığın bir araştırma merkezi.", puan: { MRK: 2 } } ] },
      { metin: "Kan ve müdahale sahneleri sana nasıl geliyor?", secenekler: [
        { metin: "Rahatsız olmam; işin doğal bir parçası diye bakarım.", puan: { SOG: 1, DKK: 1 } },
        { metin: "Önce hastanın korkusunu azaltmaya odaklanırım.", puan: { EMP: 2 } },
        { metin: "Dikkatimi tamamen işleme veririm, el becerimi kullanırım.", puan: { DKK: 2 } },
        { metin: "Merak ederim; neden böyle bir müdahale gerektiğini anlamak isterim.", puan: { MRK: 2 } } ] },
      { metin: "Bir meslektaşın senden ikinci bir görüş istiyor. Sen…", secenekler: [
        { metin: "Hızla vakayı özetler, net bir öneri veririm.", puan: { SOG: 2 } },
        { metin: "Hastanın duygusal durumunu da sorarım.", puan: { EMP: 2 } },
        { metin: "Dosyadaki tüm verileri yeniden, satır satır gözden geçiririm.", puan: { DKK: 2 } },
        { metin: "Benzer vakalar hakkında güncel araştırmaları hatırlamaya çalışırım.", puan: { MRK: 2 } } ] },
      { metin: "Bir tıp simülasyonunda hangi rolü seçerdin?", secenekler: [
        { metin: "Acil tıp hekimi: triyaj yapar, hızlı karar veririm.", puan: { SOG: 2, DKK: 1 } },
        { metin: "Pratisyen hekim: hastanın hikâyesini dinler, takip ederim.", puan: { EMP: 2 } },
        { metin: "Cerrah: planı adım adım, titizlikle uygularım.", puan: { DKK: 2, SOG: 1 } },
        { metin: "Araştırmacı hekim: vakanın nedenini laboratuvarda araştırırım.", puan: { MRK: 2 } } ] }
    ]
  },

  "bilgisayar-muhendisligi": {
    ad: "Bilgisayar Mühendisliği",
    baslik: "Bilgisayar Mühendisliği sana ne kadar uyuyor?",
    aciklama: "Problemi parçalara bölmek mi, hemen denemek mi? 6 durumla kod dünyasındaki çalışma tarzını bul. Doğru/yanlış cevap yok.",
    rozetler: ["Yazılım geliştirici", "Veri bilimci", "Siber güvenlik", "Ürün mühendisi"],
    boyutlar: { MNT: "Mantık ve sistematik düşünme", MRK: "Merak ve deneme", TKM: "Takım çalışması", TSR: "Tasarım duyarlılığı" },
    profiller: {
      MNT: { ad: "Algoritma Avcısı", rol: "Yazılım geliştirici", metin: "Problemi küçük parçalara bölüp adım adım çözüyorsun. Sistem tasarımı ve backend geliştirme sana uygun olabilir.", sonraki: "Bir hata ayıklama görevinde kodun neden çöktüğünü adım adım bul." },
      MRK: { ad: "Deneme-Yanılma Kâşifi", rol: "Veri bilimci", metin: "Önce dener, sonra anlarsın. Veriyle oynamak, yeni bir kütüphaneyi denemek seni heyecanlandırır.", sonraki: "Bir veri setinde gizli kalıpları keşfetmeye çalış." },
      TKM: { ad: "Ekip Senkronu", rol: "Ürün mühendisi", metin: "Kod yazmak kadar ekiple iletişim kurmak da seni çekiyor. Ürün mühendisliği ve takım liderliği sana göre olabilir.", sonraki: "Bir ürün özelliğini ekiple birlikte uçtan uca tasarla ve teslim et." },
      TSR: { ad: "Arayüz Gözlemcisi", rol: "Siber güvenlik / güvenlik mühendisi", metin: "Ayrıntıyı, potansiyel açığı ve kullanıcı deneyimini aynı anda görüyorsun. Güvenlik mühendisliği ve kalite sana uygun olabilir.", sonraki: "Bir sistemdeki güvenlik açığını adım adım test et ve raporla." }
    },
    sorular: [
      { metin: "Kodun hata veriyor. İlk ne yaparsın?", secenekler: [
        { metin: "Hata mesajını satır satır okur, problemi küçük parçalara bölerim.", puan: { MNT: 2 } },
        { metin: "Hemen birkaç şey değiştirip deneyerek neyin işe yaradığını görürüm.", puan: { MRK: 2 } },
        { metin: "Ekip arkadaşıma danışır, birlikte bakarız.", puan: { TKM: 2 } },
        { metin: "Önce kullanıcının bunu nasıl fark ettiğini düşünürüm.", puan: { TSR: 2 } } ] },
      { metin: "Yeni bir proje başlıyor. Hangi görevi seçerdin?", secenekler: [
        { metin: "Sistemin genel mimarisini ve veri akışını planlamak.", puan: { MNT: 2 } },
        { metin: "Yeni, denenmemiş bir teknolojiyi araştırıp denemek.", puan: { MRK: 2 } },
        { metin: "Ekip içi görev dağılımını ve iletişimi koordine etmek.", puan: { TKM: 2 } },
        { metin: "Arayüzün kullanıcı için ne kadar anlaşılır olduğunu test etmek.", puan: { TSR: 2 } } ] },
      { metin: "Bir gece boyu tek başına çalışman gerekse en çok ne seni motive eder?", secenekler: [
        { metin: "Karmaşık bir algoritmanın verimliliğini artırmak.", puan: { MNT: 2 } },
        { metin: "Daha önce hiç kullanmadığım bir araçla bir şey inşa etmek.", puan: { MRK: 2 } },
        { metin: "Yalnız olmak pek tarzım değil; birlikte çalışmayı tercih ederim.", puan: { TKM: 1 } },
        { metin: "Küçük bir detayı, görünümü mükemmelleştirmek.", puan: { TSR: 2 } } ] },
      { metin: "Bir kod incelemesinde (code review) nasıl davranırsın?", secenekler: [
        { metin: "Mantık hatalarını ve performans sorunlarını ararım.", puan: { MNT: 2 } },
        { metin: "“Bunu şöyle de denesek?” diye alternatif yaklaşım önveririm.", puan: { MRK: 2 } },
        { metin: "Yapıcı geri bildirimi nazikçe, ekip uyumunu bozmadan veririm.", puan: { TKM: 2 } },
        { metin: "Kod okunabilirliğini ve isimlendirmeyi dikkatle kontrol ederim.", puan: { TSR: 2 } } ] },
      { metin: "Bir ürün özelliği kullanıcıdan kötü geri bildirim aldı. Ne yaparsın?", secenekler: [
        { metin: "Sistemdeki mantık hatasını bulup düzeltirim.", puan: { MNT: 2 } },
        { metin: "Farklı bir çözüm denemek için hızla prototip hazırlarım.", puan: { MRK: 2 } },
        { metin: "Kullanıcıyla ve ekiple konuşup gerçek ihtiyacı anlarım.", puan: { TKM: 2 } },
        { metin: "Arayüzün/akışın nerede kafa karıştırdığını incelerim.", puan: { TSR: 2 } } ] },
      { metin: "Bir yazılım simülasyonunda hangi rolü seçerdin?", secenekler: [
        { metin: "Backend geliştirici: sistemin mantığını kurarım.", puan: { MNT: 2 } },
        { metin: "Veri bilimci: veride kalıp ararım.", puan: { MRK: 2 } },
        { metin: "Ürün mühendisi: ekip ve kullanıcı arasında köprü kurarım.", puan: { TKM: 2 } },
        { metin: "Güvenlik mühendisi: sistemin açıklarını test ederim.", puan: { TSR: 2 } } ] }
    ]
  }
};
