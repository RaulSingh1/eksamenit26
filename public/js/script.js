const confirmForms = document.querySelectorAll(".confirm-form");

confirmForms.forEach((form) => {
    form.addEventListener("submit", (event) => {
        const confirmed = confirm("Er du sikker på at du vil slette?");

        if (!confirmed) {
            event.preventDefault();
        }
    });
});
