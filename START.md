# Jak uruchomić Dziennik snów

## Pierwsze uruchomienie

Otwórz terminal w folderze `dream-journal` i wpisz:

```bash
npm install
npm run dev
```

Następnie otwórz http://localhost:5173 w przeglądarce.

## Na telefonie (ta sama sieć Wi-Fi)

```bash
npm run dev -- --host
```

Wejdź na adres, który pojawi się w terminalu, np. `http://192.168.1.x:5173`

## Co zobaczysz

- Ekran główny z powitaniem i jednym przykładowym snem
- Przycisk „Dodaj nowy sen" na dole
- Formularz z edytorem tekstu (TipTap)
- Szczegóły snu po kliknięciu kafelka

Dane są zapisywane lokalnie w przeglądarce (localStorage) i nie znikają po odświeżeniu.
