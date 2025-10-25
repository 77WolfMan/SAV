// =============================================================================
// SISTEMA DE AGENDA ANUAL - SAV
// =============================================================================
// Estrutura principal:
// 1. Constantes Globais
// 2. Constantes Container
// 3. Carregar Dados (Main)
// 4. Gera o Calendário
// 5. Popup Gantt -> Diagrama mensal, (STATS) -> Estatísticas 
// 6. Gera os Gráficos PIE e BARRAS (via CHART.JS)
// 7. Cálculo dos Dias por Tipo de Tarefa, com sobreposições Por Interventor
// ============================================================================

// ============================================================================
// 1. CONSTANTES GLOBAIS
// ============================================================================
const backgroundPopup = "#DDD";
const backgroundTableHeadersStats = "#ccc";
const tableborder = "#666";
const tableLine = "#999";
const feriadoColor = "#fff4cc";
const fdsColor = "#e0e0e0";
const basicColor = "#FF5C5B";
const larguraColInterventor = 190; // largura da coluna interventores das tabelas
let popupGanttAberto = false; // indica se o popup está aberto
const cores = {
  tarefafsdColor: "#FFC71E",  // cor para feriados que colidem com tarefas
  feriadoColor: "#FFF4CC",  // cor para feriados 
  fdsColor: "#DDD",      // cor para sábados e domingos
  basicColor: "#F0F0F0"     // cor padrão dos dias úteis
};
const estilos = {
  tableborder: "#555",                   // cor das bordas principais
  tableLine: "#AAA",                     // cor das linhas internas
  backgroundTableHeadersMes: "#76d6ff",  // cabeçalhos dos dias do mês
  backgroundTableHeadersStats: "#F5F5F5" // cabeçalhos da tabela de stats
};

const coresCategorias = ["#33FF57", "#FF33A8", "#33C3FF", "#FF706B", "#BDBDBD"]; // Cores: Preventivas, Curativas, Contratos, Urgências e Outros (código das cores tem que corresponder ao dados)

// ============================================================================
// 2. CONSTANTES CONTAINER
// ============================================================================
const calendarioContainer = document.getElementById("calendario");
const legendaContainer = document.getElementById("legenda");

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;  // Detecta se é um dispositivo touch (mobile/tablet)

