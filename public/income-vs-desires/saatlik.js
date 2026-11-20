/**
 * Saatlik ücret hesaplama sayfası (saatlik-ucret-hesaplama.html).
 * Biçimlendirme ve süre kuralları calc.js'teki IVDCalc'tan gelir (ana sayfadaki
 * hesaplayıcıyla aynı). Her şey tarayıcıda hesaplanır; hiçbir değer gönderilmez
 * ya da kaydedilmez.
 *
 *   aylık saat      = haftalık saat × 52 ÷ 12
 *   saatlik ücret   = aylık net maaş ÷ aylık saat
 *   yol dahil       = haftalık saate (günlük yol dk ÷ 60 × haftada işe gidilen gün) eklenir
 *   ürünün süresi   = fiyat ÷ saatlik ücret
 */
(function () {
  'use strict';

  const form = document.getElementById('hourlyForm');
  const calc = window.IVDCalc;
  if (!form || !calc) return;

  const WEEKS_PER_MONTH = 52 / 12;
  const $ = (id) => document.getElementById(id);
  const ui = {
    salary: $('salary'),
    weeklyHours: $('weeklyHours'),
    commuteMinutes: $('commuteMinutes'),
    daysPerWeek: $('daysPerWeek'),
    hourly: $('hourly'),
    hourlyNote: $('hourlyNote'),
    commuteRow: $('commuteRow'),
    hourlyCommute: $('hourlyCommute'),
    price: $('price'),
    priceHours: $('priceHours'),
    priceNote: $('priceNote'),
  };

  calc.attachThousandSeparator(ui.salary);
  calc.attachThousandSeparator(ui.price);

  form.addEventListener('input', render);
  form.addEventListener('submit', (event) => event.preventDefault());
  render();

  function render() {
    // Para alanları "50.000" biçiminde (binlik ayraç); rakam dışını at.
    const salary = calc.positive(ui.salary.value.replace(/\D/g, ''));
    const weeklyHours = calc.positive(ui.weeklyHours.value);
    const commuteMinutes = calc.positive(ui.commuteMinutes.value);
    const daysPerWeek = calc.positive(ui.daysPerWeek.value) || 5;
    const price = calc.positive(ui.price.value.replace(/\D/g, ''));

    if (!salary || !weeklyHours) {
      ui.hourly.textContent = '·';
      ui.hourlyNote.textContent = 'maaşı ve haftalık saati doldur';
      ui.commuteRow.hidden = true;
      ui.priceHours.textContent = '·';
      ui.priceNote.textContent = 'önce saatlik ücretin hesaplansın';
      return;
    }

    const monthlyHours = weeklyHours * WEEKS_PER_MONTH;
    const perHour = salary / monthlyHours;
    ui.hourly.textContent = calc.money(perHour);
    ui.hourlyNote.textContent = `bir saatin · ayda ortalama ${calc.number(monthlyHours)} saat çalışıyorsun`;

    // Yol süresi girildiyse ikinci bir saatlik ücret: yolda geçen süre de işin parçası sayılır.
    let rate = perHour;
    let weeklyTotal = weeklyHours;
    if (commuteMinutes) {
      weeklyTotal = weeklyHours + (commuteMinutes / 60) * daysPerWeek;
      rate = salary / (weeklyTotal * WEEKS_PER_MONTH);
      ui.hourlyCommute.textContent =
        `yol dahil ${calc.money(rate)} · haftada ${weeklyTotal.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} saat işe ayırıyorsun`;
      ui.commuteRow.hidden = false;
    } else {
      ui.commuteRow.hidden = true;
    }

    if (!price) {
      ui.priceHours.textContent = '·';
      ui.priceNote.textContent = 'bir fiyat yaz';
      return;
    }

    const hours = price / rate;
    const hoursPerDay = weeklyTotal / daysPerWeek;
    const days = hours >= hoursPerDay ? ` · ${calc.duration(hours, hoursPerDay, weeklyTotal * WEEKS_PER_MONTH)}` : '';
    ui.priceHours.textContent = hoursMinutes(hours);
    ui.priceNote.textContent =
      `${commuteMinutes ? 'yol dahil saatlik ücretinle' : 'saatlik ücretinle'} çalışma${days}`;
  }

  /** 9,75 saat → "9 saat 45 dakika" */
  function hoursMinutes(hours) {
    const total = Math.round(hours * 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (!h) return `${m} dakika`;
    return m ? `${h.toLocaleString('tr-TR')} saat ${m} dakika` : `${h.toLocaleString('tr-TR')} saat`;
  }
})();
