// Elementos do DOM
const form = document.getElementById('enderecoForm');
const ufSelect = document.getElementById('uf');
const cidadeInput = document.getElementById('cidade');
const logradouroInput = document.getElementById('logradouro');
const numeroInput = document.getElementById('numero');
const bairroInput = document.getElementById('bairro');
const complementoInput = document.getElementById('complemento');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const resultArea = document.getElementById('resultArea');
const progressSteps = document.querySelectorAll('.progress-step');

// Estado da aplicação
let currentResults = [];
let selectedResult = null;

// Event Listeners
form.addEventListener('submit', handleSubmit);
clearBtn.addEventListener('click', clearForm);
logradouroInput.addEventListener('input', validateForm);
cidadeInput.addEventListener('input', validateForm);
ufSelect.addEventListener('change', validateForm);

// Função para validar o formulário
function validateForm() {
    const isValid = ufSelect.value && 
                    cidadeInput.value.trim() && 
                    logradouroInput.value.trim();
    
    searchBtn.disabled = !isValid;
    return isValid;
}

// Função principal para buscar CEP
async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        showError('Preencha todos os campos obrigatórios (*)');
        return;
    }

    const endereco = {
        uf: ufSelect.value,
        cidade: cidadeInput.value.trim(),
        logradouro: logradouroInput.value.trim(),
        numero: numeroInput.value.trim(),
        bairro: bairroInput.value.trim(),
        complemento: complementoInput.value.trim()
    };

    await buscarCEP(endereco);
}

// Função para buscar CEP na API
async function buscarCEP(endereco) {
    try {
        showLoading();
        updateProgress(1);
        
        // Construir URL da API
        let url = `https://viacep.com.br/ws/${endereco.uf}/${encodeURIComponent(endereco.cidade)}/${encodeURIComponent(endereco.logradouro)}/json/`;
        
        console.log('Buscando CEP para:', endereco);
        console.log('URL:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Erro na requisição');
        }
        
        const data = await response.json();
        
        // Delay para mostrar o loading
        setTimeout(() => {
            processarResultados(data, endereco);
        }, 800);
        
    } catch (error) {
        console.error('Erro:', error);
        showError('Erro ao buscar CEP. Tente novamente!');
        updateProgress(0);
    }
}

// Função para processar os resultados
function processarResultados(data, enderecoOriginal) {
    if (!data || data.length === 0) {
        showError('Nenhum CEP encontrado para este endereço.');
        updateProgress(0);
        return;
    }

    // Verificar se é um array (múltiplos resultados) ou objeto (um resultado)
    if (Array.isArray(data)) {
        if (data.length === 0) {
            showError('Nenhum CEP encontrado.');
        } else if (data.length === 1) {
            mostrarResultadoUnico(data[0]);
        } else {
            mostrarMultiplosResultados(data);
        }
    } else {
        if (data.erro) {
            showError('CEP não encontrado para este endereço.');
        } else {
            mostrarResultadoUnico(data);
        }
    }
    
    updateProgress(2);
}

