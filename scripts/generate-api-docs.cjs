const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Footer, Header,
} = require('docx')
const fs = require('fs')

const PURPLE = '533483'
const LIGHT_PURPLE = 'EDE9F7'
const GRAY_BG = 'F5F5F5'
const BORDER_COLOR = 'CCCCCC'
const WHITE = 'FFFFFF'

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 32, font: 'Arial', color: WHITE })],
    shading: { fill: PURPLE, type: ShadingType.CLEAR },
    spacing: { before: 360, after: 160 },
    indent: { left: 200, right: 200 },
  })
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26, font: 'Arial', color: PURPLE })],
    spacing: { before: 280, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: PURPLE } },
  })
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 22, font: 'Arial', color: '2d2440' })],
    spacing: { before: 200, after: 80 },
  })
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text, font: 'Arial', size: 20, ...opts })],
  })
}

function bullet(text, bold = false) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, font: 'Arial', size: 20, bold })],
  })
}

function code(text) {
  return new Paragraph({
    spacing: { after: 80 },
    shading: { fill: GRAY_BG, type: ShadingType.CLEAR },
    indent: { left: 360, right: 360 },
    children: [new TextRun({ text, font: 'Courier New', size: 18, color: '1a1a1a' })],
  })
}

function methodBadge(method, url, color) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }
  const borders = { top: border, bottom: border, left: border, right: border }
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1440, 7920],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: 1440, type: WidthType.DXA },
          shading: { fill: color, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          verticalAlign: 'center',
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: method, bold: true, font: 'Arial', size: 20, color: WHITE })],
          })],
        }),
        new TableCell({
          borders,
          width: { size: 7920, type: WidthType.DXA },
          shading: { fill: 'F8F4FF', type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 200, right: 120 },
          children: [new Paragraph({
            children: [new TextRun({ text: url, font: 'Courier New', size: 20, color: '2d2440', bold: true })],
          })],
        }),
      ],
    })],
  })
}

function responseTable(status, color, description) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR }
  const borders = { top: border, bottom: border, left: border, right: border }
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1440, 7920],
    rows: [new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: 1440, type: WidthType.DXA },
          shading: { fill: color, type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: status, bold: true, font: 'Arial', size: 18, color: WHITE })],
          })],
        }),
        new TableCell({
          borders,
          width: { size: 7920, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 160, right: 120 },
          children: [new Paragraph({
            children: [new TextRun({ text: description, font: 'Arial', size: 18 })],
          })],
        }),
      ],
    })],
  })
}

function spacer() {
  return new Paragraph({ spacing: { after: 120 }, children: [] })
}

const BASE_URL = 'https://rrwynlvefmotlthypdcx.supabase.co/functions/v1'

