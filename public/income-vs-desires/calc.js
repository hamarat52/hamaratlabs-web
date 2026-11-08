/**
 * Site etkileşimleri. Bağımlılık yok, tek dosya.
 *
 * 1. Fiş satırları: rakama dokununca para ↔ süre. Eklentinin kendi hareketi.
 * 2. Saatlik ücret hesaplayıcı + örnek tablosu.
 *
 * Süre biçimlendirmesi eklentideki `formatDuration` ile birebir aynı kuralı
 * izler: dk → saat → gün (bir mesai) → ay (bir aylık mesai).
 */
(function () {
  'use strict';

  // --- 1. Fiş: para ↔ süre --------------------------------------------------

  document.querySelectorAll('.tick[data-money]').forEach((tick) => {
    const time = tick.textContent.trim();
    const money = tick.dataset.money;
    let showingTime = true;

    tick.setAttribute('aria-label', `${time}, yani ${money}. Değiştirmek için tıkla.`);

    tick.addEventListener('click', () => {
      showingTime = !showingTime;
      tick.textContent = showingTime ? time : money;
    });
  });

  // --- 2. Hesaplayıcı -------------------------------------------------------

  const form = document.getElementById('calcForm');
  if (!form) return;

  const ui = {
    salary: document.getElementById('salary'),
    hoursPerDay: document.getElementById('hoursPerDay'),
    daysPerMonth: document.getElementById('daysPerMonth'),
    hourly: document.getElementById('hourly'),
    hourlyNote: document.getElementById('hourlyNote'),
    examples: document.getElementById('examples'),
  };

  /** Sayfayı ziyaret edenin tanıyacağı, gerçekçi kalemler. */
  const BASKET = [
    { name: 'Bir fincan kahve', price: 90 },
    { name: 'Sinema bileti', price: 350 },
    { name: 'Haftalık market', price: 3500 },
    { name: 'Spor ayakkabı', price: 2499 },
    { name: 'Kablosuz kulaklık', price: 1899 },
    { name: 'Ortalama İstanbul kirası', price: 25000 },
    { name: 'Telefon', price: 49999 },
    { name: 'Otomobil', price: 1850000 },
  ];

  // Maaşı yazarken binlik ayracı: "1000" yerine "1.000".
  attachThousandSeparator(ui.salary);

  form.addEventListener('input', render);
  render();

  /**
   * `type="number"` ayraçlı değeri geçersiz saydığı için alan `type="text"`.
   * İmleç, solundaki rakam sayısı korunarak geri konuyor; yoksa her tuşta
   * sona sıçrıyor.
   */
  function attachThousandSeparator(input) {
    const format = (raw) => {
      const digits = String(raw).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
      return digits ? Number(digits).toLocaleString('tr-TR') : '';
    };

    input.addEventListener('input', () => {
      const caret = input.selectionStart ?? input.value.length;
      const target = (input.value.slice(0, caret).match(/\d/g) || []).length;

      input.value = format(input.value);

      let seen = 0;
      let position = target === 0 ? 0 : input.value.length;
      for (let i = 0; i < input.value.length && target > 0; i++) {
        if (/\d/.test(input.value[i])) seen++;
        if (seen === target) {
          position = i + 1;
          break;
        }
      }
      input.setSelectionRange(position, position);
    });

    input.value = format(input.value);
  }

  function render() {
    // Maaş alanı "50.000" biçiminde (binlik ayraç); Number("50.000") = 50 olurdu.
    const salary = positive(ui.salary.value.replace(/\D/g, ''));
    const hoursPerDay = positive(ui.hoursPerDay.value);
    const daysPerMonth = positive(ui.daysPerMonth.value);

    if (!salary || !hoursPerDay || !daysPerMonth) {
      ui.hourly.textContent = '·';
      ui.hourlyNote.textContent = 'üç alanı da doldur';
      ui.examples.replaceChildren();
      return;
    }

    const hoursPerMonth = hoursPerDay * daysPerMonth;
    const perHour = salary / hoursPerMonth;

    ui.hourly.textContent = money(perHour);
    ui.hourlyNote.textContent =
      `bir saatin · bir mesain ${money(perHour * hoursPerDay)} · ` +
      `ayda ${number(hoursPerMonth)} saat çalışıyorsun`;

    ui.examples.replaceChildren(
      ...BASKET.map((item) => {
        const tr = document.createElement('tr');
        const hours = item.price / perHour;

        const name = document.createElement('td');
        name.textContent = item.name;

        const price = document.createElement('td');
        price.textContent = money(item.price);

        const cost = document.createElement('td');
        cost.textContent = duration(hours, hoursPerDay, hoursPerMonth);

        tr.append(name, price, cost);
        return tr;
      })
    );
  }

  /** dk → saat → gün (bir mesai) → ay (bir aylık mesai) → yıl (12 ay) */
  function duration(hours, hoursPerDay, hoursPerMonth) {
    if (!Number.isFinite(hours) || hours <= 0) return '·';
    if (hours < 1) return `${Math.round(hours * 60)} dk`;
    if (hours < hoursPerDay) return `${number(hours)} saat`;
    if (hours < hoursPerMonth) return `${number(hours / hoursPerDay)} gün`;
    if (hours < hoursPerMonth * 12) return `${number(hours / hoursPerMonth)} ay`;
    return `${number(hours / (hoursPerMonth * 12))} yıl`;
  }

  function number(value) {
    const rounded = value < 10 ? Math.round(value * 10) / 10 : Math.round(value);
    return rounded.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  }

  function money(value) {
    return value.toLocaleString('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    });
  }

  function positive(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
})();