// ============================================================================
// 3. CARREGAR DADOS
// ============================================================================
async function carregarDados() {
    try {
        //showInfos(); // Função para Diagnóstico e Mostrar a Resolução do Ecrã e se Corre em Dispositivo Mobile

        // Atualiza o título
        const tituloH1 = document.getElementById("agendaTitulo");
        if (tituloH1 && dados.ano) {
            tituloH1.textContent = `AGENDA ANUAL - SAV ${dados.ano}`;
        }

        // Carrega os dados, gera o calendário e legenda e assinatura
        gerarCalendario(dados);
        gerarLegenda(dados.tiposTarefa);
        adicionarAssinaturaLegenda(legendaContainer);

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// ============================================================================
// 4. GERAR CALENDÁRIO
// ============================================================================
function gerarCalendario(dados) {
    calendarioContainer.innerHTML = "";
    const ano = dados.ano || new Date().getFullYear();

    const nomesMeses = [
        "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
        "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
    ];

    const corFeriado = feriadoColor;

    const ganttPopup = document.createElement("div");
    ganttPopup.classList.add("popup");
    ganttPopup.style.display = "none";
    ganttPopup.style.position = "fixed";
    ganttPopup.style.top = "50%";
    ganttPopup.style.left = "50%";
    ganttPopup.style.transform = "translate(-50%, -50%)";
    ganttPopup.style.background = "#fff";
    ganttPopup.style.padding = "10px";
    ganttPopup.style.border = "2px solid #000";
    ganttPopup.style.overflow = "auto";
    ganttPopup.style.zIndex = "1000";
    document.body.appendChild(ganttPopup);

    for (let mes = 0; mes < 12; mes++) {
        const primeiroDia = new Date(ano, mes, 1);
        const ultimoDia = new Date(ano, mes + 1, 0);
        let primeiroDiaSemana = primeiroDia.getDay();
        if (primeiroDiaSemana === 0) primeiroDiaSemana = 7;

        const divMes = document.createElement("div");
        divMes.classList.add("mes");
        divMes.innerHTML = `<h3>${nomesMeses[mes]}</h3>`;

        const diasGrid = document.createElement("div");
        diasGrid.classList.add("dias");
        let totalCelulas = 0;

        for (let i = 1; i < primeiroDiaSemana; i++) {
            const vazio = document.createElement("div");
            vazio.classList.add("dia", "vazio");
            diasGrid.appendChild(vazio);
            totalCelulas++;
        }

        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            const dataAtual = new Date(ano, mes, dia);
            let diaSemana = dataAtual.getDay();
            if (diaSemana === 0) diaSemana = 7;

            const divDia = document.createElement("div");
            divDia.classList.add("dia");
            if (diaSemana === 6 || diaSemana === 7) divDia.classList.add("fim-semana");

            const feriado = dados.feriados.find(f =>
                dataAtual.getDate() === parseInt(f.dia, 10) &&
                dataAtual.getMonth() + 1 === parseInt(f.mes, 10) &&
                dataAtual.getFullYear() === ano
            );
            if (feriado) {
                divDia.title = feriado.nome;
                divDia.classList.add("feriado");
            }

            const numeroDia = document.createElement("div");
            numeroDia.textContent = dia;
            numeroDia.classList.add("numero-background");
            divDia.appendChild(numeroDia);

            const bolasContainer = document.createElement("div");
            bolasContainer.classList.add("bolas-container");
            bolasContainer.style.display = "flex";
            bolasContainer.style.justifyContent = "flex-start";
            bolasContainer.style.gap = "2px";
            bolasContainer.style.left = "2px";
            divDia.appendChild(bolasContainer);

            function parseDateLocal(str) {
                const [year, month, day] = str.split("-").map(Number);
                return new Date(year, month - 1, day);
            }

			// cálculo do critério de validação de tarefa do dia no mês
            const tarefasDoDia = dados.tarefas.filter(t => {
    			const inicio = parseDateLocal(t.data_inicio);
    			const fim = new Date(inicio.getTime() + t.duracao * 24 * 60 * 60 * 1000); // duração em milissegundos
    			const diaStart = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate());
    			const diaEnd = new Date(diaStart.getTime() + 24 * 60 * 60 * 1000); // fim do dia
    			return (fim > diaStart) && (inicio < diaEnd);
			});

            tarefasDoDia.forEach(tarefa => {
                const tecnico = dados.tecnicos.find(te => te.nome === tarefa.tecnico);
                if (!tecnico) return;
                const tipoInfo = dados.tiposTarefa.find(tp => tp.tipo === tarefa.tipo);
                if (!tipoInfo) return;

                const bola = criaBolaTarefa(tarefa, tecnico, tipoInfo);
                bolasContainer.appendChild(bola);
            });

            if (feriado && tarefasDoDia.length === 0) divDia.style.backgroundColor = corFeriado;

            diasGrid.appendChild(divDia);
            totalCelulas++;
        }

        while (totalCelulas < 42) {
            const vazio = document.createElement("div");
            vazio.classList.add("dia", "vazio");
            diasGrid.appendChild(vazio);
            totalCelulas++;
        }

        divMes.appendChild(diasGrid);

        // ============================================================================
        //  5. POPUP GANTT E CONTROLES
        // ============================================================================
        const { ganttBtn, ganttPopup2, ganttContent, botaoStats } = criaBotaoGantt(divMes, "#333", "#a9a9a9");

        let chartInstance = null;
        let popupExpanded = false;

        botaoStats.addEventListener("click", function (e) {
            e.stopPropagation();
            popupExpanded = !popupExpanded;

            if (popupExpanded) {
                popupGanttAberto = true;

                const primeiroDiaMes = new Date(ano, mes, 1);
                const ultimoDiaMes = new Date(ano, mes + 1, 0);

                // cálculo do critério de validação de de dia de tarefa no mapa mês
                const tarefasDoMes = dados.tarefas.filter(t => {
    				const inicio = parseDateLocal(t.data_inicio);
    				const fim = new Date(inicio.getTime() + t.duracao * 24 * 60 * 60 * 1000); // duração em ms
    				const mesStart = new Date(ano, mes, 1); // início do mês
    				const mesEnd = new Date(ano, mes, ultimoDia.getDate() + 1); // fim do mês (não incluso)
    				return (fim > mesStart) && (inicio < mesEnd);
				});

                ajustarAlturaNecessáriaPopupGantt(ganttPopup2, 650, dados.tecnicos.length);

                const oldStats = ganttContent.querySelector("#gantt-estatisticas-title");
                if (oldStats) oldStats.remove();

                const oldGraphContainer = ganttContent.querySelector("#grafico-pie-container");
                if (oldGraphContainer) oldGraphContainer.remove();

                if (chartInstance) {
                    try { chartInstance.destroy(); } catch (e) {}
                    chartInstance = null;
                }

                const { tituloStats, tabela, tbody } = criarTabelaEstatisticas(
                    ganttPopup2, ganttContent, chartInstance, "#333",
                    tableborder, backgroundTableHeadersStats, ano, mes, dados
                );

                dados.tecnicos.forEach((tecnico, idx) => {  // <-- idx é o índice da linha
    				// ---- FILTRA TAREFAS DO TÉCNICO E DO MÊS ----
				    const tarefasTecnicoMes = tarefasDoMes.filter(t => t.tecnico === tecnico.nome);

 				   // ---- INICIALIZAÇÃO DOS CONTADORES ----
 				   const stats = calcularEstatisticasTecnicoNoMes({
 				       	tecnicoNome: tecnico.nome,
 				       	tarefas: tarefasTecnicoMes,
 				       	feriados: dados.feriados,
  				      	mesIndex: mes,
  				      	ano: ano,
  				      	parseDateLocal
 				   });

  				  const diasNaoTrabalhados = stats.diasDisponiveis - (stats.diasTrabalhadosSemana + stats.diasTrabalhadosFimdeSemana);
  				  const taxaOcupacao = stats.diasDisponiveis > 0
  				      ? (((stats.diasTrabalhadosSemana + stats.diasTrabalhadosFimdeSemana) / stats.diasDisponiveis) * 100).toFixed(1)
  				      : 0;
  				  const taxaFaltas = stats.diasDisponiveis > 0
  				      ? ((stats.diasFaltas / stats.diasDisponiveis) * 100).toFixed(1)
  				      : 0;

  				  // ---- CALCULA SOBREPOSIÇÕES ----
  				  const totalSobreposicoes = new Set();
  				  const diasContabilizados = new Set();
   				 tarefasTecnicoMes.forEach(t => {
   				     const inicio = parseDateLocal(t.data_inicio);
   				     for (let i = 0; i < t.duracao; i++) {
   				         const dia = new Date(inicio);
   				         dia.setDate(dia.getDate() + i);
   				         const key = `${tecnico.nome}|${dia.toISOString().slice(0,10)}`;
    				        if (diasContabilizados.has(key)) totalSobreposicoes.add(key);
    				        diasContabilizados.add(key);
    				    }
    				});

  				  	// ---- CRIA LINHA DA TABELA ----
  				  	const tr = criarLinhaTabelaEstatisticas(tecnico, stats.diasDisponiveis, stats.diasTrabalhadosSemana, stats.diasTrabalhadosFeriados, stats.diasTrabalhadosFimdeSemana,
        				stats.diasFerias, stats.diasFaltas, diasNaoTrabalhados, taxaOcupacao, taxaFaltas, tarefasTecnicoMes, stats.totalSobreposicoes, tableborder, idx);

    				tbody.appendChild(tr);
				});

                tabela.appendChild(tbody);
                tituloStats.appendChild(tabela);

                const NotaTxt = document.createElement("div");
                NotaTxt.textContent = "* Excluindo Férias e Feriados";
                NotaTxt.style.textAlign = "right";
                NotaTxt.style.fontSize = "10px";
                NotaTxt.style.marginTop = "4px";
                tituloStats.appendChild(NotaTxt);

                ganttContent.appendChild(tituloStats);

				// ---------------- GRÁFICO PIE AJUSTADO (0.5 dias por tranche, 1 por tipo/dia, ignora férias/ausências) ----------------
		
				// Inicializa categorias
				const categorias = { Preventivas: 0, Curativas: 0, Contratos: 0, Urgentes: 0, Outros: 0 };

				// Mapa dia -> categorias -> soma de fração do dia
				const mapaDiasPorTipo = {}; // dia "YYYY-MM-DD" -> categorias -> soma de frações
				const mapaTecnicosPorDia = {}; // dia "YYYY-MM-DD" -> Set de técnicos

				const feriados = dados?.feriados?.map(f => `${f.ano || ano}-${String(f.mes).padStart(2,'0')}-${String(f.dia).padStart(2,'0')}`) || [];

				tarefasDoMes.forEach(tarefa => {
				    const tipo = tarefa.tipo.toLowerCase();

				    // Ignora férias e ausências
				    if (tipo === "férias" || tipo === "ausência") return;

				    const inicio = parseDateLocal(tarefa.data_inicio);
				    const duracao = tarefa.duracao;
				    const fracaoDia = 0.5; // metade de dia por tranche

				    // número de tranches
				    const nTranches = Math.ceil(duracao / fracaoDia);

				    for (let t = 0; t < nTranches; t++) {
				        const diaAtual = new Date(inicio);
				        diaAtual.setDate(diaAtual.getDate() + Math.floor(t * fracaoDia));

				        // filtra apenas dias do mês atual
 				       if (diaAtual.getMonth() !== mes) continue;

 				       const diaKey = diaAtual.toISOString().slice(0,10);

 				       if (!mapaDiasPorTipo[diaKey])
 				           mapaDiasPorTipo[diaKey] = { Preventivas: 0, Curativas: 0, Contratos: 0, Urgentes: 0, Outros: 0 };

 				       // Determina categoria
 				       const categoria = tipo.includes("preventiva") ? "Preventivas"
 				                       : tipo.includes("curativa") ? "Curativas"
 				                       : tipo.includes("urgência") || tipo.includes("urgente") ? "Urgentes"
                				        : tipo.includes("contrato") ? "Contratos"
  				                      : "Outros";

 				       // Só adiciona até 1 por categoria/dia
 				       const restante = 1 - mapaDiasPorTipo[diaKey][categoria]; // quanto ainda falta para completar 1
				        if (restante > 0) {
 				           // fração da tranche (não ultrapassa 1 no dia)
 				           const fracao = Math.min(fracaoDia, restante);
 				           mapaDiasPorTipo[diaKey][categoria] += fracao;
				        }

 				       // contabiliza técnicos
 				       if (!mapaTecnicosPorDia[diaKey]) mapaTecnicosPorDia[diaKey] = new Set();
 				       mapaTecnicosPorDia[diaKey].add(tarefa.tecnico);
				    }
				});

				// Soma final por categoria
				Object.values(mapaDiasPorTipo).forEach(dia => {
				    Object.keys(dia).forEach(cat => {
				        categorias[cat] += dia[cat];
				    });
				});

				const diasPorTipo = { ...categorias };
				console.log("Categorias finais PIE:", diasPorTipo);

				// ------------------ CRIAÇÃO DOS GRÁFICOS ------------------
				const { canvasIdPie, canvasIdBar1, canvasIdBar2 } = criaTabelaGraficos(ganttContent, mes);
				// PIE → mantém frações reais
				chartInstancePie = criarGraficoPie(diasPorTipo, coresCategorias, canvasIdPie);

				// ------------------ GRÁFICO DE BARRAS ------------------

				// Contadores
				let diasNenhumTecnico = 0;
				let diasApenas1Tecnico = 0;
				let diasApenas2Tecnicos = 0;
				let diasMais2Tecnicos = 0;
				let diasFeriadoComTec = 0;
				let diasSabadoComTec = 0;
				let diasDomingoComTec = 0;

				// Datas limites
				const primeiroDiaMes_graf = new Date(ano, mes, 1);
				const ultimoDiaMes_graf = new Date(ano, mes + 1, 0);

				// Itera todos os dias do mês (inclusive feriados/fins-de-semana)
				for (let d = new Date(primeiroDiaMes_graf.getTime()); d <= ultimoDiaMes_graf; d.setDate(d.getDate() + 1)) {
				    const diaKey = d.toISOString().slice(0, 10);
				    const setTec = mapaTecnicosPorDia[diaKey];
				    const n = setTec ? setTec.size : 0;

				    const diaSemana = d.getDay(); // 0=Domingo, 6=Sábado
 				   const isFeriado = feriados.includes(diaKey);
 				   const isSabado = diaSemana === 6;
 				   const isDomingo = diaSemana === 0;

 				   // Conta apenas dias úteis (não feriado / fim de semana)
 				   if (!isFeriado && !isSabado && !isDomingo) {
				        if (n === 0) diasNenhumTecnico++;
 				       else if (n === 1) diasApenas1Tecnico++;
				        else if (n === 2) diasApenas2Tecnicos++;
 				       else diasMais2Tecnicos++;
 				   }

 				   // Contabiliza feriados e fins-de-semana SE houver técnicos alocados
				    if (isFeriado && n > 0) diasFeriadoComTec++;
 				   if (isSabado && n > 0) diasSabadoComTec++;
 				   if (isDomingo && n > 0) diasDomingoComTec++;
				}

				// Criação do gráfico barras1
				chartInstanceBar = criarGraficoBar(
				    diasNenhumTecnico, diasApenas1Tecnico, diasApenas2Tecnicos, diasMais2Tecnicos,
				    diasFeriadoComTec, diasSabadoComTec, diasDomingoComTec, canvasIdBar1
				);
				
				// Criação do gráfico barras2
				chartInstanceBar = criarGraficoBar(
				    diasNenhumTecnico, diasApenas1Tecnico, diasApenas2Tecnicos, diasMais2Tecnicos,
				    diasFeriadoComTec, diasSabadoComTec, diasDomingoComTec, canvasIdBar2
				);

            } else {
                ajustarAlturaNecessáriaPopupGantt(ganttPopup2, 100, dados.tecnicos.length);
                popupExpanded = false;
                const statsContainer = ganttContent.querySelector("#gantt-estatisticas-title");
                if (statsContainer) statsContainer.remove();
                const tabelaGrafico = ganttContent.querySelector("table.tabelaGrafico");
                if (tabelaGrafico) tabelaGrafico.remove();
                if (chartInstance) {
                    try { chartInstance.destroy(); } catch (e) {}
                    chartInstance = null;
                }
            }
        });

        document.addEventListener("click", (ev) => {
            if (!ganttPopup2.contains(ev.target) && ev.target !== ganttBtn) {
                ajustarAlturaNecessáriaPopupGantt(ganttPopup2, 100, dados.tecnicos.length);
                limparPopupGantt();
                ganttPopup2.style.display = "none";
                popupGanttAberto = false;
            }
        });

        function limparPopupGantt() {
            ganttContent.innerHTML = '';
            const statsContainer = ganttContent.querySelector("#gantt-estatisticas-title");
            if (statsContainer) statsContainer.remove();
            if (chartInstance) {
                try { chartInstance.destroy(); } catch(e) {}
                chartInstance = null;
            }
            popupExpanded = false;
        }

        ganttBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (popupGanttAberto) {
                resetPopupGantt();
                return;
            }
            montarTabelaMesGantt({mes, ano, dados, nomesMeses, container: ganttContent, cores, estilos});
            ganttPopup2.style.display = "block";
            popupGanttAberto = true;
        });

        tornarDraggable(ganttPopup2);
        calendarioContainer.appendChild(divMes);
    } // fim loop meses
}