const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: 'Arial', size: 20 } } },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: WHITE },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: PURPLE },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: 'Arial', color: '2d2440' },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
      },
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 80 },
          children: [
            new TextRun({ text: 'Dziennik Snow API — strona ', font: 'Arial', size: 16, color: '888888' }),
            new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: '888888' }),
          ],
        })],
      }),
    },
    children: [
      // ── TITLE PAGE ───────────────────────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1440, after: 200 },
        shading: { fill: PURPLE, type: ShadingType.CLEAR },
        indent: { left: -1134, right: -1134 },
        children: [new TextRun({ text: 'Dziennik Snow', bold: true, font: 'Arial', size: 56, color: WHITE })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: 'Dokumentacja API', bold: true, font: 'Arial', size: 36, color: PURPLE })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: 'Dream Journal API Reference', font: 'Arial', size: 24, color: '888888' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 720 },
        children: [new TextRun({ text: 'Wersja 1.0 — 2026', font: 'Arial', size: 20, color: '888888' })],
      }),

      // ── SECTION 1: Wprowadzenie ──────────────────────────────────────────────
      heading1('1. Wprowadzenie'),
      para('Ten dokument opisuje endpointy REST API aplikacji Dziennik Snow. API jest zbudowane jako zestaw Supabase Edge Functions (Deno) i umozliwia programistyczne dodawanie wpisow, zadawanie pytan agentowi Junga oraz pobieranie danych.'),
      spacer(),
      heading3('Baza URL (Base URL)'),
      code(BASE_URL),
      spacer(),
      heading3('Autentykacja (Authentication)'),
      para('Wszystkie endpointy wymagaja naglowka Authorization z tokenem JWT uzytkownika Supabase.'),
      spacer(),
      code('Authorization: Bearer <supabase_user_jwt>'),
      spacer(),
      para('Aby uzyskac token, zaloguj sie przez Supabase Auth i uzyj access_token z sesji (patrz Sekcja 4).'),
      spacer(),

      // ── SECTION 2: Endpointy ─────────────────────────────────────────────────
      heading1('2. Endpointy (Endpoints)'),

      // ENDPOINT 1
      heading2('2.1 Dodaj wpis snu (Add Dream Entry)'),
      spacer(),
      methodBadge('POST', `${BASE_URL}/add-dream`, '2E7D32'),
      spacer(),
      para('Dodaje nowy wpis do dziennika snow dla zalogowanego uzytkownika. Jesli nie podano daty, wpis zostaje przypisany do dzisiejszego dnia. Jesli nie podano motywow (tagow), sa one automatycznie wywnioskowane z opisu snu przez AI (model claude-haiku-4-5).'),
      spacer(),

      heading3('Naglowki zadania (Request Headers)'),
      bullet('Authorization: Bearer <token>  — wymagany'),
      bullet('Content-Type: application/json  — wymagany'),
      spacer(),

      heading3('Cialo zadania (Request Body)'),
      code('{'),
      code('  "description": "string  // wymagany — opis snu (moze zawierac HTML)"'),
      code('  "tags":        ["string"] // opcjonalny — jesli pusty, AI wybierze automatycznie'),
      code('  "date":        "YYYY-MM-DD" // opcjonalny — domyslnie: dzisiaj'),
      code('}'),
      spacer(),

      heading3('Dostepne motywy (tagi)'),
      bullet('Emocje: Radosc, Strach, Smutek, Zlosc, Milosc, Tesknota, Euforia, Spokoj, Niepokoj, Samotnosc, Wstyd, Nostalgia, Zdziwienie, Ulga'),
      bullet('Akcja: Latanie, Ucieczka, Poscig, Walka, Podroz, Transformacja, Poszukiwanie, Wspinaczka, Toniecie, Spoznienie, Zagubienie, Odkrycie'),
      bullet('Miejsca: Dom, Szkola, Praca, Miasto, Las, Gory, Morze, Plaza, Pustynia, Przestrzen kosmiczna, Zamek, Podziemia, Labirynt, Cmentarz, Rynek, Dworzec, Hotel, Szpital, Kosciol'),
      bullet('Przyroda: Woda, Ogien, Natura, Deszcz, Burza, Snieg, Chmury, Ksiezyc, Slonce, Gwiazdy, Wiatr, Mgla, Tecza, Tornado, Powodz'),
      bullet('Postacie: Rodzina, Przyjaciele, Nieznajomi, Zwierzeta, Dziecko, Starzec, Potwor, Duch, Aniol, Demon, Bohater'),
      bullet('Klimat snu: Koszmar, Lucydny, Powracajacy, Spokojny, Dziwny, Kolorowy, Czarno-bialy, Surrealistyczny, Realistyczny, Symboliczny'),
      bullet('Tematy: Magia, Fantazja, Tajemnica, Dziecinstwo, Przeszlosc, Przyszlosc, Muzyka, Jedzenie, Pieniadze, Smierc, Narodziny, Slub, Egzamin, Katastrofa, Supermoce'),
      spacer(),

      heading3('Odpowiedzi (Responses)'),
      responseTable('201', '2E7D32', 'Sukces — wpis zostal dodany'),
      responseTable('400', 'C62828', 'Bad Request — brakuje pola description'),
      responseTable('401', 'E65100', 'Unauthorized — brak lub nieprawidlowy token'),
      responseTable('500', '4A4A4A', 'Server Error — blad bazy danych lub AI'),
      spacer(),

      heading3('Przykladowa odpowiedz 201'),
      code('{'),
      code('  "id":          "550e8400-e29b-41d4-a716-446655440000",'),
      code('  "description": "Snilo mi sie, ze latalam nad miastem...",'),
      code('  "tags":        ["Latanie", "Miasto", "Euforia"],'),
      code('  "date":        "2026-06-05T12:00:00"'),
      code('}'),
      spacer(),

      heading3('Przyklad wywolania (curl)'),
      code('curl -X POST \\'),
      code(`  ${BASE_URL}/add-dream \\`),
      code('  -H "Authorization: Bearer <twoj_token>" \\'),
      code('  -H "Content-Type: application/json" \\'),
      code('  -d \'{"description": "Snilo mi sie ze latalam.", "date": "2026-06-05"}\''),
      spacer(),

      // ENDPOINT 2
      heading2('2.2 Zapytaj Junga (Ask Jung)'),
      spacer(),
      methodBadge('POST', `${BASE_URL}/ask-jung-api`, '1565C0'),
      spacer(),
      para('Wysyla pytanie do agenta AI wcielajacego sie w role Carla Gustava Junga. Agent ma dostep do snu z podanego dnia (domyslnie dzisiaj) oraz do historii ostatnich 50 snow uzytkownika. Zwraca krotka odpowiedz tekstowa po polsku.'),
      spacer(),

      heading3('Naglowki zadania (Request Headers)'),
      bullet('Authorization: Bearer <token>  — wymagany'),
      bullet('Content-Type: application/json  — wymagany'),
      spacer(),

      heading3('Cialo zadania (Request Body)'),
      code('{'),
      code('  "question": "string     // wymagany — pytanie do Junga'),
      code('  "date":     "YYYY-MM-DD" // opcjonalny — dzien snu, do ktorego nawiazuje pytanie; domyslnie: dzisiaj'),
      code('}'),
      spacer(),

      heading3('Odpowiedzi (Responses)'),
      responseTable('200', '2E7D32', 'Sukces — odpowiedz Junga'),
      responseTable('400', 'C62828', 'Bad Request — brakuje pola question'),
      responseTable('401', 'E65100', 'Unauthorized — brak lub nieprawidlowy token'),
      responseTable('500', '4A4A4A', 'Server Error — blad AI'),
      spacer(),

      heading3('Przykladowa odpowiedz 200'),
      code('{'),
      code('  "answer": "Ciekawe, ze wybralys wlasnie obraz latania — to czesto..."),'),
      code('  "date":   "2026-06-05"'),
      code('}'),
      spacer(),

      heading3('Przyklad wywolania (curl)'),
      code('curl -X POST \\'),
      code(`  ${BASE_URL}/ask-jung-api \\`),
      code('  -H "Authorization: Bearer <twoj_token>" \\'),
      code('  -H "Content-Type: application/json" \\'),
      code('  -d \'{"question": "Co moze oznaczac moj sen o lataniu?", "date": "2026-06-05"}\''),
      spacer(),

      // ENDPOINT 3
      heading2('2.3 Pobierz wpis (Get Dream Entry)'),
      spacer(),
      methodBadge('GET', `${BASE_URL}/get-dream?date=YYYY-MM-DD`, '6A1B9A'),
      spacer(),
      para('Pobiera wpis snu oraz pelna historie czatu z Jungiem dla podanego dnia. Jesli nie podano parametru date, zwraca dane dla dzisiejszego dnia. Pole dream jest null jesli nie istnieje wpis dla danego dnia.'),
      spacer(),

      heading3('Naglowki zadania (Request Headers)'),
      bullet('Authorization: Bearer <token>  — wymagany'),
      spacer(),

      heading3('Parametry URL (Query Parameters)'),
      bullet('date  (opcjonalny)  — format YYYY-MM-DD; domyslnie: dzisiaj'),
      spacer(),

      heading3('Odpowiedzi (Responses)'),
      responseTable('200', '2E7D32', 'Sukces'),
      responseTable('400', 'C62828', 'Bad Request — nieprawidlowy format daty'),
      responseTable('401', 'E65100', 'Unauthorized — brak lub nieprawidlowy token'),
      spacer(),

      heading3('Przykladowa odpowiedz 200'),
      code('{'),
      code('  "date": "2026-06-05",'),
      code('  "dream": {'),
      code('    "id":               "550e8400-...",'),
      code('    "description":      "<p>Snilo mi sie...</p>",'),
      code('    "description_plain":"Snilo mi sie...",'),
      code('    "tags":             ["Latanie", "Miasto"],'),
      code('    "created_at":       "2026-06-05T12:00:00"'),
      code('  },'),
      code('  "chat": ['),
      code('    { "id": "...", "role": "user",      "content": "Co to znaczy?",      "created_at": "..." },'),
      code('    { "id": "...", "role": "assistant", "content": "Latanie symbolizuje...", "created_at": "..." }'),
      code('  ]'),
      code('}'),
      spacer(),

      heading3('Przyklad wywolania (curl)'),
      code('curl -X GET \\'),
      code(`  "${BASE_URL}/get-dream?date=2026-06-05" \\`),
      code('  -H "Authorization: Bearer <twoj_token>"'),
      spacer(),

      // ── SECTION 3: Kody bledow ───────────────────────────────────────────────
      heading1('3. Kody Bledow (Error Codes)'),
      spacer(),
      responseTable('400 Bad Request', 'C62828', 'Nieprawidlowe dane wejsciowe — brakujace pole, zly format daty'),
      responseTable('401 Unauthorized', 'E65100', 'Brak lub nieprawidlowy token autoryzacyjny'),
      responseTable('500 Internal Server Error', '4A4A4A', 'Blad serwera — problem z baza danych lub AI'),
      spacer(),
      para('Wszystkie odpowiedzi bledow maja format: { "error": "opis bledu" }'),
      spacer(),

      // ── SECTION 4: Jak uzyskac token ─────────────────────────────────────────
      heading1('4. Jak Uzyskac Token (Authentication)'),
      spacer(),
      heading3('Opcja 1 — przez konsole przegladarki'),
      bullet('Zaloguj sie do aplikacji Dziennik Snow'),
      bullet('Otworz konsole przegladarki (F12 > Console)'),
      bullet('Wpisz ponizsze polecenie:'),
      spacer(),
      code('(await supabase.auth.getSession()).data.session.access_token'),
      spacer(),

      heading3('Opcja 2 — przez Supabase Auth REST API'),
      code('POST https://rrwynlvefmotlthypdcx.supabase.co/auth/v1/token?grant_type=password'),
      code('Content-Type: application/json'),
      code('apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'),
      spacer(),
      code('{'),
      code('  "email":    "uzytkownik@email.com",'),
      code('  "password": "haslo"'),
      code('}'),
      spacer(),
      para('Odpowiedz zawiera pole access_token — uzyj go jako Bearer token w naglowku Authorization.'),
      spacer(),

      // ── SECTION 5: Uwagi ─────────────────────────────────────────────────────
      heading1('5. Uwagi Techniczne (Technical Notes)'),
      spacer(),
      bullet('Wszystkie daty sa przechowywane i zwracane w strefie czasowej UTC'),
      bullet('Opisy snow moga zawierac HTML (generowany przez edytor TipTap w aplikacji)'),
      bullet('Pole description_plain w /get-dream zwraca czysty tekst bez tagow HTML'),
      bullet('AI do wnioskowania tagow uzywa modelu claude-haiku-4-5 (szybki, ekonomiczny)'),
      bullet('Agent Junga uzywa modelu claude-sonnet-4-6 (wyzszej jakosci)'),
      bullet('Limit historii snow w kontekscie Junga: ostatnie 50 wpisow'),
      bullet('Limit wiadomosci czatu pobieranych przez /get-dream: 100 ostatnich'),
      bullet('CORS: endpointy akceptuja zadania z dowolnej domeny (Access-Control-Allow-Origin: *)'),
      spacer(),
    ],
  }],
})

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/Users/kinga/Desktop/week-1/dream-journal/public/api-docs.docx', buffer)
  console.log('✅ api-docs.docx created successfully')
}).catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
