// =============================================================================
// SISTEMA DE AGENDA ANUAL - SAV
// =============================================================================
// Estrutura principal:
// 1. Contêineres principais
// 2. Função carregarDados -> carrega dados.json
// 3. Função cria canvas, para sobrepor
// 4. Função para desenhar molduras
// 5. Função Text Livre (em qualquer canvas)
// 6. Função gerarLegenda -> cria legenda dos tipos de tarefas
// 7. Função gerarCalendario -> monta calendário + popup Gantt
// 8. Popup Gantt -> Diagrama mensal, (STATS) -> Estatísticas e Gráfico PIE
// ============================================================================

// ============================================================================
// 0. CONSTANTES GLOBAIS
// ============================================================================
const backgroundPopup = "#ddd";
const backgroundBotaoStats = "#a9a9a9";
const backgroundTableHeadersStats = "#ccc";
const tableborder = "#666";
const tableLine = "#999";
const titleColor = "#333";
const feriadoColor = "#fff4cc";
const fdsColor = "#e0e0e0";
const basicColor = "#f7f7f7";
const backgroundTableHeadersMes = "#76d6ff";
let ganttPopup2 = null;      // referência ao popup atual
let popupGanttAberto = false; // indica se o popup está aberto

// ============================================================================
// 1. CONSTANTES PRINCIPAIS
// ============================================================================
const calendarioContainer = document.getElementById("calendario");
const legendaContainer = document.getElementById("legenda");

// ============================================================================
// 2. FUNÇÃO QUE PERMITE ARRASTAR JANELAS/POPUPS
// ============================================================================
function tornarDraggable(element) {
    let isDragging = false;
    let offsetX, offsetY;

    element.addEventListener("mousedown", (e) => {
        if (e.target.tagName === "CANVAS" || e.target.closest("canvas")) return; // evita conflito com gráficos
        isDragging = true;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        element.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        element.style.left = `${e.clientX - offsetX}px`;
        element.style.top = `${e.clientY - offsetY}px`;
        element.style.transform = ""; // remove centralização fixa
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        element.style.cursor = "grab";
    });
}