// Ajusta o tamanhos...
ajustarTamanhoDiasEBolas();
ajustarColunasCalendario();

// Carrega tudo
carregarDados();

// Executa após o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
  mostrarResolucao;
  ajustarColunasCalendario();
  window.addEventListener('resize', ajustarColunasCalendario);
});


function resetPopupGantt() {
    if (!ganttPopup2 || !ganttContent) return;

    // Limpa visualmente
    limparPopupGanttConteudo(ganttContent);

    // Fecha popup
    ganttPopup2.style.display = "none";
    popupGanttAberto = false;

    // Ajuste de tamanho/reseta gráficos (se aplicável)
    try { if (window.chartInstancePie) { window.chartInstancePie.destroy(); window.chartInstancePie = null; } } catch(e){}
    try { if (window.chartInstanceBar) { window.chartInstanceBar.destroy(); window.chartInstanceBar = null; } } catch(e){}
}

// ====== LIMPAR CONTEÚDO DO POPUP GANTT (remover barras, tabela e gráficos) ======
function limparPopupGanttConteudo(container) {
    if (!container) return;

    // 1) Remove todas as barras-tarefa que eventualmente estejam espalhadas
    container.querySelectorAll('.barra-tarefa').forEach(el => el.remove());

    // 2) Remove tabelas Gantt antigas — identifica pela célula título "MAPA DE INTERVENÇÕES"
    container.querySelectorAll('table').forEach(tbl => {
        const firstTd = tbl.querySelector('td');
        if (firstTd && firstTd.textContent && firstTd.textContent.toUpperCase().includes('MAPA DE INTERVENÇÕES')) {
            tbl.remove();
        }
    });

    // 3) Remove containers de estatísticas / gráficos se existirem
    const selectorsToRemove = ['#gantt-estatisticas-title', '#grafico-pie-container', 'table.tabelaGrafico'];
    selectorsToRemove.forEach(sel => {
        const el = container.querySelector(sel);
        if (el) el.remove();
    });

    // 4) Tenta destruir gráficos globais (se existirem como variáveis no window)
    try { if (window.chartInstancePie) { window.chartInstancePie.destroy(); window.chartInstancePie = null; } } catch(e) {}
    try { if (window.chartInstanceBar) { window.chartInstanceBar.destroy(); window.chartInstanceBar = null; } } catch(e) {}
}