// Função para mostrar resultado único
function mostrarResultadoUnico(dados) {
    currentResults = [dados];
    
    // Filtrar dados para exibição
    const enderecoCompleto = {
        cep: dados.cep,
        logradouro: dados.logradouro || 'Não informado',
        bairro: dados.bairro || 'Não informado',
        cidade: dados.localidade || 'Não informado',
        estado: dados.uf || 'Não informado',
        complemento: dados.complemento || 'Não informado',
        ibge: dados.ibge || 'Não informado',
        gia: dados.gia || 'Não informado',
        ddd: dados.ddd || 'Não informado',
        siafi: dados.siafi || 'Não informado'
    };

    const resultHTML = `
        <div class="result-card">
            <div class="result-header">
                <span class="step-number" style="width: 40px; height: 40px; margin: 0;">📍</span>
                <h3>CEP Encontrado</h3>
            </div>
            
            <div class="cep-found">
                <span class="cep-label">CEP</span>
                <span class="cep-value">${formatarCEP(enderecoCompleto.cep)}</span>
            </div>
            
            <div class="result-details">
                <div class="detail-item">
                    <span class="detail-label">Logradouro:</span>
                    <span class="detail-value">${enderecoCompleto.logradouro}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Bairro:</span>
                    <span class="detail-value">${enderecoCompleto.bairro}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Cidade:</span>
                    <span class="detail-value">${enderecoCompleto.cidade}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Estado:</span>
                    <span class="detail-value">${enderecoCompleto.estado}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">Complemento:</span>
                    <span class="detail-value">${enderecoCompleto.complemento}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">DDD:</span>
                    <span class="detail-value">${enderecoCompleto.ddd}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">IBGE:</span>
                    <span class="detail-value">${enderecoCompleto.ibge}</span>
                </div>
            </div>
        </div>
    `;
    
    resultArea.innerHTML = resultHTML;
    searchBtn.disabled = false;
    
    // Rolar suavemente até o resultado
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Função para mostrar múltiplos resultados
function mostrarMultiplosResultados(resultados) {
    currentResults = resultados;
    
    const resultsList = resultados.map((resultado, index) => `
        <div class="result-item" onclick="selecionarResultado(${index})">
            <div class="cep">${formatarCEP(resultado.cep)}</div>
            <div class="address">
                ${resultado.logradouro || 'Logradouro não informado'}, 
                ${resultado.bairro ? resultado.bairro + ', ' : ''}
                ${resultado.localidade} - ${resultado.uf}
            </div>
            ${resultado.complemento ? `<small>Complemento: ${resultado.complemento}</small>` : ''}
        </div>
    `).join('');

    const resultHTML = `
        <div class="multiple-results">
            <h3>
                <span class="step-number" style="width: 30px; height: 30px; margin: 0;">📋</span>
                Foram encontrados ${resultados.length} CEPs
            </h3>
            <div class="results-list">
                ${resultsList}
            </div>
            <p style="text-align: center; margin-top: 15px; color: var(--gray-color); font-size: 13px;">
                Clique em um resultado para ver mais detalhes
            </p>
        </div>
    `;
    
    resultArea.innerHTML = resultHTML;
    searchBtn.disabled = false;
    
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Função para selecionar um resultado da lista
function selecionarResultado(index) {
    const resultado = currentResults[index];
    if (resultado) {
        mostrarResultadoUnico(resultado);
    }
}

// Função para formatar CEP
function formatarCEP(cep) {
    if (!cep) return 'CEP não informado';
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
        return cepLimpo.substring(0, 5) + '-' + cepLimpo.substring(5);
    }
    return cep;
}

// Função para mostrar loading
function showLoading() {
    resultArea.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Buscando CEPs...</p>
            <p style="font-size: 13px; margin-top: 10px;">Consultando ViaCEP</p>
        </div>
    `;
}

// Função para mostrar erro
function showError(message) {
    resultArea.innerHTML = `
        <div class="error-message">
            ❌ ${message}
        </div>
    `;
}

// Função para limpar formulário
function clearForm() {
    form.reset();
    resultArea.innerHTML = '';
    searchBtn.disabled = true;
    updateProgress(0);
    currentResults = [];
    
    // Focar no primeiro campo
    ufSelect.focus();
}

// Função para atualizar barra de progresso
function updateProgress(step) {
    progressSteps.forEach((progressStep, index) => {
        if (index < step) {
            progressStep.classList.add('active');
        } else {
            progressStep.classList.remove('active');
        }
    });
}

// Função para sugerir endereços enquanto digita (opcional - para versão mais avançada)
async function sugerirEnderecos(query) {
    if (query.length < 5) return;
    
    // Esta funcionalidade pode ser implementada com uma API de autocomplete
    // Por enquanto, é apenas um placeholder
    console.log('Buscando sugestões para:', query);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sistema de busca de CEP por endereço iniciado');
    console.log('Exemplo de busca: SP, São Paulo, Avenida Paulista');
    
    // Adicionar exemplos rápidos
    const exemplos = [
        { uf: 'SP', cidade: 'São Paulo', logradouro: 'Avenida Paulista' },
        { uf: 'RJ', cidade: 'Rio de Janeiro', logradouro: 'Rua Visconde de Pirajá' },
        { uf: 'MG', cidade: 'Belo Horizonte', logradouro: 'Avenida Afonso Pena' }
    ];
    
    console.log('Exemplos para teste:', exemplos);
});

// Tornar função disponível globalmente para o onclick
window.selecionarResultado = selecionarResultado;