// ============================================================================
// 3. FUNÇÃO PRINCIPAL: CARREGAR DADOS
// ============================================================================
async function carregarDados() {
    try {
        // Detectar telemóvel via userAgent
  		const ua = navigator.userAgent.toLowerCase();
  		
  		const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua);
  	    // Mostra a resolução
        const largura = window.innerWidth;
        const altura = window.innerHeight;
        const ratio = window.devicePixelRatio || 1;
        const resolucaoFisica = `${Math.round(largura * ratio)} x ${Math.round(altura * ratio)}`;
        const resolucaoCSS = `${largura} x ${altura}`;

        const mensagem = document.createElement('div');
        mensagem.id = 'mensagemResolucao';
        mensagem.style.textAlign = 'center';
        mensagem.style.margin = '20px';
        mensagem.style.fontSize = '18px';
        mensagem.style.fontWeight = 'bold';
        mensagem.textContent = `Resolução do ecrã: ${resolucaoCSS} (CSS pixels), ${resolucaoFisica} (físico) - Mobile: ${isMobile}`;

        const calendario = document.getElementById('calendario');
        if (calendario) {
            calendario.parentNode.insertBefore(mensagem, calendario);
        } else {
            document.body.insertBefore(mensagem, document.body.firstChild);
        }

        // Pausa de 1 segundo
        await new Promise(resolve => setTimeout(resolve, 1)); // 1000 -> 1 segundo

        // Atualiza o título
        const tituloH1 = document.getElementById("agendaTitulo");
        if (tituloH1 && dados.ano) {
            tituloH1.textContent = `AGENDA ANUAL - SAV ${dados.ano}`;
        }

        // Gera o calendário e legenda
        gerarCalendario(dados);
        gerarLegenda(dados.tiposTarefa);

        // Remove a mensagem da resolução (opcional)
        mensagem.remove();

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// ============================================================================
// 4. FUNÇÃO: GERAR LEGENDA
// ============================================================================
function gerarLegenda(tiposTarefa) {
    legendaContainer.innerHTML = "";
    tiposTarefa.forEach(t => {
        const div = document.createElement("div");
        div.classList.add("legenda-item");
        div.innerHTML = `<span class="legenda-bola" style="background:${t.cor}"></span>${t.tipo}`;
        legendaContainer.appendChild(div);
    });
}

// ============================================================================
// 5. FUNÇÃO: GERAR CALENDÁRIO
// ============================================================================
function gerarCalendario(dados) {
    calendarioContainer.innerHTML = "";
    const ano = dados.ano || new Date().getFullYear();

    const nomesMeses = [
        "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
        "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
    ];

    const corFeriado = feriadoColor;

    // (opcional) popup global que não é utilizado diretamente mas mantido para compatibilidade
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
    ganttPopup.style.maxWidth = "90%";
    ganttPopup.style.maxHeight = "80%";
    ganttPopup.style.overflow = "auto";
    ganttPopup.style.zIndex = "1000";
    document.body.appendChild(ganttPopup);

    // Loop por cada mês
    for (let mes = 0; mes < 12; mes++) {
        const primeiroDia = new Date(ano, mes, 1);
        const ultimoDia = new Date(ano, mes + 1, 0);
        let primeiroDiaSemana = primeiroDia.getDay();
        if (primeiroDiaSemana === 0) primeiroDiaSemana = 7;

        // Container do mês
        const divMes = document.createElement("div");
        divMes.classList.add("mes");
        divMes.innerHTML = `<h3>${nomesMeses[mes]}</h3>`;

        const diasGrid = document.createElement("div");
        diasGrid.classList.add("dias");
        let totalCelulas = 0;

        // Preencher dias vazios antes do primeiro dia
        for (let i = 1; i < primeiroDiaSemana; i++) {
            const vazio = document.createElement("div");
            vazio.classList.add("dia", "vazio");
            diasGrid.appendChild(vazio);
            totalCelulas++;
        }

        // Loop pelos dias do mês
        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            const dataAtual = new Date(ano, mes, dia);
            let diaSemana = dataAtual.getDay();
            if (diaSemana === 0) diaSemana = 7;

            const divDia = document.createElement("div");
            divDia.classList.add("dia");
            if (diaSemana === 6 || diaSemana === 7) divDia.classList.add("fim-semana");

            // Verifica feriado
            const feriado = dados.feriados.find(f =>
                dataAtual.getDate() === parseInt(f.dia, 10) &&
                dataAtual.getMonth() + 1 === parseInt(f.mes, 10) &&
                dataAtual.getFullYear() === ano
            );
            if (feriado) {
                divDia.title = feriado.nome;
                divDia.classList.add("feriado");
            }

            // Número do dia
            const numeroDia = document.createElement("div");
            numeroDia.textContent = dia;
            numeroDia.classList.add("numero-background");
            divDia.appendChild(numeroDia);

            // Container para as bolas das tarefas
            const bolasContainer = document.createElement("div");
            bolasContainer.classList.add("bolas-container");
            bolasContainer.style.display = "flex";
            bolasContainer.style.justifyContent = "flex-start";
            bolasContainer.style.gap = "2px";
            bolasContainer.style.left = "2px";
            divDia.appendChild(bolasContainer);

            // Seleciona tarefas do dia
            const tarefasDoDia = dados.tarefas.filter(t => {
                const inicio = new Date(t.data_inicio);
                const fim = new Date(inicio);
                fim.setDate(fim.getDate() + t.duracao - 1);
                return dataAtual >= inicio && dataAtual <= fim;
            });

            tarefasDoDia.forEach(tarefa => {
                const tecnico = dados.tecnicos.find(te => te.nome === tarefa.tecnico);
                if (!tecnico) return;
                const tipoInfo = dados.tiposTarefa.find(tp => tp.tipo === tarefa.tipo);
                if (!tipoInfo) return;

                // Criação da bola da tarefa
                const bola = document.createElement("span");
                bola.classList.add("bola-tarefa");
                bola.style.backgroundColor = tipoInfo.cor;
                bola.style.display = "flex";
                bola.style.alignItems = "center";
                bola.style.justifyContent = "center";
                bola.style.color = "#000";
                bola.style.textShadow = `
                    -0.5px -0.5px 0 #EBEBEB,
                     0.5px -0.5px 0 #EBEBEB,
                    -0.5px  0.5px 0 #EBEBEB,
                     0.5px  0.5px 0 #EBEBEB
                `;
                bola.style.fontSize = "14px";
                bola.style.fontWeight = "bold";
                bola.style.fontFamily = "'Arial Narrow', Arial, sans-serif";
                bola.textContent = tecnico.iniciais;

                // Popup da tarefa (hover)
                const popup = document.createElement("div");
                popup.classList.add("popup");
                popup.style.border = `2px solid ${tipoInfo.cor}`;
                popup.style.display = "none";
                popup.innerHTML = `
                    <div style="display:flex; justify-content:space-between; width:100%;">
                        <div style="display:flex; flex-direction:column; text-align:left;">
                            <strong>${tarefa.tipo}</strong>
                            <strong>${tecnico.nome}</strong>
                        </div>
                        <div style="display:flex; flex-direction:column; text-align:center; gap:4px;">
                            <span>${tarefa.data_inicio}</span>
                            <span>${tarefa.duracao} dia(s)</span>
                        </div>
                    </div>
                    <br>
                    <div><strong>${tarefa.cliente}:</strong></div>
                    <div style="text-align:justify;">${tarefa.descricao}</div>
                `;
                document.body.appendChild(popup);

                // Eventos hover e click
                bola.addEventListener("mouseenter", (e) => {
                    popup.style.display = "block";
                    popup.style.position = "absolute";
                    popup.style.left = `${e.pageX}px`;
                    popup.style.top = `${e.pageY}px`;
                });
                bola.addEventListener("mouseleave", () => popup.style.display = "none");
                bola.addEventListener("click", (e) => {
                    popup.style.display = (popup.style.display === "block") ? "none" : "block";
                    popup.style.left = `${e.pageX}px`;
                    popup.style.top = `${e.pageY}px`;
                });

                bolasContainer.appendChild(bola);
            });

            if (feriado && tarefasDoDia.length === 0) divDia.style.backgroundColor = corFeriado;

            diasGrid.appendChild(divDia);
            totalCelulas++;
        }

        // Preenche dias vazios finais para completar grid
        while (totalCelulas < 42) {
            const vazio = document.createElement("div");
            vazio.classList.add("dia", "vazio");
            diasGrid.appendChild(vazio);
            totalCelulas++;
        }

        divMes.appendChild(diasGrid);

        // ============================================================================
        //  6. POPUP GANTT E CONTROLES
        // ============================================================================

        // --- Botão GANTT (ícone) ---
        const ganttBtnContainer = document.createElement("div");
        ganttBtnContainer.style.display = "flex";
        ganttBtnContainer.style.justifyContent = "flex-end";
        ganttBtnContainer.style.marginTop = "100px";
        divMes.appendChild(ganttBtnContainer);

        const ganttBtn = document.createElement("button");
        ganttBtn.style.padding = "4px 8px";
        ganttBtn.style.cursor = "pointer";
        ganttBtn.style.fontWeight = "bold";
        ganttBtn.style.background = "transparent";
        ganttBtn.style.border = "none";
        ganttBtn.innerHTML = `
          <svg width="32" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 2 L2 12 L18 22" stroke="grey" stroke-width="2" fill="none"/>
            <ellipse cx="13" cy="12" rx="3" ry="6" fill="none" stroke="grey" stroke-width="2"/>
            <ellipse cx="15" cy="12" rx="1" ry="3" fill="none" stroke="grey" stroke-width="2"/>
            <line x1="22" y1="8" x2="37" y2="0" stroke="grey" stroke-width="1"/>
            <line x1="22" y1="12" x2="37" y2="12" stroke="grey" stroke-width="1"/>
            <line x1="22" y1="16" x2="37" y2="22" stroke="grey" stroke-width="1"/>
          </svg>`;
        ganttBtnContainer.appendChild(ganttBtn);

        // --- Popup do Gantt (por mês) ---
        const ganttPopup2 = document.createElement("div");
        ganttPopup2.classList.add("popupGantt");
        ganttPopup2.style.display = "none";
        ganttPopup2.style.position = "fixed";
        ganttPopup2.style.top = "50%";
        ganttPopup2.style.left = "50%";
        ganttPopup2.style.transform = "translate(-50%, -50%)";
        ganttPopup2.style.background = "#fff";
        ganttPopup2.style.padding = "12px";
        ganttPopup2.style.border = "2px solid #ccc";
        ganttPopup2.style.borderRadius = "10px";
        ganttPopup2.style.overflow = "auto";
        ganttPopup2.style.zIndex = "2000";
        ganttPopup2.style.boxShadow = `
          8px 8px 20px rgba(0, 0, 0, 0.5),
          -6px -6px 15px rgba(255, 255, 255, 0.7)
        `;
        document.body.appendChild(ganttPopup2);
        ganttPopup2.style.height = "300px";
		ganttPopup2.dataset.originalHeight = ganttPopup2.style.height;
		ganttPopup2.dataset.originalMaxHeight = ganttPopup2.style.maxHeight;

        // Container interno do popup
        const ganttContent = document.createElement('div');
        ganttContent.style.boxSizing = 'border-box';
        ganttContent.style.paddingBottom = '10px';
        ganttPopup2.appendChild(ganttContent);

        // === Botão STATS dentro do popup (expande e insere estatísticas) ===
        let popupExpanded = false;
        const botaoStats = document.createElement("button");
        botaoStats.textContent = "STATS";
        botaoStats.style.position = "absolute";
        botaoStats.style.bottom = "12px";
        botaoStats.style.right = "12px";
        botaoStats.style.padding = "2px 4px";
        botaoStats.style.backgroundColor = titleColor;
        botaoStats.style.color = backgroundBotaoStats;
        botaoStats.style.border = '1px solid ${backgroundBotaoStats}';
        botaoStats.style.borderRadius = "3px";
        botaoStats.style.cursor = "pointer";
        botaoStats.style.fontWeight = "bold";
        botaoStats.style.zIndex = "2100";
        ganttPopup2.appendChild(botaoStats);
        
		// Define altura original do popup
		ganttPopup2.style.height = "300px";

        // Guardar instância do gráfico para destruir se o utilizador abrir/fechar repetidamente
        let chartInstance = null;

        // Handler do STATS (apenas altera a apresentação do popup)
        botaoStats.addEventListener("click", function (e) {
            e.stopPropagation();
            popupExpanded = !popupExpanded;

    		// ---------------- EXPANDE POPUP ----------------
    		if (popupExpanded) {
        		// Expande popup para mostrar stats
        		ganttPopup2.style.height = "770px";
        		ganttPopup2.style.top = "50%";
        		ganttPopup2.style.left = "50%";
        		ganttPopup2.style.transform = "translate(-50%, -50%)";
        		
        		const linhasPadding = "2px";	// Padding ara as linhas da tabela estatísticas

        		// ---------- LIMPEZA COMPLETA DE ELEMENTOS ANTIGOS ----------
        		const oldStats = ganttContent.querySelector("#gantt-estatisticas-title");
        		if (oldStats) oldStats.remove();

        		const oldGraphContainer = ganttContent.querySelector("#grafico-pie-container");
        		if (oldGraphContainer) oldGraphContainer.remove();

        		if (chartInstance) {
            		try { chartInstance.destroy(); } catch (e) {}
            		chartInstance = null;
        		}

                // ================= CRIAÇÃO DE UMA TABELA PARA MOSTRAR E FIXAR A LEGENDAGEM DO MAPA MENSAL, A MENÇÃO DE ESTATISTICAS E A LINHA SEPARADORA =================
                const tituloStats = document.createElement("div");
                tituloStats.id = "gantt-estatisticas-title";
                tituloStats.style.color = titleColor;
                tituloStats.style.marginTop = "10px";
                tituloStats.style.fontWeight = "bold";
                tituloStats.style.textAlign = "left";
                tituloStats.style.width = "900px"; // largura fixa
                tituloStats.style.tableLayout = "fixed"; // respeitar larguras e alturas fixas

                // ====== TABELA DE UMA COLUNA ======
                const tabelaTitulo = document.createElement("table");
                tabelaTitulo.style.width = "100%";
                tabelaTitulo.style.borderCollapse = "collapse";
                tabelaTitulo.style.marginTop = "30px";

                // ====== LINHA ÚNICA ======
                const tr = document.createElement("tr");
                const td = document.createElement("td");
                td.style.textAlign = "left";
                td.style.verticalAlign = "middle";
                td.style.padding = "4px 0px 4px 0px";
                td.style.width = "100%";
                td.style.borderBottom = "1px solid #000"; // LINHA INFERIOR VISIVEL...

                // ----- TEXTO -----
                const texto = document.createElement("div");
                texto.textContent = "ESTATÍSTICAS:";
                texto.style.fontWeight = "bold";
                texto.style.fontSize = "14px";
                texto.style.color = titleColor;
                texto.style.margin = "0"; // sem margens extras

                // Montagem final
                td.appendChild(texto);
                tr.appendChild(td);
                tabelaTitulo.appendChild(tr);
                tituloStats.appendChild(tabelaTitulo);

                // ======= CRIAÇÃO DA TABELA ESTATISTICAS =======
			    const tabela = document.createElement("table");
			    tabela.style.width = "100%";
			    
			    tabela.style.borderCollapse = "collapse";
 			   	tabela.style.marginTop = "10px";
 			   	tabela.style.tableLayout = "fixed"; // importante para respeitar larguras fixas
 			   	
 			   	// ======= DEFINIR COLUNAS FIXAS =======
				const colgroup = document.createElement("colgroup");
				const colWidths = [
				    "150px", // INTERVENTOR
				    "50px",  // Total úteis
				    "140px", // Trabalhados
				    "55px",  // Férias
				    "80px",  // Faltas
				    "120px", // Disponíveis
				    "100px", // Taxa Ocupacional
				    "100px", // Intervenções
				    "100px"  // Sobreposições
				];
				colWidths.forEach(w => {
				    const col = document.createElement("col");
				    col.style.width = w;
				    colgroup.appendChild(col);
				});
				tabela.appendChild(colgroup);

    			// ---------- CABEÇALHO ----------
    			const thead = document.createElement("thead");
    			const trHead1 = document.createElement("tr");

    			// Técnicos
    			const thTecnicos = document.createElement("th");
    			thTecnicos.textContent = "INTERVENTOR";
    			thTecnicos.style.border = `1px solid ${tableborder}`;
    			thTecnicos.style.backgroundColor = backgroundTableHeadersStats;
    			thTecnicos.style.padding = linhasPadding;
    			thTecnicos.style.fontSize = "13px";
    			thTecnicos.style.textAlign = "right";
    			thTecnicos.style.padding = "16px 10px 0px 10px";
    			thTecnicos.style.width = "150px";
    			thTecnicos.style.whiteSpace = "nowrap";
    			thTecnicos.rowSpan = 2;
    			trHead1.appendChild(thTecnicos);

    			// Total de dias úteis
    			const diasUteisNoMes = (() => {
     			 	const ultimoDia = new Date(ano, mes + 1, 0).getDate();
      				let diasUteis = 0;
      				for (let d = 1; d <= ultimoDia; d++) {
      					const dataAtual = new Date(ano, mes, d);
      			  		const isFimSemana = dataAtual.getDay() === 0 || dataAtual.getDay() === 6;
      			  		const isFeriado = dados.feriados.some(f => parseInt(f.dia) === d && parseInt(f.mes) === mes + 1);
      			  		if (!isFimSemana && !isFeriado) diasUteis++;
      				}
      				return diasUteis;
    			})();

    			const thDias = document.createElement("th");
    			thDias.textContent = `Total de Dias Úteis Disponíveis no Mês: ${diasUteisNoMes}`;
    			thDias.colSpan = 5; // Total, Trabalhados, Faltas, Disponíveis
    			thDias.style.border = `1px solid ${tableborder}`;
    			thDias.style.backgroundColor = backgroundTableHeadersStats;
    			thDias.style.padding = linhasPadding;
    			thDias.style.fontSize = "13px";
    			thDias.style.textAlign = "center";
    			trHead1.appendChild(thDias);

    			// Outros headers
    			const outrosHeaders = ["Trabalhou <br>Vs Faltas (%)", "Intervenções <br>Agendadas", "Tarefas <br>Em <br>Colisão?!"];
    			outrosHeaders.forEach(h => {
      				const th = document.createElement("th");
      				th.innerHTML = h;
      				th.rowSpan = 2;
      				th.style.border = `1px solid ${tableborder}`;
      				th.style.backgroundColor = backgroundTableHeadersStats;
      				th.style.padding = "3px";
      				th.style.fontSize = "13px";
      				th.style.textAlign = "center";
      				trHead1.appendChild(th);
    			});

    			thead.appendChild(trHead1);

    			// Subcabeçalho dos dias
    			const trHead2 = document.createElement("tr");
    			const subHeaders = ["Total<sup>*</sup>", "Dias Trabalhados <br>(2ª-6ª + Fer. + FdS)", "Férias", "Faltas <br>Ausências", "Disponíveis <br>(dos dias úteis)"];
    			subHeaders.forEach(sh => {
      				const th = document.createElement("th");
      				th.innerHTML = sh;
      				th.style.border = `1px solid ${tableborder}`;
      				th.style.backgroundColor = backgroundTableHeadersStats;
      				th.style.padding = "3px";
      				th.style.fontSize = "13px";
      				th.style.textAlign = "center";
      				trHead2.appendChild(th);
    			});
    			thead.appendChild(trHead2);
    			tabela.appendChild(thead);

    			const tbody = document.createElement("tbody");

    			// ===== Preencher linhas =====
   				dados.tecnicos.forEach(tecnico => {
  					// Ignora técnicos com "sub" no nome
  					if (/sub/i.test(tecnico.nome)) return;

  					// Filtra tarefas do técnico no mês
  					const tarefasTecnico = dados.tarefas.filter(t => {
    					const dataInicio = new Date(t.data_inicio);
    					return (
     						t.tecnico === tecnico.nome &&
      						dataInicio.getFullYear() === ano &&
      						dataInicio.getMonth() === mes
    					);
  					});

  					// Dias de férias
  					let diasFeriasSet = new Set();
  					tarefasTecnico.filter(t => t.tipo.toLowerCase() === "férias").forEach(t => {
    					const inicio = new Date(t.data_inicio).getDate();
    					for (let i = 0; i < t.duracao; i++) diasFeriasSet.add(inicio + i);
  					});
  
  					const diasFerias = diasFeriasSet.size;

  					// Dias de ausência
  					let diasAusenciaSet = new Set();
  					tarefasTecnico.filter(t => t.tipo.toLowerCase() === "ausência").forEach(t => {
    					const inicio = new Date(t.data_inicio).getDate();
    					for (let i = 0; i < t.duracao; i++) diasAusenciaSet.add(inicio + i);
  					});

  					// Dias úteis no mês (sem feriados e fins de semana)
  					const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  					let diasUteisNoMes = 0;
  					for (let d = 1; d <= ultimoDia; d++) {
    					const dataAtual = new Date(ano, mes, d);
    					const isFimSemana = dataAtual.getDay() === 0 || dataAtual.getDay() === 6;
    					const isFeriado = dados.feriados.some(f => parseInt(f.dia) === d && parseInt(f.mes) === mes + 1);
    					if (!isFimSemana && !isFeriado) diasUteisNoMes++;
  					}

  					// Dias disponíveis (dias úteis - férias)
  					const diasDisponiveis = diasUteisNoMes - diasFerias;

  					// Dias trabalhados (excluindo férias e ausências)
  					// Dias trabalhados separados por semana, fim de semana e feriados
					let diasTrabalhadosSemanaSet = new Set();
					let diasTrabalhadosFimdeSemanaSet = new Set();
					let diasTrabalhadosFeriadosSet = new Set();

  					tarefasTecnico.filter(t => t.tipo.toLowerCase() !== "férias" && t.tipo.toLowerCase() !== "ausência").forEach(t => {
    					const inicioData = new Date(t.data_inicio);
    					for (let i = 0; i < t.duracao; i++) {
      						const dataAtual = new Date(inicioData);
      						dataAtual.setDate(dataAtual.getDate() + i);

      						const diaSemana = dataAtual.getDay(); // 0 = Domingo, 6 = Sábado
      						const dia = dataAtual.getDate();
      						const mesAtual = dataAtual.getMonth() + 1;
      						const anoAtual = dataAtual.getFullYear();

      						// Verifica se o dia é feriado
      						const ehFeriado = dados.feriados.some(f =>
       							parseInt(f.dia, 10) === dia &&
        						parseInt(f.mes, 10) === mesAtual &&
        						anoAtual === parseInt(dados.ano, 10)
      						);

      						// Classificação
      						if (ehFeriado) {
        						diasTrabalhadosFeriadosSet.add(dia);
      						} else if (diaSemana === 0 || diaSemana === 6) {
        						diasTrabalhadosFimdeSemanaSet.add(dia);
      						} else {
        						diasTrabalhadosSemanaSet.add(dia);
     						}
    					}
  					});

					const diasTrabalhadosSemana = diasTrabalhadosSemanaSet.size;
					const diasTrabalhadosFimdeSemana = diasTrabalhadosFimdeSemanaSet.size;
					const diasTrabalhadosFeriados = diasTrabalhadosFeriadosSet.size;

  					// Dias de faltas
  					const diasFaltas = diasAusenciaSet.size;

  					// Dias não trabalhados
  					const diasNaoTrabalhados = diasDisponiveis - (diasTrabalhadosSemana + diasTrabalhadosFimdeSemana);

  					// Taxa ocupacional e taxa de faltas
  					const taxaOcupacao = diasDisponiveis > 0 ? (((diasTrabalhadosSemana + diasTrabalhadosFimdeSemana) / diasDisponiveis) * 100).toFixed(1) : 0;
  					const taxaFaltas = diasDisponiveis > 0 ? ((diasFaltas / diasDisponiveis) * 100).toFixed(1) : 0;

  					// Contar sobreposições
  					let totalSobreposicoes = new Set();
  					for (let d = 1; d <= ultimoDia; d++) {
    					const tarefasNoDia = tarefasTecnico.filter(t => {
      						const inicio = new Date(t.data_inicio).getDate();
      						return d >= inicio && d <= inicio + t.duracao - 1 && t.tipo.toLowerCase() !== "férias";
   				 		});
    					if (tarefasNoDia.length > 1) {
      						tarefasNoDia.forEach(t => totalSobreposicoes.add(t));
    					}
  					}

  					// ===== Cria linha da tabela =====
  					const tr = document.createElement("tr");

  					// Nome do técnico
  					const tdNome = document.createElement("td");
  					tdNome.textContent = tecnico.nome;
  					tdNome.style.border = `1px solid ${tableborder}`;
  					tdNome.style.padding = linhasPadding;
  					tdNome.style.fontWeight = "bold";
  					tdNome.style.fontSize = "13px";
  					tdNome.style.textAlign = "right";
  					tdNome.style.padding = "2px 10px 2px 10px";
  					tdNome.style.whiteSpace = "nowrap";
  					tr.appendChild(tdNome);

  					// Colunas Dias Úteis do Mês: Total úteis | Trabalhados | Faltas | Disponíveis
  					[diasDisponiveis, `${diasTrabalhadosSemana} + ${diasTrabalhadosFeriados} + ${diasTrabalhadosFimdeSemana}`, diasFerias, diasFaltas, diasNaoTrabalhados - diasFaltas + diasTrabalhadosFimdeSemana].forEach(valor => {
    					const td = document.createElement("td");
    					td.textContent = valor;
    					td.style.border = `1px solid ${tableborder}`;
    					td.style.textAlign = "center";
   				 		td.style.fontSize = "13px";
    					tr.appendChild(td);
  					});

 				 	// Taxa Ocupacional
  					const tdTaxa = document.createElement("td");
  					tdTaxa.textContent = `${taxaOcupacao}% // ${taxaFaltas}%`;
 					tdTaxa.style.border = `1px solid ${tableborder}`;
  					tdTaxa.style.textAlign = "center";
  					tdTaxa.style.fontSize = "13px";
  					tr.appendChild(tdTaxa);

  					// Intervenções agendadas
  					const tdIntervencoes = document.createElement("td");
  					tdIntervencoes.textContent = tarefasTecnico.filter(t => t.tipo.toLowerCase() !== "férias").length;
  					tdIntervencoes.style.border = `1px solid ${tableborder}`;
  					tdIntervencoes.style.textAlign = "center";
  					tdIntervencoes.style.fontSize = "13px";
  					tr.appendChild(tdIntervencoes);

  					// Sobreposições
  					const tdSobreposicoes = document.createElement("td");
  					tdSobreposicoes.textContent = `${totalSobreposicoes.size}`;
  					tdSobreposicoes.style.border = `1px solid ${tableborder}`;
 					tdSobreposicoes.style.textAlign = "center";
  					tdSobreposicoes.style.fontSize = "13px";
  					tr.appendChild(tdSobreposicoes);

  					tbody.appendChild(tr);
				});

                tabela.appendChild(tbody);
                tituloStats.appendChild(tabela);

                // Nota
                const NotaTxt = document.createElement("div");
                NotaTxt.textContent = "* Excluindo Férias e Feriados";
                NotaTxt.style.textAlign = "right";
                NotaTxt.style.fontSize = "12px";
                NotaTxt.style.marginTop = "4px";
                tituloStats.appendChild(NotaTxt);

                // Adiciona ao popup
                ganttContent.appendChild(tituloStats);

                // ============================================================================
                // 7. GRÁFICOS COM CHART.JS
                // ============================================================================
				
				// === TABELA PRINCIPAL DOS GRÁFICOS ===
				const tabelaGrafico = document.createElement("table");
				tabelaGrafico.classList.add("tabelaGrafico");
				tabelaGrafico.style.borderCollapse = "collapse";
				tabelaGrafico.style.width = "100%";
				tabelaGrafico.style.marginTop = "8px";
				tabelaGrafico.style.borderRadius = "3px";
				
				// --- tabela alinhada à esquerda ---
				tabelaGrafico.style.marginLeft = "0";       // encosta à esquerda do container
				tabelaGrafico.style.marginRight = "auto";   // evita centralização
				tabelaGrafico.style.borderCollapse = "collapse"; // já tens


				// === Linha única ===
				const trGrafico = document.createElement("tr");

				// COLUNA 1 — GRÁFICO PIZZA
				const tdPie = document.createElement("td");
				tdPie.classList.add("tdPie");
				tdPie.style.padding = "4px 4px 2px 4px";
				tdPie.style.width = "270px";      // largura fixa
				tdPie.style.minWidth = "270px";   // evita encolher
				tdPie.style.maxWidth = "270px";   // evita expandir

				tdPie.style.maxHeight = "160px";
				
				tdPie.style.textAlign = "center";
				tdPie.style.verticalAlign = "center";
				tdPie.innerHTML = 'TIPOS DE INTERVENÇÃO<br><span style="font-size: 13px;">(Dia/Mês)</span><span style="font-size: 16px;"> <br></span>';
				tdPie.style.fontWeight = "bold";
				tdPie.style.borderRight = "2px solid #444";
				tdPie.style.borderLeft = "2px solid #444";
				tdPie.style.borderTop = "2px solid #444";
				tdPie.style.borderBottom = "2px solid #444";

				// Canvas PIE
				const canvasPie = document.createElement("canvas");
				canvasPie.id = `graficoPizza-${mes}`;
				// Define tamanho fixo do canvas
				canvasPie.width = 260;
				canvasPie.height = 160;

				canvasPie.style.maxWidth = "260px";   // largura visual
				canvasPie.style.height = "160px";  // altura
				tdPie.appendChild(canvasPie);
				trGrafico.appendChild(tdPie);

				// COLUNA 2 — ESPAÇADOR
				const tdEspaco1 = document.createElement("td");
				tdEspaco1.style.width = "20px";      // largura fixa
				tdEspaco1.style.minWidth = "20px";   // evita encolher
				tdEspaco1.style.maxWidth = "20px";   // evita expandir
				tdEspaco1.style.borderTop = "none";
				tdEspaco1.style.borderBottom = "none";
				tdEspaco1.style.borderRight = "2px solid #444";
				trGrafico.appendChild(tdEspaco1);

				// COLUNA 3 — GRÁFICO BARRAS
				const tdBar = document.createElement("td");
				tdBar.classList.add("tdBar");
				tdBar.style.padding = "4px 4px 2px 4px";
				tdBar.style.width = "240px";      // largura fixa
				tdBar.style.minWidth = "240px";   // evita encolher
				tdBar.style.maxWidth = "240px";   // evita expandir
				tdBar.style.textAlign = "center";
				tdBar.style.verticalAlign = "center";
				tdBar.innerHTML = 'ALOCAÇÃO DOS TÉCNICOS<br><span style="font-size: 13px;">(Dias no Mês)</span><span style="font-size: 16px;"> <br></span>';
				tdBar.style.fontWeight = "bold";
				tdBar.style.borderRight = "2px solid #444";
				tdBar.style.borderLeft = "2px solid #444";
				tdBar.style.borderTop = "2px solid #444";
				tdBar.style.borderBottom = "2px solid #444";

				// Canvas BARRAS
				const canvasBar = document.createElement("canvas");
				canvasBar.id = `graficoBar-${mes}`;
				canvasBar.style.maxWidth = "220px";
				canvasBar.style.height = "160px";
				tdBar.appendChild(canvasBar);
				trGrafico.appendChild(tdBar);

				// COLUNA 4 — ESPAÇADOR FINAL
				const tdEspaco2 = document.createElement("td");
				tdEspaco2.style.minWidth = "300px";
				tdEspaco2.style.borderTop = "none";
				tdEspaco2.style.borderBottom = "none";
				tdEspaco2.style.borderRight = "none"; // sem lateral direita
				trGrafico.appendChild(tdEspaco2);

				// === Montagem final ===
				tabelaGrafico.appendChild(trGrafico);
				ganttContent.appendChild(tabelaGrafico);


                // Dados do gráfico (mantive a tua contagem por tarefas)
                const categorias = { Preventivas: 0, Curativas: 0, Urgentes: 0, Contratos: 0, Outros: 0 };

                dados.tarefas.forEach(tarefa => {
                    const tipo = tarefa.tipo.toLowerCase();
                    if (tipo.includes("preventiva")) categorias.Preventivas++;
                    else if (tipo.includes("curativa")) categorias.Curativas++;
                    else if (tipo.includes("urgente")) categorias.Urgentes++;
                    else if (tipo.includes("contrato")) categorias.Contratos++;
                    else if (tipo !== "férias" && tipo !== "ausência") categorias.Outros++;
                });
                

                // ===========================================================================
				// 8. CÁLCULO DE DIAS POR TIPO COM SOBREPOSIÇÕES POR TÉCNICO
				// ===========================================================================
				// Inicializa contadores de dias por número de técnicos
				let diasNenhumTecnico = 0;
				let diasApenas1Tecnico = 0;
				let diasApenas2Tecnicos = 0;
				let diasMais2Tecnicos = 0;

				const diasPorTipo = {};
				Object.keys(categorias).forEach(tipo => { diasPorTipo[tipo] = 0; });
				diasPorTipo["Outros"] = 0;

				const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();

				// Mapa de palavras-chave para cada tipo
				const tiposMap = {
				    Preventivas: ["preventiva", "preventivo"],
				    Curativas: ["curativa", "curativo"],
				    Urgentes: ["urgente", "urgência"],
				    Contratos: ["contrato", "contratual"]
				};

				for (let dia = 1; dia <= ultimoDiaMes; dia++) {
    				const dataDia = new Date(ano, mes, dia);

    				// Detectar fins de semana ou feriados
    				const isFimSemana = dataDia.getDay() === 0 || dataDia.getDay() === 6;
    				const isFeriado = dados.feriados.some(f =>
        				parseInt(f.dia) === dia && parseInt(f.mes) === mes + 1
    				);

    				// Filtra tarefas ativas neste dia (excluindo férias e ausências)
    				const tarefasDoDia = dados.tarefas.filter(t => {
        				const inicio = new Date(t.data_inicio);
        				const fim = new Date(inicio);
        				fim.setDate(fim.getDate() + t.duracao - 1);

        				return (
            				dataDia >= inicio &&
            				dataDia <= fim &&
            				t.tipo.toLowerCase() !== "férias" &&
            				t.tipo.toLowerCase() !== "ausência"
        				);
   					});
   					
   					// CONTAGEM DE QUANTOS TÉCNICOS TRABALHARAM NO DIA ----------
    				const tecnicosNoDia = new Set(tarefasDoDia.map(t => t.tecnico));

    				// Contador de técnicos ativos neste dia ------
    				// diasNenhumTecnico, diasApenas1Tecnico, diasApenas2Tecnicos, diasMais2Tecnicos
    				if (tecnicosNoDia.size === 0) {   // Só não conta dias sem técnicos se forem fim de semana ou feriado
        				if (!isFimSemana && !isFeriado) {
            				diasNenhumTecnico++;
        				}
    				} else {
        				// Se há técnicos, conta sempre, independentemente do dia
        					switch (tecnicosNoDia.size) {
           						 case 1:
                					diasApenas1Tecnico++;
                					break;
            					case 2:
                					diasApenas2Tecnicos++;
               						 break;
            					default:
                					diasMais2Tecnicos++;
                					break;
        					}
    				}

    				// Se não existem tarefas, não há nada a contabilizar para tipos
    				if (tarefasDoDia.length === 0) continue;

    				// Agrupar tarefas por técnico e classificar por tipo
    				const tarefasPorTecnico = {};
    				tarefasDoDia.forEach(t => {
        				if (!tarefasPorTecnico[t.tecnico]) tarefasPorTecnico[t.tecnico] = {};
        				
        				// Determinar tipo da tarefa
        				let tipoKey = "Outros";
        				const tipoLower = t.tipo.toLowerCase();
        				for (const [key, palavras] of Object.entries(tiposMap)) {
            				if (palavras.some(p => tipoLower.includes(p))) {
                				tipoKey = key;
                				break;
            				}
        				}

        				// Criar set de clientes para cada tipo (garante 1 dia por tipo mesmo com múltiplos clientes)
        				if (!tarefasPorTecnico[t.tecnico][tipoKey]) tarefasPorTecnico[t.tecnico][tipoKey] = new Set();
        				tarefasPorTecnico[t.tecnico][tipoKey].add(t.cliente);
    				});

    				// Para cada técnico, distribuir 1 dia entre tipos únicos
    				Object.values(tarefasPorTecnico).forEach(tiposDoTecnico => {
        				const tiposPresentes = Object.keys(tiposDoTecnico);
        				const fracao = 1 / tiposPresentes.length; // divisão proporcional por tipo
        				tiposPresentes.forEach(tipoKey => {
            				diasPorTipo[tipoKey] += fracao;
        				});
    				});
				}

				// Arredondar resultados para 2 casas decimais
				Object.keys(diasPorTipo).forEach(tipo => {
    				diasPorTipo[tipo] = Math.round(diasPorTipo[tipo] * 100) / 100;
				});
				

                const coresCategorias = [
                    "#33FF57", "#FF33A8", "#FF706B", "#33C3FF", "#BDBDBD"
                ];

                const dadosGrafico = {
                    labels: Object.keys(diasPorTipo),
                    datasets: [{
                        label: "Tipos de Intervenções",
                        data: Object.values(diasPorTipo),
                        backgroundColor: coresCategorias,
                        borderColor: "#000000",
                        borderWidth: 1
                    }]
                };
                
                // ================== GRÁFICO PIE ==================
            
                // Verifica se há dados reais
				const valores = Object.values(diasPorTipo);
				const labels = Object.keys(diasPorTipo);

				// Mantemos as cores originais para cada tipo, mas semi-transparente se valor = 0
				const backgroundColors = labels.map((label, idx) => {
				    return valores[idx] === 0 
				        ? `${coresCategorias[idx]}88` // pie visível mas translúcido
				        : coresCategorias[idx];       // cor original se valor > 0
				});

				const dadosGraficoPie = {
				    labels: labels,
				    datasets: [{
				        data: valores,
				        backgroundColor: backgroundColors,
				        borderColor: "#000",
				        borderWidth: 1
				    }]
				};

				const configGraficoPie = {
				    type: "pie",
				    data: dadosGraficoPie,
				    plugins: [
				        ChartDataLabels,
 				       {
				            id: 'centroInterrogacao',
				    afterDraw: function(chart) {
				        const total = valores.reduce((a, b) => a + b, 0);
				        if (total === 0) {
				            const ctx = chart.ctx;
				            const width = chart.width;
				            const height = chart.height;
				            ctx.save();

				            // Parâmetros ajustáveis
				            const raioPercent = 0.48;   // raio do círculo em % do canvas (0.5 = metade)
 				           const deslocX = -45;         // deslocamento horizontal (px ou % relativo)
 				           const deslocY = 0;         // deslocamento vertical
 				           const tamanhoInterrogacao = Math.min(width, height) * 0.25; // tamanho do ?

 				           // Posição central (ajustável)
 				           const centerX = width / 2 + deslocX;
 				           const centerY = height / 2 + deslocY;
				
 				           // Fundo circular translúcido
 				           const radius = Math.min(width, height) * raioPercent;
 				           ctx.beginPath();
 				           ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
 				           ctx.fillStyle = "rgba(0,0,0,0.15)"; // transparência ajustável
 				           ctx.fill();

				            // ?
				            ctx.fillStyle = "#000";  // cor do texto
				            ctx.font = `bold ${tamanhoInterrogacao}px Arial`;
				            ctx.textAlign = 'center';
 				           ctx.textBaseline = 'middle';
				            ctx.fillText('?', centerX, centerY);

				            ctx.restore();
				        }
				    }
		        }
 			   ],
    			options: {
        			responsive: false,           // importante para respeitar tamanho do canvas
        			maintainAspectRatio: false,  // impede redimensionamento automático
        			layout: {
        				padding: { right: -10 }   // aumenta ou reduz conforme desejado
    				},
        			plugins: {
            			legend: {
                			position: "right",
                			labels: {
                    			align: "end",
                    			boxWidth: 12,
                    			boxHeight: 8,
                    			borderRadius: 6,
                    			padding: 4,
                    			color: "#000",
                    			font: { size: 13, weight: "normal" },
                    			generateLabels: function(chart) {
                        			const original = Chart.overrides.pie.plugins.legend.labels.generateLabels(chart);
                        			const linhasEmBranco = Array(4).fill().map(() => ({
                            			text: "",
                            			color: backgroundPopup,
                            			fillStyle: "transparent",
                            			strokeStyle: "transparent",
                            			boxWidth: 0,
                            			hidden: true,
                            			lineWidth: 0
                        			}));
                        			return [...linhasEmBranco, ...original];
                    			}
                			}
            			},
            			datalabels: {
                			color: "#fff",
                			font: { weight: "bold", size: 18 },
                			textStrokeColor: "#000",
                			textStrokeWidth: 3,
                			formatter: (value) => value === 0 ? '' : value,
                			anchor: 'center',
                			align: 'center',
                			offset: 0
            			},
            			tooltip: {
                			callbacks: {
                    			label: (context) => `${context.label}: ${context.raw} intervenções`
                			}
            			}
       			 	}
    			}
				};
				
				// ================== GRÁFICO BAR ==================
				const configGraficoBar = {
    				type: "bar",
    				data: {
        				labels: ["0*", "1", "2", "3+"], 
        				datasets: [{
            				label: "Dias/Mês",
            				data: [diasNenhumTecnico, diasApenas1Tecnico, diasApenas2Tecnicos, diasMais2Tecnicos],
            				backgroundColor: ["#EC432B","#FF9300","#01B101","#0096FF"],
            				borderColor: "#000",
            				borderWidth: 1
        				}]
    				},
    				plugins: [ChartDataLabels],
    				options: {
        				responsive: true,
        				plugins: {
            				legend: { display: false },
            				title: {
                				display: true,
                				text: "",
                				font: { size: 14, weight: "bold" }
            				},
            				datalabels: {
                				color: '#000',
                				font: { size: 16, weight: 'bold' },
                				formatter: function(value) {
                    				return value;
                				},
                				anchor: function(context) {
                    				const value = context.dataset.data[context.dataIndex];
                    				return value < 10 ? 'end' : 'center'; // cima ou dentro
                				},
                				align: function(context) {
                    				const value = context.dataset.data[context.dataIndex];
                    				return value < 10 ? 'end' : 'center'; // cima ou dentro
                				},
                				offset: 2 // pequena distância quando está acima da barra
            				}
        				},
        				scales: {
            				x: {
                				ticks: {
                    				font: { size: 16, weight: 'normal' },
                    				color: "#000"
                				},
                				categoryPercentage: 0.3,
                				barPercentage: 0.6
            				},
            				y: {
    							type: 'linear',          // força escala linear
    							beginAtZero: true,
    							min: 0,
    							max: 25,
    							grace: 0,                // evita "folga" extra acima do valor máximo
    							ticks: {
        							stepSize: 5,         // garante divisões fixas
        							autoSkip: false,     // impede o Chart.js de ocultar ticks
        							callback: function(value) {
            							return value;    // mostra todos (sem ocultar múltiplos)
        							},
        							font: { size: 14 },
        							color: "#000"
    							},
    							grid: {
        							drawBorder: true,
        							color: "#aaa"
    							}
							}
        				}
    				}
				};

                // Se já existia um chart, destrói (protege de múltiplos opens)
                if (chartInstance) {
                    try { chartInstance.destroy(); } catch (e) { /* ignore */ }
                    chartInstance = null;
                }
                
    			
    			// ===== Instancia os gráficos =====
				chartInstancePie = new Chart(canvasPie, configGraficoPie);
				chartInstanceBar = new Chart(canvasBar, configGraficoBar);


            } else {
                // Fecha o STATS: restaura altura original
				ganttPopup2.style.height = "300px";
				ganttPopup2.style.top = "50%";
        		ganttPopup2.style.left = "50%";
        		ganttPopup2.style.transform = "translate(-50%, -50%)";
				
				// Remove completamente o container de stats se existir
				const statsContainer = ganttContent.querySelector("#gantt-estatisticas-title");
				if (statsContainer) statsContainer.remove();
				
        		// Remove tabela de gráficos se existir
				const tabelaGrafico = ganttContent.querySelector("table.tabelaGrafico");
				if (tabelaGrafico) tabelaGrafico.remove();


				// destrói gráfico Pie se existir
				if (chartInstancePie) {
				    try { chartInstancePie.destroy(); } catch (e) {}
				    chartInstancePie = null;
				}
				// destrói gráfico Bar se existir
				if (chartInstanceBar) {
    				try { chartInstanceBar.destroy(); } catch(e) {}
    				chartInstanceBar = null;
				}
				
				// Elimina molduras criadas
				const existingCanvas = document.getElementById('canvasMoldura');
        		existingCanvas.remove();
        		return; // encerra aqui, sem redesenhar
            }
            
        });


		// --- Clique fora do popup (fecha popup) ---
		document.addEventListener("click", (ev) => {
    		if (!ganttPopup2.contains(ev.target) && ev.target !== ganttBtn) {
        		limparPopupGantt();
        		ganttPopup2.style.display = "none";
        		ganttPopup2.style.height = ganttPopup2.dataset.originalHeight;
        		ganttPopup2.style.maxHeight = ganttPopup2.dataset.originalMaxHeight;
        		limparPopupGantt() 
        		popupGanttAberto = false; // marca como fechado
            	ganttPopup2 = null;
    		}
		});


		// ====== FUNÇÃO PARA LIMPAR O POPUP GANTT ======
		function limparPopupGantt() {
    		// Limpa conteúdo do popup
    		ganttContent.innerHTML = '';

    		// Remove canvas se existir
    		const existingCanvas = document.getElementById('canvasMoldura');
    		if (existingCanvas) existingCanvas.remove();

    		// Remove stats se estiverem expandidas
    		const statsContainer = ganttContent.querySelector("#gantt-estatisticas-title");
    		if (statsContainer) statsContainer.remove();

    		// Destrói gráfico se existir
    		if (chartInstance) {
        		try { chartInstance.destroy(); } catch(e) {}
        		chartInstance = null;
    		}
    		popupExpanded = false;
		}


		// ====== FUNÇÃO PARA MONTAR A TABELA MÊS NO POPUP GANTT ======
		function montarTabelaMesGantt() {
			// ====== Calcula número total de colunas ======
		    const totalColunas = 1 + ultimoDia.getDate(); // 1 coluna interventor + dias do mês

		    // Cria tabela Gantt
		  	const tabela = document.createElement("table");
		 	tabela.style.borderCollapse = "collapse";
		    tabela.style.width = "100%";
		    tabela.style.border = `2px solid ${tableborder}`;

 		   const thead = document.createElement("thead");

 		  	// ======= Primeira linha: título =======
		    const trTitulo = document.createElement("tr");
		    const tdTitulo = document.createElement("td");
		    tdTitulo.colSpan = totalColunas;
		    tdTitulo.style.textAlign = "center";
		    tdTitulo.style.fontWeight = "bold";
 		   	tdTitulo.style.fontSize = "14px";
		    tdTitulo.style.padding = "4px";

		   	// Bordas: inferior visível, outras transparentes
		   	tdTitulo.style.borderTop = "2px solid transparent";
		   	tdTitulo.style.borderLeft = "2px solid transparent";
		 	tdTitulo.style.borderRight = "2px solid transparent";
			tdTitulo.style.borderBottom = `2px solid ${tableborder}`;

		    tdTitulo.textContent = `MAPA DE INTERVENÇÕES - ${nomesMeses[mes].toUpperCase()}`;
		  	tdTitulo.style.fontSize = "18px";
		   	tdTitulo.style.padding = "2px 0px 10px 0px";
		  	trTitulo.appendChild(tdTitulo);
		   	thead.appendChild(trTitulo);

		   	// ======= Segunda linha: cabeçalho dias =======
		  	const trHead = document.createElement("tr");

		    // Célula "Interventor"
		    const thMes = document.createElement("th");
		    thMes.textContent = "INTERVENTOR";
 		   thMes.style.fontSize = "13px";
		    thMes.style.textAlign = "right";
		    thMes.style.padding = "4px 10px";
		    thMes.style.width = "150px";
		    thMes.style.minWidth = "150px";
		    thMes.style.maxWidth = "150px";
		    thMes.style.border = `2px solid ${tableborder}`;
		    thMes.style.borderBottom = "3px double #000";
		    thMes.style.backgroundColor = backgroundTableHeadersMes;
		    thMes.style.fontWeight = "bold";
 		   trHead.appendChild(thMes);

  		  // Dias do mês
  		  for (let d = 1; d <= ultimoDia.getDate(); d++) {
  		      const th = document.createElement("th");
  		      th.textContent = d;
  		      th.style.fontSize = "13px";
 		       th.style.padding = "2px";
 		       th.style.width = "20px";
		        th.style.height = "26px";
		        th.style.minWidth = "20px";
		        th.style.maxWidth = "20px";
		        th.style.backgroundColor = backgroundTableHeadersMes;
		        th.style.borderRight = `2px solid ${tableborder}`;
        		th.style.borderBottom = "3px double #000";
		        trHead.appendChild(th);
		    }

 		   thead.appendChild(trHead);
 		   tabela.appendChild(thead);

 		   // ====== CORPO DA TABELA ======
 		   const tbody = document.createElement("tbody");

 		   // Monta linhas por técnico
 		   dados.tecnicos.forEach(tecnico => {
 		   	const tarefasDoTecnico = dados.tarefas
 		       		.filter(t => t.tecnico === tecnico.nome &&
 		              		new Date(t.data_inicio).getFullYear() === ano &&
 		                 	new Date(t.data_inicio).getMonth() === mes)
 		           	.sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio));

  		     	const tr = document.createElement("tr");

  		     	// células dos nomes dos interventores
  		     	const tdNome = document.createElement("td");
  		     	tdNome.textContent = tecnico.nome;
  		     	tdNome.style.fontWeight = "bold";
  		      	tdNome.style.fontSize = "13px";
  		      	tdNome.style.textAlign = "right";
  		      	tdNome.style.padding = "2px 10px 2px 10px";
 		       	tdNome.style.borderRight = `2px solid ${tableborder}`;
  		      	tdNome.style.borderBottom = `1px dashed ${tableLine}`;
 		       	tdNome.style.backgroundColor = backgroundTableHeadersStats;
 		       	tdNome.style.color = "black";
 		       	tdNome.style.verticalAlign = "bottom";
  		      	tr.appendChild(tdNome);

		      	// Células dos dias do mês
		        for (let d = 1; d <= ultimoDia.getDate(); d++) {
		       		const td = document.createElement("td");
		            td.style.width = "25px";
		         	td.style.height = "22px";
		           	td.style.borderRight = `1px solid ${tableborder}`;
		           	td.style.borderBottom = "1px dashed #808080";

		          	// Identificar se é fim de semana
		          	const diaAtual = new Date(ano, mes, d);
		          	const isFimSemana = diaAtual.getDay() === 0 || diaAtual.getDay() === 6;

		          	// Identificar se é feriado
		         	const isFeriado = dados.feriados.some(f =>
		            	parseInt(f.dia) === d && parseInt(f.mes) === mes + 1
		           	);

 		      		// Definir cor de fundo
 		       	if (isFeriado) {
		            	td.style.backgroundColor = feriadoColor;
		           	} else if (isFimSemana) {
		             	td.style.backgroundColor = fdsColor;
		          	} else {
		             	td.style.backgroundColor = basicColor;
		          	}

 		       	td.style.padding = "0";
 		       	td.style.position = "relative";
		          	tr.appendChild(td);

		         	const tarefasNoDia = tarefasDoTecnico.filter(t =>
		          		d >= new Date(t.data_inicio).getDate() &&
		          		d <= new Date(t.data_inicio).getDate() + t.duracao - 1
		        	);

		         	tarefasNoDia.forEach(tarefaDia => {
		        		if (d === new Date(tarefaDia.data_inicio).getDate()) {
		                	const tipoInfo = dados.tiposTarefa.find(tp => tp.tipo === tarefaDia.tipo);
		             		const barra = document.createElement("div");
		              		barra.classList.add("barra-tarefa");
		                	barra.style.position = "absolute";
		                 	barra.style.left = "0";
		                	barra.style.top = "2px";
		                    barra.style.height = "16px";
		                  	barra.style.width = `${tarefaDia.duracao * 25}px`;
		                  	barra.style.borderRadius = "4px";
		                 	barra.style.borderBottom = `1px solid ${tableborder}`;
		                   	barra.style.boxShadow = "0px 2px 4px rgba(0,0,0,0.6)";
		                  	barra.style.zIndex = "1";

 		             		// Transparência dias sobrepostos
 		                  	let sobreposicoes = [];
 		                 	for (let i = 0; i < tarefaDia.duracao; i++) {
 		                  		const diaAtual2 = new Date(tarefaDia.data_inicio).getDate() + i;
 		                		const colisao = tarefasNoDia.filter(t =>
 		                      		t !== tarefaDia &&
 		                         	diaAtual2 >= new Date(t.data_inicio).getDate() &&
		                          	diaAtual2 <= new Date(t.data_inicio).getDate() + t.duracao - 1
		                      	);
		                       	sobreposicoes.push(colisao.length);
 		                   }

		                   	const coresDias = sobreposicoes.map(qtd =>
		                  		qtd > 0 ? (tipoInfo?.cor + "99") : tipoInfo?.cor
		                 	);

 		                	const gradiente = coresDias.map((cor, idx) => {
		                  		const inicio = (idx / tarefaDia.duracao) * 100;
		                    	const fim = ((idx + 1) / tarefaDia.duracao) * 100;
		                      	return `${cor} ${inicio}%, ${cor} ${fim}%`;
		                  	}).join(", ");
		                	barra.style.background = `linear-gradient(to right, ${gradiente})`;

		                 	// Contador sobreposição
		                 	const indicesSobrepostos = sobreposicoes
		                  		.map((qtd, idx) => qtd > 0 ? idx : -1)
		                   		.filter(idx => idx >= 0);
		
		                  	if (indicesSobrepostos.length > 0) {
		                  		const contador = document.createElement("span");
		                       	const totalSobrepostos = Math.max(...indicesSobrepostos.map(i => sobreposicoes[i])) + 1;
		                       	contador.textContent = `${totalSobrepostos}x`;
		                    	contador.style.position = "absolute";

 		                     	const primeiroDia = indicesSobrepostos[0];
 		                      	const ultimoDiaIdx = indicesSobrepostos[indicesSobrepostos.length - 1];
 		                    	const meioSobreposicao = Math.floor((primeiroDia + ultimoDiaIdx) / 2);

		                      	contador.style.left = `${meioSobreposicao * 24 + 12}px`;
		                     	contador.style.top = "50%";
		                     	contador.style.transform = "translate(-50%, -50%)";
		                       	contador.style.color = "#000";
		                       	contador.style.fontWeight = "bold";
		                       	contador.style.fontSize = "12px";
		                        contador.style.pointerEvents = "none";
 		                      	barra.appendChild(contador);
		                 	}

		                 	const tarefasSobrepostas = tarefasNoDia.map(t => `${t.cliente} (${t.tipo}) -> ${t.duracao} dia(s)`);
		                 	barra.title = tarefasSobrepostas.join("\n");

		                	td.appendChild(barra);
		             	}
		       		});
		    	}

		    	tbody.appendChild(tr);

		     	});

		   		tabela.appendChild(tbody);

		    	// ======= Rodapé: legenda =======
		    	const trLegenda = document.createElement("tr");
		    	const tdLegenda = document.createElement("td");
		    	tdLegenda.colSpan = totalColunas;
		    	tdLegenda.style.padding = "4px 2px";

		    	tdLegenda.style.borderTop = `2px solid ${tableborder}`;
		    	tdLegenda.style.borderLeft = "2px solid transparent";
		    	tdLegenda.style.borderRight = "2px solid transparent";
		    	tdLegenda.style.borderBottom = "2px solid transparent";

		    	const legendaGantt = document.createElement("div");
		    	legendaGantt.style.display = "flex";
		    	legendaGantt.style.flexWrap = "wrap";
		    	legendaGantt.style.gap = "12px";
		
		    	dados.tiposTarefa.forEach(tp => {
		       		const item = document.createElement("div");
		        	item.style.display = "flex";
		        	item.style.alignItems = "center";
		        	item.style.gap = "4px";
		
		        	const bola = document.createElement("span");
		        	bola.style.width = "14px";
		        	bola.style.height = "14px";
 		       		bola.style.borderRadius = "30%";
        			bola.style.backgroundColor = tp.cor;
        			bola.style.display = "inline-block";
        			bola.style.border = `1px solid ${tableborder}`;

        			const texto = document.createElement("span");
        			texto.textContent = tp.tipo;
        			texto.style.fontSize = "13px";
		
        			item.appendChild(bola);
        			item.appendChild(texto);
        			legendaGantt.appendChild(item);
    			});

    			tdLegenda.appendChild(legendaGantt);
    			trLegenda.appendChild(tdLegenda);
    			tabela.appendChild(trLegenda);

		    	// ====== Insere tabela no popup ======
		    	ganttContent.appendChild(tabela);
		}


        // --- Clique no botão GANTT: monta o diagrama do mês e mostra o popup ---
        ganttBtn.addEventListener("click", (e) => {
            e.stopPropagation(); // evita que o clique "vaze" e feche o popup via document click
            
    		// Se popup já estiver aberto, fecha antes de abrir outro
    		if (popupGanttAberto && ganttPopup2) {
        		ganttPopup2.remove();     // remove do DOM
        		popupGanttAberto = false;
        		ganttPopup2 = null;
    		}

    		popupGanttAberto = true;
            montarTabelaMesGantt();
        
            // Mostra e centra o popup
            ganttPopup2.style.top = "50%";
        	ganttPopup2.style.left = "50%";
        	ganttPopup2.style.transform = "translate(-50%, -50%)";
            ganttPopup2.style.display = "block";
        });

        // Torna do popup arrastável
        tornarDraggable(ganttPopup2);
        
        // Inserir mês finalizado no calendário
        calendarioContainer.appendChild(divMes);
    } // fim loop meses
    
} // fim gerarCalendario

