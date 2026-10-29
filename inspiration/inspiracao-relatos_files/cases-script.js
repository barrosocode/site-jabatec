if( document.getElementById('cases')) {

    document.addEventListener('DOMContentLoaded', function() {

    const form = document.getElementById('filtro-form');
    const container = document.getElementById('cases-wrapper');

    function carregarPosts(page = 1) {

        const formData = new FormData(form);
        formData.append('action', 'filtrar_cases');
        formData.append('paged', page);
        formData.append('nonce', cases_script_vars.nonce);

        container.style.opacity = '0.5';

        fetch(cases_script_vars.ajaxurl, {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(html => {
            container.innerHTML = html;
            container.style.opacity = '1';

            window.scrollTo({
                top: container.offsetTop - 120,
                behavior: 'smooth'
            });
        })
        .catch(error => console.error('Erro:', error));
    }

    // Filtros
    form.addEventListener('change', function(e) {
        e.preventDefault();
        carregarPosts(1);
    });

    // Paginação
    document.addEventListener('click', function(e) {

        const link = e.target.closest('.page-numbers');

        if (!link || !link.href) return;

        e.preventDefault();

        const url = new URL(link.href);
        const page = url.searchParams.get('paged') || 1;

        carregarPosts(parseInt(page));
    });

});

}