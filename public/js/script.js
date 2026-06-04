// Finner alle skjemaer som har klassen confirm-form.
// Disse skjemaene brukes på sletteknapper.
// querySelectorAll henter alle elementer som passer med CSS-klassen.
const confirmForms = document.querySelectorAll(".confirm-form");

// Går gjennom hvert skjema og legger på en submit-lytter.
// forEach kjører samme kode for hvert skjema som ble funnet.
confirmForms.forEach((form) => {
    // addEventListener gjør at koden reagerer når skjemaet sendes inn.
    form.addEventListener("submit", (event) => {
        // Viser en bekreftelsesboks før sletting.
        // confirm returnerer true hvis brukeren trykker OK.
        const confirmed = confirm("Er du sikker på at du vil slette?");

        // Hvis brukeren trykker avbryt, stoppes skjemaet.
        if (!confirmed) {
            // preventDefault stopper vanlig innsending av skjemaet.
            event.preventDefault();
        }
    });
});
