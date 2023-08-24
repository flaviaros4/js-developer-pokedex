const pokemonList = document.getElementById('pokemonList');
const searchInput = document.getElementById('searchInput');
const pokemonModal = document.getElementById('pokemonModal');
const closeModalButton = document.querySelector('.close-modal');
const modalBody = document.querySelector('.modal-body');

const maxRecords = 151;
const limit = 151;
let offset = 0;
let allPokemonData = [];

// Função para buscar dados de um Pokémon via API
function fetchPokemonData(url) {
    // Retorna uma Promise que faz uma requisição à URL especificada e processa a resposta
    return fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error('Erro ao buscar dados de Pokémon');
            }
            return response.json();
        })
        .catch((error) => {
            console.error('Erro ao buscar dados de Pokémon:', error);
        });
}

// Função para buscar detalhes de um Pokémon
function fetchPokemonDetails(pokemonId) {
    const url = `https://pokeapi.co/api/v2/pokemon/${pokemonId}/`;
    return fetchPokemonData(url).then((pokemonData) => {
        if (!pokemonData) return;

        return fetchPokemonData(pokemonData.species.url).then((speciesData) => {
            return fetchPokemonData(speciesData.evolution_chain.url).then((evolutionChainData) => {
                return { pokemonData, evolutionChainData };
            });
        });
    });
}

// Função para converter dados de um Pokémon em um elemento de lista
function convertPokemonToLi(pokemon) {
    const types = pokemon.types.map((type) => type.type.name).join(', ');

    return `
        <li class="pokemon ${types}" data-pokemon-id="${pokemon.id}">
            <span class="number">#${pokemon.id}</span>
            <span class="name">${pokemon.name}</span>

            <div class="detail" onclick="openPokemonModal(${pokemon.id})"> <!-- Adicionado evento de clique aqui -->
                <ol class="types">
                    ${pokemon.types.map((type) => `<li class="type ${type.type.name}">${type.type.name}</li>`).join('')}
                </ol>

                <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            </div>
        </li>
    `;
}

// Função para carregar itens de Pokémon com paginação
function loadPokemonItems(offset, limit) {
    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;

    fetchPokemonData(url)
        .then((response) => {
            if (!response) return;
            const pokemons = response.results;
            const pokemonDataPromises = pokemons.map((pokemon) => fetchPokemonDetails(getPokemonIdFromUrl(pokemon.url)));
            return Promise.all(pokemonDataPromises);
        })
        .then((pokemonData) => {
            allPokemonData = allPokemonData.concat(pokemonData);
            displayPokemonList();
        });
}

// Função para obter o ID de um Pokémon a partir de uma URL
function getPokemonIdFromUrl(url) {
    const parts = url.split('/');
    return parseInt(parts[parts.length - 2]);
}

// Função para exibir a lista de Pokémon na página
function displayPokemonList(searchTerm = '') {
    const filteredPokemon = allPokemonData.filter((pokemonData) =>
        pokemonData.pokemonData.name.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
    const newHtml = filteredPokemon.map((pokemonData) => convertPokemonToLi(pokemonData.pokemonData)).join('');
    pokemonList.innerHTML = newHtml;
}

// Função para pesquisar Pokémon com base no input de pesquisa
function searchPokemon() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    displayPokemonList(searchTerm);
}