// Ajusta o tamanhos...
ajustarTamanhoDiasEBolas();
ajustarColunasCalendario();

// Carrega tudo
carregarDados();

// Adiciona listener para redimensionamentos...
window.addEventListener('resize', () => {
  ajustarTamanhoDiasEBolas();
  ajustarColunasCalendario();
});


function ajustarTamanhoDiasEBolas() {
  const dias = document.querySelectorAll('.dia');

  dias.forEach(dia => {
    const largura = dia.clientWidth;
    const altura = dia.clientHeight;

    // Ajuste do número do dia
    const numero = dia.querySelector('.numero-background');
    if (numero) {
      let tamanhoFonte = Math.floor(largura * 0.5);
      if (tamanhoFonte > 34) tamanhoFonte = 34;
      numero.style.fontSize = `${tamanhoFonte}px`;
      numero.style.position = 'absolute';
      numero.style.top = '50%';
      numero.style.left = '50%';
      numero.style.transform = 'translate(-50%, -50%)';
      numero.style.margin = '0';
    }

    // Ajuste das bolinhas
    const bolasContainer = dia.querySelector('.bolas-container');
    if (bolasContainer) {
      let tamanhoBola = Math.floor(largura * 0.5); // tamanho da bola proporcional à célula
      if (tamanhoBola > 16) tamanhoBola = 16;        // tamanho máximo
      if (tamanhoBola < 6) tamanhoBola = 6;          // tamanho mínimo

      const bolas = bolasContainer.querySelectorAll('.bola-tarefa');
      bolas.forEach(bola => {
        // Ajusta tamanho da bolinha
        bola.style.width = `${tamanhoBola}px`;
        bola.style.height = `${tamanhoBola}px`;

        // Ajusta fonte do texto dentro da bolinha
        let tamanhoFonteBola = Math.floor(tamanhoBola * 0.85); // 60% da largura da bolinha
        if (tamanhoFonteBola < 2) tamanhoFonteBola = 2;
        bola.style.fontSize = `${tamanhoFonteBola}px`;

        // Centraliza texto na bolinha
        bola.style.display = 'flex';
        bola.style.alignItems = 'center';
        bola.style.justifyContent = 'center';
        bola.style.paddingLeft = '2px';
        bola.style.paddingRight = '2px';
      });

      // Centraliza container horizontalmente na célula
      bolasContainer.style.position = 'absolute';
      bolasContainer.style.display = 'flex';
      bolasContainer.style.flexWrap = 'wrap';
      bolasContainer.style.gap = '2px';
      bolasContainer.style.padding = '1px';
      bolasContainer.style.justifyContent = 'center';
    }
  });
}

function ajustarColunasCalendario() {
  const calendario = document.getElementById('calendario');
  if (!calendario) return;

  // Detectar telemóvel via userAgent
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua);

  const larguraTela = window.innerWidth;

  if (isMobile) {
    // Se for telemóvel
    if (larguraTela <= 800) {
      calendario.style.gridTemplateColumns = 'repeat(1, 1fr)';
    } else {
      calendario.style.gridTemplateColumns = 'repeat(2, 1fr)';
    }
  } else {
    // Se não for telemóvel (portátil/desktop)
    if (larguraTela <= 1000) {
      calendario.style.gridTemplateColumns = 'repeat(1, 1fr)';
    } else if (larguraTela <= 1200) {
      calendario.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else if (larguraTela >= 1400) {
      calendario.style.gridTemplateColumns = 'repeat(3, 1fr)';
    }
  }
}

// Executa após o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
  mostrarResolucao;
  ajustarColunasCalendario();
  window.addEventListener('resize', ajustarColunasCalendario);
});