// Função para abrir o modal com os detalhes do Pokémon
function openPokemonModal(pokemonId) {
    const pokemonData = allPokemonData.find((data) => data.pokemonData.id === pokemonId);

    if (!pokemonData) return;

    const modalContent = document.querySelector('.modal-content');
    modalContent.className = 'modal-content'; // Limpe as classes existentes
    modalContent.classList.add(`pokemon-type-${pokemonData.pokemonData.types[0].type.name}`);

    modalBody.innerHTML = ''; // Limpa o conteúdo anterior da modal

    // Crie uma div de contêiner para o Pokémon
    const pokemonContainer = document.createElement('div');
    pokemonContainer.classList.add('pokemon-container');

    // Nome do Pokémon
    const pokemonName = document.createElement('h3');
    pokemonName.textContent = pokemonData.pokemonData.name;

    // Adicione o nome ao contêiner
    pokemonContainer.appendChild(pokemonName);

    // Imagem do Pokémon
    const pokemonImage = document.createElement('img');
    pokemonImage.src = pokemonData.pokemonData.sprites.front_default;
    pokemonImage.alt = pokemonData.pokemonData.name;
    pokemonImage.classList.add('pokemon-image');

    // Adicione a imagem ao contêiner
    pokemonContainer.appendChild(pokemonImage);

    // Adicione o contêiner principal à modal
    modalBody.appendChild(pokemonContainer);

    // Painel de informações do Pokémon
    const pokemonInfoPanel = document.createElement('div');
    pokemonInfoPanel.classList.add('pokemon-info');

    // Tipo do Pokémon
    const pokemonTypes = document.createElement('p');
    pokemonTypes.innerHTML = `<strong>Type:</strong> <br> ${pokemonData.pokemonData.types.map((type) => type.type.name).join('<br> ')}`;

    // Peso do Pokémon
    const pokemonWeight = document.createElement('p');
    pokemonWeight.innerHTML = `<strong>Height:</strong> <br> ${pokemonData.pokemonData.weight / 10} <br>kg`;

    // Altura do Pokémon
    const pokemonHeight = document.createElement('p');
    pokemonHeight.innerHTML = `<strong>Weight:</strong> <br> ${pokemonData.pokemonData.height / 10} <br>m`;

    // Adicione as informações ao painel de informações
    pokemonInfoPanel.appendChild(pokemonTypes);
    pokemonInfoPanel.appendChild(pokemonWeight);
    pokemonInfoPanel.appendChild(pokemonHeight);

    // Adicione o painel de informações à modal
    modalBody.appendChild(pokemonInfoPanel);

    // Exiba as estatísticas
    modalBody.innerHTML += `<h4>Stats</h4>`;
    modalBody.innerHTML += `<ul class="stats-list">`;
    pokemonData.pokemonData.stats.forEach((stat) => {
        modalBody.innerHTML += `
            <li>
                <span class="stat-name">${stat.stat.name}</span>:
                <span class="stat-value">${stat.base_stat}</span>
            </li>
        `;
    });
    modalBody.innerHTML += `</ul>`;

    // Exiba informações de evolução
    modalBody.innerHTML += `<h4>Evolutions</h4>`;
    displayEvolutions(pokemonData.evolutionChainData.chain);

    // Abre a modal
    pokemonModal.style.display = 'flex';
}

// Certifique-se de que a modal não esteja visível no carregamento da página
pokemonModal.style.display = 'none';

// Função para exibir informações de evolução de um Pokémon
function displayEvolutions(evolutionChain) {
    if (!evolutionChain) return;

    const speciesUrl = evolutionChain.species.url;

    // Faz uma chamada à API para obter os detalhes do Pokémon usando a URL da espécie
    fetchPokemonData(speciesUrl)
        .then((speciesData) => {
            const pokemonName = speciesData.name;
            const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getPokemonIdFromUrl(speciesUrl)}.png`; // URL da imagem do Pokémon na PokeAPI
            modalBody.innerHTML += `
                <div class="evolution">
                    <span class="evolution-name">${pokemonName}</span>
                    <img src="${imageUrl}" alt="${pokemonName}" class="evolution-image">
                </div>
            `;
        })
        .catch((error) => {
            console.error('Erro ao buscar detalhes do Pokémon:', error);
        });

    if (evolutionChain.evolves_to && evolutionChain.evolves_to.length > 0) {
        evolutionChain.evolves_to.forEach((evolution) => {
            displayEvolutions(evolution);
        });
    }
}

// Função para fechar o modal de detalhes do Pokémon
function closePokemonModal() {
    pokemonModal.style.display = 'none';
}

// Evento de clique no botão de fechar o modal
closeModalButton.addEventListener('click', closePokemonModal);

// Evento de clique fora do modal para fechá-lo
window.addEventListener('click', (event) => {
    if (event.target === pokemonModal) {
        closePokemonModal();
    }
});

// Inicialmente, carregue os Pokémon sem pesquisa
loadPokemonItems(offset, limit);

// Evento de scroll para carregar mais Pokémon quando o usuário rolar até o fim da página
window.addEventListener('scroll', () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY;

    if (scrolled >= scrollable) {
        offset += limit;
        if (offset < maxRecords) {
            loadPokemonItems(offset, limit);
        }
    }
});

// Evento de input no campo de pesquisa para pesquisar Pokémon
searchInput.addEventListener('input', searchPokemon);

// Evento de clique no ícone de pesquisa para exibir o campo de pesquisa
searchIcon.addEventListener('click', () => {
    searchInput.style.display = 'block';
    searchInput.focus();
    searchButton.style.display = 'inline-block';
    searchButton.style.transform = 'translateX(0)';
    searchBar.style.right = '0'; // Posiciona a barra à direita no início
    searchBar.style.width = '240px'; // Largura inicial da barra
    searchBar.style.display = 'block';

    searchButton.classList.toggle('active');
    searchBar.classList.toggle('active');

    const currentWidth = parseInt(getComputedStyle(searchBar).width);

    if (currentWidth === 0) {
        // Se a barra estiver escondida, aumente sua largura e mova para o lado direito do ícone
        searchBar.style.width = '240px'; // Ou qualquer largura desejada
        searchBar.style.left = '45px'; // Ajuste conforme necessário
    } else {
        // Se a barra estiver visível, contraia-a (voltando para dentro do ícone) e mova de volta para dentro do ícone
        searchBar.style.width = '0';
        searchBar.style.left = '45px';
    }
});
