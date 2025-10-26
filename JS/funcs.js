// =============================================================================
// SISTEMA DE AGENDA ANUAL - SAV
// =============================================================================
// FICHEIRO COM FUNÇÕES BÁSICAS PARA USO EM "scripts.js"
// Revisão 1.A
//
// 01. Permite Arrastar Janelas/Popups no Ecrã
// 02. Compatibilizar Clique de Rato em Touchscreen (Mobile/Tablets)
// 03. Assinatura do criador e Versão no Rodapé
// 04. Ajustar a Disposição dos Meses (Linhas Vs Colunas)
// 05. Gerar as Legendas (Tipo Bolas Coloridas)
// 06. Ajustar Altura Mínimo Necessária para Mostrar a Janela do Mês sem Cortes
// 07. Gráfico Tipo PIE
// 08. Gráfico Tipo BARRAS
// 09. Ajustar o Tamanho dos Dias Escritos nos Meses e Respectivas Bolas
// 10. Criação das Bolas das Tarefas Dentro de Cada Mês
// 11. Cria o botão de abertura do popup Gantt (ícone tipo "olho") e o popup vazio
// 12. Cria a tabela e cabeçalhos da secção de estatísticas 
// 13. Cria linhas na tabela de estatísticas (por cada interventor)
// 14. Cria tabela para a inserção de gráficos
// 15. Calcular as Estatísticas pr Mês para cada Interventor
// 16. Cria o mês em forma de mapa de gantt com inclusão de técnicos e tarefas
// 17. Para Troubleshooting: Apresenta na Primeira Linha a Resolução Real Vs Fisica do Ecrã e True/False para Mobile
// ============================================================================


// ============================================================================
// 1. PERMITE ARRASTAR JANELAS/POPUPS NO ECRÃ
// ============================================================================
function tornarDraggable(element, handle = null) {
    let startX = 0, startY = 0, origX = 0, origY = 0;

    const dragArea = handle || element;

    const dragStart = (e) => {
        e.preventDefault();
        if (e.type === "touchstart") {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        } else {
            startX = e.clientX;
            startY = e.clientY;
        }

        // Converter posição centralizada em left/top absolutos
        const rect = element.getBoundingClientRect();
        origX = rect.left;
        origY = rect.top;

        // Remove transform apenas após calcular posição inicial
        element.style.transform = "none";
        element.style.left = origX + "px";
        element.style.top  = origY + "px";
        element.style.position = "fixed";

        document.addEventListener("mousemove", dragMove);
        document.addEventListener("mouseup", dragEnd);
        document.addEventListener("touchmove", dragMove, { passive: false });
        document.addEventListener("touchend", dragEnd);
    };

    const dragMove = (e) => {
        e.preventDefault();
        const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;

        element.style.left = origX + (clientX - startX) + "px";
        element.style.top  = origY + (clientY - startY) + "px";
    };

    const dragEnd = () => {
        document.removeEventListener("mousemove", dragMove);
        document.removeEventListener("mouseup", dragEnd);
        document.removeEventListener("touchmove", dragMove);
        document.removeEventListener("touchend", dragEnd);
    };

    dragArea.addEventListener("mousedown", dragStart);
    dragArea.addEventListener("touchstart", dragStart, { passive: false });
}

// ============================================================================
// 2. COMPATIBILIZAR CLIQUE DE RATO EM TOUCHSCREEN PARA MOBILE/TABLETS
// ============================================================================
function emularCliqueEmToque(elemento) {
    if (!elemento) return;

    // Remove event listeners duplicados
    elemento.removeEventListener("touchstart", elemento._touchHandler);

    // Cria e associa o handler
    elemento._touchHandler = function (e) {
        e.preventDefault(); // impede zoom ou scroll
        e.stopPropagation(); // impede propagação errada
        elemento.click(); // emula o clique real
    };

    elemento.addEventListener("touchstart", elemento._touchHandler);
}

// ============================================================================
// 3. ASSINATURA DO CRIADOR E VERSÃO NO RODAPÉ
// ============================================================================
function adicionarAssinaturaLegenda(container) {
    const assinaturaExistente = container.querySelector(".legenda-assinatura");
    if (assinaturaExistente) return; // evita duplicar

    const assinatura = document.createElement("div");
    assinatura.classList.add("legenda-item", "legenda-assinatura");
    assinatura.style.marginLeft = "auto";
    assinatura.style.alignSelf = "center";
    assinatura.style.fontSize = "12px";
    assinatura.style.color = "#666";
    assinatura.style.fontWeight = "normal";
    assinatura.style.paddingLeft = "12px";
    assinatura.style.whiteSpace = "nowrap";
    assinatura.textContent = "Version 1.A";
    
    if (isTouchDevice) {
    	assinatura.textContent += "/t [DrWE © 2025 ]"; // Para simbolizar versão a correr com Touchscreen
    }
    else {
    	assinatura.textContent += "/r [ DrWE © 2025 ]"; // Para simbolizar versão a correr com Rato
    }

    container.appendChild(assinatura);
}

// ============================================================================
// 4. AJUSTAR A DISPOSIÇÃO DOS MESES (LINHAS Vs Colunas)
// ============================================================================
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

// ============================================================================
// 5. GERAR AS LEGENDAS DO TIPO BOLAS
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
// 6. AJUSTAR A ALTURA MÍNIMA NECESSÁRIA PARA MOSTRAR A JANELA DO MÊS SEM CORTES
// ============================================================================
function ajustarAlturaNecessáriaPopupGantt(container, valorBase, quantidadeTecnicos) {  
  if (!container) return; // garante que existe
	//let alturaNecessáriaPopupGantt = valorBase + 8*12;
	let alturaNecessáriaPopupGantt = valorBase + quantidadeTecnicos*12*2;
	container.style.height = `${alturaNecessáriaPopupGantt}px`;

  // centraliza novamente
  container.style.top = "50%";
  container.style.left = "50%";
  container.style.transform = "translate(-50%, -50%)";

}

// ============================================================================
// 7. GRÁFICO TIPO PIE
// ============================================================================
function criarGraficoPie(diasPorTipo, coresCategorias, canvasId) {
    const valores = Object.values(diasPorTipo);
    const labels = Object.keys(diasPorTipo);

    const backgroundColors = labels.map((label, idx) => {
        return valores[idx] === 0 
            ? `${coresCategorias[idx]}88` // semi-transparente se valor = 0
            : coresCategorias[idx];       // cor original se valor > 0
    });

    const dadosGraficoPie = {
        labels,
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
                // Plugin 1: desenha o ponto de interrogação no centro quando não há dados
                id: 'centroInterrogacao',
                afterDraw: function(chart) {
                    const total = valores.reduce((a, b) => a + b, 0);
                    if (total === 0) {
                        const ctx = chart.ctx;
                        const { width, height } = chart;
                        ctx.save();

                        const raioPercent = 0.48;
                        const deslocX = -45;
                        const deslocY = 0;
                        const tamanhoInterrogacao = Math.min(width, height) * 0.25;
                        const centerX = width / 2 + deslocX;
                        const centerY = height / 2 + deslocY;

                        const radius = Math.min(width, height) * raioPercent;
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                        ctx.fillStyle = "rgba(0,0,0,0.15)";
                        ctx.fill();

                        ctx.fillStyle = "#000";
                        ctx.font = `bold ${tamanhoInterrogacao}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('?', centerX, centerY);

                        ctx.restore();
                    }
                }
            },
            {
                // Plugin 2: adiciona texto "(Dias por Mês)" a meio do gráfico
                id: 'textoTopo',
                afterDraw: (chart) => {
                    const { ctx, chartArea } = chart;
                    ctx.save();
                    ctx.fillStyle = '#000';
                    ctx.textAlign = 'center';
                    ctx.font = 'bold 13px Arial';
                    ctx.fillText('(Dias / Mês)', 
                        (chartArea.left + chartArea.right) / 0.82, 
                        chartArea.bottom - 110
                    );
                    ctx.restore();
                }
            }
        ],
        options: {
            responsive: false,
            maintainAspectRatio: false,
            parsing: false,
            layout: { padding: { right: -10 } }, // empurra o gráfico para longe da legenda
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
                                color: "transparent",
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
                    formatter: (value) => value === 0 ? '' : Number(value).toFixed(1),
                    anchor: 'center',
                    align: 'center',
                    offset: 0
                },
                tooltip: { enabled: false }
            }
        }
    };

    // Instancia o gráfico
    return new Chart(document.getElementById(canvasId), configGraficoPie);
}

// ============================================================================
// 8. GRÁFICO TIPO BARRAS
// ============================================================================
function criarGraficoBar(diasNenhumTecnico, diasApenas1Tecnico, diasApenas2Tecnicos, diasMais2Tecnicos, diasFeriadoComTec, diasSabadoComTec, diasDomingoComTec, canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["0*", "1", "2", "3+", "F.", "S.", "D."],
            datasets: [{
                label: "Dias/Mês",
                data: [diasNenhumTecnico, diasApenas1Tecnico, diasApenas2Tecnicos, diasMais2Tecnicos, diasFeriadoComTec, diasSabadoComTec, diasDomingoComTec],
                backgroundColor: [
                    "#EC432B", // 0*
                    "#FF9300", // 1
                    "#01B101", // 2
                    "#0096FF", // 3+
                    "#C70039", // Feriado
                    "#F4D03F", // Sábado
                    "#884EA0"  // Domingo
                ],
                borderColor: "#000",
                borderWidth: 1
            }]
        },
        plugins: [ChartDataLabels,
            {
                id: 'textoRodape',
                afterDraw: (chart) => {
                    const { ctx, chartArea } = chart;
                    ctx.save();
                    ctx.font = '10px Arial'; // Tamanho ajustável
                    ctx.fillStyle = '#000';
                    ctx.textAlign = 'center';
                    ctx.fillText('* Excluindo Feriados e Fins de Semana', 
                        (chartArea.left + chartArea.right) / 1.75, 
                        chartArea.bottom - 105 // Ajusta distância abaixo do gráfico
                    );
                    ctx.restore();
                }
            }
        ],
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: "", font: { size: 14, weight: "bold" } },
                datalabels: {
    			color: '#000',
			    font: { size: 16, weight: 'bold' },
			    formatter: v => v === 0 ? '' : Math.round(v),
			    anchor: 'end',   // sempre acima da barra
    			align: 'end',    // sempre acima da barra
    			offset: 1        // espaço entre a barra e o número
			    
			},
                tooltip: { enabled: false }
            },
            scales: {
                x: {
                    ticks: { font: { size: 16, weight: 'normal' }, color: "#000" },
                    categoryPercentage: 0.3,
                    barPercentage: 0.6
                },
                y: {
                    type: 'linear',
                    beginAtZero: true,
                    min: 0,
                    max: 25,
                    grace: 0,
                    ticks: { stepSize: 5, autoSkip: false, callback: v => v, font: { size: 14 }, color: "#000" },
                    grid: { drawBorder: true, color: "#aaa" }
                }
            },
            layout: {
                padding: { bottom: 0 } // espaço para a frase
            }
        }
    });
}

// ============================================================================
// 9. FUNÇÃO DE APLICAÇÃO DE ESTILOS
//     Ajustar o Tamanho dos Dias Escritos nos Meses e Respectivas Bolas
// ============================================================================
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

// ============================================================================
// 10. FUNÇÃO DE APLICAÇÃO DE ESTILOS
//     Criação das Bolas das Tarefas Dentro de Cada Mês
//
//     Argumentos de entrada: tarefa, tecnico, tipoInfo
// 	   Retorna: { bola }
// ============================================================================
function criaBolaTarefa(tarefa, tecnico, tipoInfo) {
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

    // Popup com resumo da tarefa (mouse hover bola tarefa)
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
    
    // Retorna a bola criada
    return bola;
}

// ============================================================================
// 11. FUNÇÃO DE APLICAÇÃO DE ESTILOS
//     Cria o botão de abertura do popup Gantt (ícone tipo "olho") e o popup vazio
//
//     Argumentos de entrada: divMes (elemento do mês onde o botão será inserido), titleColor, backgroundBotaoStats
//     Função Externa Invocada: ajustarAlturaNecessáriaPopupGantt
// 	   Retorna: { ganttBtn, ganttPopup2, ganttContent, botaoStats }
// ============================================================================
function criaBotaoGantt(divMes, titleColor, backgroundBotaoStats) {
    // --- Botão GANTT (criação do ícone tipo olho) ---
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

    // Container interno do popup
    const ganttContent = document.createElement("div");
    ganttContent.style.boxSizing = "border-box";
    ganttContent.style.paddingBottom = "10px";
    ganttPopup2.appendChild(ganttContent);

    // === Botão STATS dentro do popup (expande e insere estatísticas) ===
    let popupExpanded = false;
    const botaoStats = document.createElement("button");
    if (typeof emularCliqueEmToque === "function") emularCliqueEmToque(botaoStats);
    botaoStats.textContent = "STATS";
    botaoStats.style.position = "absolute";
    botaoStats.style.bottom = "10px";
    botaoStats.style.right = "10px";
    botaoStats.style.padding = "2px 4px";
    botaoStats.style.backgroundColor = titleColor;
    botaoStats.style.color = backgroundBotaoStats;
    botaoStats.style.border = `1px solid ${backgroundBotaoStats}`;
    botaoStats.style.borderRadius = "3px";
    botaoStats.style.cursor = "pointer";
    botaoStats.style.fontWeight = "bold";
    botaoStats.style.zIndex = "2100";
    ganttPopup2.appendChild(botaoStats);
    
	 // Ajusta altura inicial
	ajustarAlturaNecessáriaPopupGantt(ganttPopup2, 100, dados.tecnicos.length);
    
    // Retorna referências úteis
    return { ganttBtn, ganttPopup2, ganttContent, botaoStats };
}

// ============================================================================
// 12. FUNÇÃO DE APLICAÇÃO DE ESTILOS
// 	   Cria a tabela e cabeçalhos da secção de estatísticas 
//
// 	   Argumentos de entrada: 	ganttPopup2 (elemento principal), ganttContent (container interno do conteúdo), chartInstance,
//   							titleColor, tableborder, backgroundTableHeadersStats (cores de estilo)
//								ano, mes, dados (dados do calendário, para cálculo de dias úteis)
// 	   Retorna: 				objeto { tituloStats, tabela, tbody }
// ============================================================================
function criarTabelaEstatisticas( ganttPopup2, ganttContent, chartInstance, titleColor, tableborder, backgroundTableHeadersStats, ano, mes, dados) {
    const larguraDiaInteiro = 25;
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    let totalDias = 31;
    
    // ================= CRIAÇÃO DE UMA TABELA PARA MOSTRAR E FIXAR A LEGENDAGEM DO MAPA MENSAL, A MENÇÃO DE ESTATISTICAS E A LINHA SEPARADORA =================
    const linhasPadding = "2px"; // Padding para as linhas da tabela estatísticas
    const tituloStats = document.createElement("div");
    tituloStats.id = "gantt-estatisticas-title";
    tituloStats.style.color = titleColor;
    tituloStats.style.marginTop = "10px";
    tituloStats.style.fontWeight = "bold";
    tituloStats.style.textAlign = "left";
    tituloStats.style.width = "995px"; // largura fixa
    tituloStats.style.tableLayout = "fixed"; // respeitar larguras e alturas fixas

    // ====== TABELA DE UMA COLUNA (título) ======
    const tabelaTitulo = document.createElement("table");
    //tabelaTitulo.style.width = "100%";
    tabelaTitulo.style.borderCollapse = "collapse";
    tabelaTitulo.style.marginTop = "30px";

    // ====== LINHA ÚNICA ======
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.style.textAlign = "left";
    td.style.verticalAlign = "middle";
    td.style.padding = "4px 0px 4px 0px";
    td.style.width = `${larguraColInterventor + totalDias * (larguraDiaInteiro + 0.95)}px`;          // define o comprimento da linha
	td.style.display = "inline-block"; // necessário para a largura funcionar
    td.style.borderBottom = "1.5px solid #000"; // LINHA INFERIOR VISIVEL...

    // ----- TEXTO -----
    const texto = document.createElement("div");
    texto.textContent = "ESTATÍSTICAS:";
    texto.style.fontWeight = "bold";
    texto.style.fontSize = "14px";
    texto.style.color = titleColor;
    texto.style.margin = "0"; // sem margens extras

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
        `${larguraColInterventor-5}px`, // INTERVENTOR
        "50px",  // Total úteis
        "160px", // Trabalhados
        "55px",  // Férias
        "80px",  // Faltas
        "100px", // Disponíveis
        "110px", // Taxa Ocupacional
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
    thDias.colSpan = 5;
    thDias.style.border = `1px solid ${tableborder}`;
    thDias.style.backgroundColor = backgroundTableHeadersStats;
    thDias.style.padding = linhasPadding;
    thDias.style.fontSize = "13px";
    thDias.style.textAlign = "center";
    trHead1.appendChild(thDias);

    // Outros headers
    const outrosHeaders = ["Trabalhou<br>Vs Faltas", "Intervenções <br>Agendadas", "Agenda com<br>Sobreposição"];
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
	const subHeaders = [
    	"Total<sup>*</sup>",
    	"Dias Trabalhados <br>(2ª-6ª + Fer. + FdS)",
    	"Férias",
    	"Faltas &<br>Ausências",
    	"Disponíveis <br>(dias úteis)"
	];

	subHeaders.forEach(sh => {
	    const th = document.createElement("th");
	    th.style.border = `1px solid ${tableborder}`;
	    th.style.backgroundColor = backgroundTableHeadersStats;
	    th.style.padding = "3px";
	    th.style.fontSize = "13px";
	    th.style.textAlign = "center";

	    // --- Cabeçalho especial para "Dias Trabalhados" ---
	    if (sh.includes("Dias Trabalhados")) {
	        const container = document.createElement("div");
	        container.style.display = "flex";
	        container.style.justifyContent = "space-evenly";
	        container.style.alignItems = "center";
 	       container.style.width = "100%";
 	       container.style.gap = "8px";

  	      // Cria subheaders internos
    	    const col1 = document.createElement("div");
    	    col1.textContent = "2ª–6ª";
	        col1.style.flex = "1";
 	       col1.style.fontWeight = "bold";

 	       const col2 = document.createElement("div");
    	    col2.textContent = "Fer.";
	        col2.style.flex = "1";
    	    col2.style.fontWeight = "bold";

 	       const col3 = document.createElement("div");
    	    col3.textContent = "FdS";
        	col3.style.flex = "1";
	        col3.style.fontWeight = "bold";

    	    // Título superior
        	const titulo = document.createElement("div");
  	      	titulo.innerHTML = "Dias Trabalhados";
	        titulo.style.marginBottom = "4px";
    	    titulo.style.fontSize = "13px";
        	titulo.style.fontWeight = "bold";

	        // Junta tudo
    	    th.appendChild(titulo);
        	container.appendChild(col1);
	        container.appendChild(col2);
    	    container.appendChild(col3);
        	th.appendChild(container);
	    } else {
 	       th.innerHTML = sh;
 	   }

 	   trHead2.appendChild(th);
	});

	thead.appendChild(trHead2);
	tabela.appendChild(thead);

    // ---------- CRIA O TBODY E DEVOLVE-O (sem anexar ao DOM) ----------
    const tbody = document.createElement("tbody");

    // Retorna os elementos para o caller preencher e anexar
    return { tituloStats, tabela, tbody };
}
   
   
// ============================================================================
// 13. FUNÇÃO DE APLICAÇÃO DE ESTILOS
// 	   Cria linhas na tabela de estatísticas (por cada interventor)
//
// 	   Argumentos de entrada: 	tecnico, diasDisponiveis, diasTrabalhadosSemana, diasTrabalhadosFeriados, 
//								diasTrabalhadosFimdeSemana, diasFerias, diasFaltas, diasNaoTrabalhados, 
//								taxaOcupacao, taxaFaltas, tarefasTecnico, totalSobreposicoes, tableborder (cor de estilo)
// 	   Retorna: 				objeto { tr }
// ============================================================================
function criarLinhaTabelaEstatisticas(
    tecnico, diasDisponiveis, diasTrabalhadosSemana, diasTrabalhadosFeriados,
    diasTrabalhadosFimdeSemana, diasFerias, diasFaltas, diasNaoTrabalhados,
    taxaOcupacao, taxaFaltas, tarefasTecnico, totalSobreposicoes, tableborder,idx
) {
    // ===== Cria linha =====
    const tr = document.createElement("tr");

    // ===== COR DE FUNDO ALTERNADA =====
    const backgroundPopupClaro = "#f2f2f2";          // tom ligeiramente mais escuro
    tr.style.backgroundColor = idx % 2 === 0 ? backgroundPopupClaro : backgroundPopup;

    // ===== Nome do técnico =====
    const tdNome = document.createElement("td");
    tdNome.textContent = tecnico.nome;
    tdNome.style.border = `1px solid ${tableborder}`;
    tdNome.style.padding = "2px 10px";
    tdNome.style.fontWeight = "bold";
    tdNome.style.fontSize = "13px";
    tdNome.style.textAlign = "right";
    tdNome.style.whiteSpace = "nowrap";
    tr.appendChild(tdNome);

    // ===== Colunas Dias =====
    const tdDiasDisponiveis = document.createElement("td");
    tdDiasDisponiveis.textContent = diasDisponiveis.toFixed(1);
    tdDiasDisponiveis.style.border = `1px solid ${tableborder}`;
    tdDiasDisponiveis.style.textAlign = "center";
    tdDiasDisponiveis.style.fontSize = "13px";
    tr.appendChild(tdDiasDisponiveis);

    const tdDiasTrabalhados = document.createElement("td");
	tdDiasTrabalhados.style.border = `1px solid ${tableborder}`;
	tdDiasTrabalhados.style.textAlign = "center";
	tdDiasTrabalhados.style.fontSize = "13px";
	tdDiasTrabalhados.style.padding = "0";

	// Cria um container para dividir os 3 valores
	const container = document.createElement("div");
	container.style.display = "flex";
	container.style.justifyContent = "space-evenly";
	container.style.alignItems = "center";
	container.style.width = "100%";
	container.style.border = "none"; // sem linha interna

	// Subcolunas sem linhas
	const col1 = document.createElement("div");
	col1.textContent = diasTrabalhadosSemana.toFixed(1);
	col1.style.paddingRight = "14px";
	col1.style.textAlign = "right";
	col1.style.flex = "1";
	col1.style.borderRight = "none";

	const col2 = document.createElement("div");
	col2.textContent = diasTrabalhadosFeriados.toFixed(1);
	col2.style.paddingRight = "14px";
	col2.style.textAlign = "right";
	col2.style.flex = "1";
	col2.style.borderRight = "none";

	const col3 = document.createElement("div");
	col3.textContent = diasTrabalhadosFimdeSemana.toFixed(1);
	col3.style.paddingRight = "14px";
	col3.style.textAlign = "right";
	col3.style.flex = "1";

	// Junta tudo
	container.appendChild(col1);
	container.appendChild(col2);
	container.appendChild(col3);
	tdDiasTrabalhados.appendChild(container);
	tr.appendChild(tdDiasTrabalhados);

    const tdDiasFerias = document.createElement("td");
    tdDiasFerias.textContent = diasFerias.toFixed(1);
    tdDiasFerias.style.border = `1px solid ${tableborder}`;
    tdDiasFerias.style.textAlign = "center";
    tdDiasFerias.style.fontSize = "13px";
    tr.appendChild(tdDiasFerias);

    const tdDiasFaltas = document.createElement("td");
    tdDiasFaltas.textContent = diasFaltas.toFixed(1);
    tdDiasFaltas.style.border = `1px solid ${tableborder}`;
    tdDiasFaltas.style.textAlign = "center";
    tdDiasFaltas.style.fontSize = "13px";
    tr.appendChild(tdDiasFaltas);

    const tdDiasNaoTrabalhados = document.createElement("td");
    tdDiasNaoTrabalhados.textContent = (diasNaoTrabalhados - diasFaltas + diasTrabalhadosFimdeSemana).toFixed(1);
    tdDiasNaoTrabalhados.style.border = `1px solid ${tableborder}`;
    tdDiasNaoTrabalhados.style.textAlign = "center";
    tdDiasNaoTrabalhados.style.fontSize = "13px";
    tr.appendChild(tdDiasNaoTrabalhados);

    // ===== Taxa Ocupacional =====
    const tdTaxa = document.createElement("td");
    tdTaxa.style.border = `1px solid ${tableborder}`;
    tdTaxa.style.textAlign = "center";
    tdTaxa.style.fontSize = "13px";
    //tr.appendChild(tdTaxa);*/
    
    // Cria um container para dividir os 3 valores
	const container2 = document.createElement("div");
	container2.style.display = "flex";
	container2.style.justifyContent = "space-evenly";
	container2.style.alignItems = "center";
	container2.style.width = "100%";
	container2.style.border = "none"; // sem linha interna

	// Subcolunas sem linhas
	const col4 = document.createElement("div");
	col4.textContent = `${taxaOcupacao}%`;
	col4.style.paddingRight = "10px";
	col4.style.textAlign = "right";
	col4.style.flex = "1";
	col4.style.borderRight = "none";

	const col5 = document.createElement("div");
	col5.textContent = `${taxaFaltas}%`;
	col5.style.paddingRight = "10px";
	col5.style.textAlign = "right";
	col5.style.flex = "1";
	col5.style.borderRight = "none";
	
	// Junta tudo
	container2.appendChild(col4);
	container2.appendChild(col5);
	tdTaxa.appendChild(container2);
	tr.appendChild(tdTaxa);

    // ===== Intervenções Agendadas (excluindo férias e ausências) =====
    const tdIntervencoes = document.createElement("td");
    tdIntervencoes.textContent = tarefasTecnico.filter(t => !["férias", "ausência"].includes(t.tipo.toLowerCase())).length;
    tdIntervencoes.style.border = `1px solid ${tableborder}`;
    tdIntervencoes.style.textAlign = "center";
    tdIntervencoes.style.fontSize = "13px";
    tr.appendChild(tdIntervencoes);

    // ===== Sobreposições =====
	const tdSobreposicoes = document.createElement("td");
	tdSobreposicoes.style.border = `1px solid ${tableborder}`;
	tdSobreposicoes.style.textAlign = "center";
	tdSobreposicoes.style.fontSize = "13px";
	tdSobreposicoes.style.position = "relative"; // necessário para o círculo por trás

	tdSobreposicoes.textContent = totalSobreposicoes || 0;

	// Se houver sobreposição, adiciona círculo por trás do texto
	if (totalSobreposicoes > 0) {
	    const circulo = document.createElement("span");
	    circulo.style.position = "absolute";
	    circulo.style.top = "50%";
	    circulo.style.left = "50%";
 	   	circulo.style.transform = "translate(-50%, -50%)";
	    circulo.style.width = "16px";
	    circulo.style.height = "16px";
	    circulo.style.borderRadius = "50%";
	    circulo.style.border = "2px solid red"; // círculo vermelho transparente
    	circulo.style.backgroundColor = "transparent";
	    tdSobreposicoes.appendChild(circulo);

   		 // Fundo ligeiramente amarelado para toda a linha
    	tr.style.backgroundColor = "#fff8d1"; // amarelo suave
	}

	tr.appendChild(tdSobreposicoes);

    return tr;
}

// ============================================================================
// 14. FUNÇÃO DE APLICAÇÃO DE ESTILOS
// 	   Cria tabela para a inserção de gráficos
//
// 	   Argumentos de entrada: 	ganttBtn, mes
// 	   Retorna: 				canvasIdPie, canvasIdBar
// ============================================================================
function criaTabelaGraficos(ganttContent, mes) {
    // === TABELA PRINCIPAL PARA CONTER OS GRÁFICOS ===
    const tabelaGrafico = document.createElement("table");
    tabelaGrafico.classList.add("tabelaGrafico");
    tabelaGrafico.style.borderCollapse = "collapse";
    tabelaGrafico.style.width = "922px"; // largura fixa
    tabelaGrafico.style.marginTop = "8px";
    tabelaGrafico.style.borderRadius = "3px";
    tabelaGrafico.style.marginLeft = "0";    // encosta à esquerda
    tabelaGrafico.style.marginRight = "auto"; // evita centralização

    // === Linha única ===
    const trGrafico = document.createElement("tr");

    // --- COLUNA 1: GRÁFICO PIE ---
    const tdPie = document.createElement("td");
    tdPie.classList.add("tdPie");
    tdPie.style.padding = "4px 4px 2px 4px";
    tdPie.style.width = "270px";
    tdPie.style.minWidth = "270px";
    tdPie.style.maxWidth = "270px";
    tdPie.style.maxHeight = "190px";
    tdPie.style.textAlign = "center";
    tdPie.style.verticalAlign = "top";
    tdPie.innerHTML = "TIPOS DE INTERVENÇÃO";
    tdPie.style.fontWeight = "bold";
    tdPie.style.border = "2px solid #444";

    const canvasPie = document.createElement("canvas");
    const canvasIdPie = `graficoPizza-${mes}`;
    canvasPie.id = canvasIdPie;
    canvasPie.width = 270;
    canvasPie.height = 160;
    canvasPie.style.margin = "15px 10px 5px 0px"; //top right bottom left
    canvasPie.style.maxWidth = "300px";
    canvasPie.style.height = "170px";
    tdPie.appendChild(canvasPie);
    trGrafico.appendChild(tdPie);

    // --- COLUNA 2: ESPAÇADOR ---
    const tdEspaco1 = document.createElement("td");
    tdEspaco1.style.width = "20px";
    tdEspaco1.style.minWidth = "20px";
    tdEspaco1.style.maxWidth = "20px";
    tdEspaco1.style.borderTop = "none";
    tdEspaco1.style.borderBottom = "none";
    tdEspaco1.style.borderRight = "2px solid #444";
    trGrafico.appendChild(tdEspaco1);

    // --- COLUNA 3: GRÁFICO BARRAS ---
    const tdBar1 = document.createElement("td");
    tdBar1.classList.add("tdBar");
    tdBar1.style.padding = "4px 4px 2px 4px";
    tdBar1.style.width = "240px";
    tdBar1.style.minWidth = "240px";
    tdBar1.style.maxWidth = "240px";
    tdBar1.style.textAlign = "center";
    tdBar1.style.verticalAlign = "center";
    tdBar1.innerHTML = 'ALOCAÇÃO MENSAL<br><span style="font-size: 13px;">(Interventores por Dia)</span><span style="font-size: 16px;"> <br></span>';
    tdBar1.style.fontWeight = "bold";
    tdBar1.style.border = "2px solid #444";

    const canvasBar1 = document.createElement("canvas");
    const canvasIdBar1 = `graficoBar-${mes}`;
    canvasBar1.id = canvasIdBar1;
    canvasBar1.width = 250;
    canvasBar1.height = 160;
    tdBar1.appendChild(canvasBar1);
    trGrafico.appendChild(tdBar1);
    
    
    // --- COLUNA 4: ESPAÇADOR ---
    const tdEspaco2 = document.createElement("td");
    tdEspaco2.style.width = "20px";
    tdEspaco2.style.minWidth = "20px";
    tdEspaco2.style.maxWidth = "20px";
    tdEspaco2.style.borderTop = "none";
    tdEspaco2.style.borderBottom = "none";
    tdEspaco2.style.borderRight = "2px solid #444";
    trGrafico.appendChild(tdEspaco2);

    // --- COLUNA 5: GRÁFICO BARRAS ---
    const tdBar2 = document.createElement("td");
    tdBar2.classList.add("tdBar");
    tdBar2.style.padding = "4px 4px 2px 4px";
    tdBar2.style.width = "240px";
    tdBar2.style.minWidth = "240px";
    tdBar2.style.maxWidth = "240px";
    tdBar2.style.textAlign = "center";
    tdBar2.style.verticalAlign = "center";
    tdBar2.innerHTML = 'AVALIAÇÃO MENSAL<br><span style="font-size: 13px;">(Clientes)</span><span style="font-size: 16px;"> <br></span>';
    tdBar2.style.fontWeight = "bold";
    tdBar2.style.border = "2px solid #444";

    const canvasBar2 = document.createElement("canvas");
    const canvasIdBar2 = `graficoBar-${mes}`;
    canvasBar2.id = canvasIdBar2;
    canvasBar2.width = 250;
    canvasBar2.height = 160;
    tdBar2.appendChild(canvasBar2);
    trGrafico.appendChild(tdBar2);

    // === Montagem final ===
    tabelaGrafico.appendChild(trGrafico);
    ganttContent.appendChild(tabelaGrafico);

    // Retorna os IDs dos canvases para poder inicializar os gráficos
    return { canvasIdPie, canvasIdBar1, canvasIdBar2 };
}

// ============================================================================
// 15. FUNÇÃO AUXILIAR PARA CALCULAS AS ESTATISTICAS POR MÊS PARA CADA INTERVENTOR
// 	   Cria linhas na tabela de estatísticas (por cada interventor)
//
// 	   Argumentos de entrada: 	options -> options: { tecnicoNome, tarefas, feriados, mesIndex, ano, parseDateLocal }
// 	   Retorna: 				Retorna objeto com valores (todos numbers com 1 decimal já arredondado): { diasTrabalhadosSemana, diasTrabalhadosFimdeSemana, diasTrabalhadosFeriados, diasFerias, diasFaltas, diasDisponiveis }
// ============================================================================
function calcularEstatisticasTecnicoNoMes(options) {
    const { tecnicoNome, tarefas, feriados, mesIndex, ano, parseDateLocal } = options;

    const primeiroDiaMes = new Date(ano, mesIndex, 1);
    const ultimoDiaMes = new Date(ano, mesIndex + 1, 0);

    // --- Dias úteis no mês ---
    let diasUteisNoMes = 0;
    for (let d = 1; d <= ultimoDiaMes.getDate(); d++) {
        const dataAtual = new Date(ano, mesIndex, d);
        const isFimSemana = dataAtual.getDay() === 0 || dataAtual.getDay() === 6;
        const isFeriado = feriados.some(f =>
            parseInt(f.dia, 10) === d &&
            parseInt(f.mes, 10) === mesIndex + 1
        );
        if (!isFimSemana && !isFeriado) diasUteisNoMes++;
    }

    // --- Férias e ausências (dias úteis) ---
    let diasFerias = 0;
    let diasFaltas = 0;
    const tarefasFeriasAusencia = tarefas.filter(t =>
        ["férias", "ausência"].includes((t.tipo || '').toLowerCase())
    );

    tarefasFeriasAusencia.forEach(t => {
        const inicio = parseDateLocal(t.data_inicio);
        let duracaoRestante = t.duracao;
        let offset = 0;
        while (duracaoRestante > 0) {
            const fracao = duracaoRestante >= 0.5 ? 0.5 : duracaoRestante;
            const dataAtual = new Date(inicio);
            dataAtual.setDate(dataAtual.getDate() + Math.floor(offset));
            if (dataAtual.getMonth() !== mesIndex) {
                duracaoRestante -= fracao;
                offset += fracao;
                continue;
            }
            const isFimSemana = dataAtual.getDay() === 0 || dataAtual.getDay() === 6;
            const isFeriado = feriados.some(f =>
                parseInt(f.dia, 10) === dataAtual.getDate() &&
                parseInt(f.mes, 10) === mesIndex + 1
            );
            if (!isFimSemana && !isFeriado) {
                if ((t.tipo || '').toLowerCase() === "férias") diasFerias += fracao;
                else if ((t.tipo || '').toLowerCase() === "ausência") diasFaltas += fracao;
            }
            duracaoRestante -= fracao;
            offset += fracao;
        }
    });

    // --- Mapa de tranches e mapa de tarefas distintas ---
    const mapaDias = {}; // dia -> [{tarefa, fracao}]
    const mapaDiasTarefasDistintas = {}; // dia -> Set(idTarefa)

    tarefas.forEach(t => {
        const inicio = parseDateLocal(t.data_inicio);
        let duracaoRestante = t.duracao;
        let offset = 0;
        const tarefaIdBase = `${t.tipo}::${t.data_inicio}::${t.duracao}::${t.cliente || ''}`;
        while (duracaoRestante > 0) {
            const fracao = duracaoRestante >= 0.5 ? 0.5 : duracaoRestante;
            const dia = new Date(inicio);
            dia.setDate(dia.getDate() + Math.floor(offset));
            if (dia.getMonth() === mesIndex) {
                const key = dia.toISOString().slice(0,10);
                if (!mapaDias[key]) mapaDias[key] = [];
                mapaDias[key].push({ tarefa: t, fracao });
                if (!mapaDiasTarefasDistintas[key]) mapaDiasTarefasDistintas[key] = new Set();
                mapaDiasTarefasDistintas[key].add(tarefaIdBase);
            }
            duracaoRestante -= fracao;
            offset += fracao;
        }
    });

    // --- Cálculo de sobreposições ---
    let totalSobreposicoes = 0;
    Object.keys(mapaDiasTarefasDistintas).forEach(dk => {
        const n = mapaDiasTarefasDistintas[dk].size;
        if (n > 1) totalSobreposicoes += n; // soma número de tarefas distintas num mesmo dia (>1)
    });

    // --- Dias trabalhados (exclui férias/ausência) ---
    let diasTrabalhadosSemana = 0;
    let diasTrabalhadosFimdeSemana = 0;
    let diasTrabalhadosFeriados = 0;

    Object.entries(mapaDias).forEach(([diaKey, tranches]) => {
        if (!Array.isArray(tranches) || tranches.length === 0) return;
        const dataAtual = parseDateLocal(diaKey);
        const diaSemana = dataAtual.getDay();
        const ehFeriado = feriados.some(f =>
            parseInt(f.dia, 10) === dataAtual.getDate() &&
            parseInt(f.mes, 10) === mesIndex + 1
        );

        const totalFracao = tranches
            .filter(x => !["férias", "ausência"].includes((x.tarefa.tipo || '').toLowerCase()))
            .reduce((s, t) => s + t.fracao, 0);

        if (ehFeriado) diasTrabalhadosFeriados += totalFracao;
        else if (diaSemana === 0 || diaSemana === 6) diasTrabalhadosFimdeSemana += totalFracao;
        else diasTrabalhadosSemana += totalFracao;
    });

    // --- Resultado final ---
    const round1 = v => Math.round(v * 10) / 10;
    const diasDisponiveis = Math.max(0, diasUteisNoMes - diasFerias);

    return {
        tecnico: tecnicoNome,
        diasTrabalhadosSemana: round1(diasTrabalhadosSemana),
        diasTrabalhadosFimdeSemana: round1(diasTrabalhadosFimdeSemana),
        diasTrabalhadosFeriados: round1(diasTrabalhadosFeriados),
        diasFerias: round1(diasFerias),
        diasFaltas: round1(diasFaltas),
        diasDisponiveis: round1(diasDisponiveis),
        totalSobreposicoes: totalSobreposicoes
    };
}

// ============================================================================
// 16. FUNÇÃO DE APLICAÇÃO DE ESTILOS
// 	   Cria o mês em forma de mapa de gantt com inclusão de técnicos e tarefas
//
// 	   Argumentos de entrada: 	mes, ano, dados, nomesMeses, container, cores, estilos
// 	   Retorna: 				(nada)
// ============================================================================
function montarTabelaMesGantt({ mes, ano, dados, nomesMeses, container, cores, estilos }) {
    const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();
    const larguraColInterventor = 170;
    const larguraDiaInteiro = 25;
    const alturaLinha = 22;
    const alturaBarra = 16;
	const totalDias = 31;

    // Ajustes de posicionamento
    const offsetX = 24;
    const offsetY = 34;
    const incrementoVertical = 23;
    
    // Largura total
    let larguraTotalPopup = larguraColInterventor + totalDias * (larguraDiaInteiro + 1.65);

    container.style.width = `${larguraTotalPopup}px`;
    
	// === Linha de texto do título acima das tabelas ===
	const linhaTitulo = document.createElement("div");
	linhaTitulo.textContent = `MAPA DE INTERVENÇÕES - ${nomesMeses[mes].toUpperCase()}`;
	linhaTitulo.style.fontWeight = "bold";
	linhaTitulo.style.fontSize = "18px";
	linhaTitulo.style.textAlign = "center";
	linhaTitulo.style.marginBottom = "8px"; // espaçamento entre título e tabelas
	linhaTitulo.style.marginTop = "6px"; // espaçamento entre título e tabelas
	container.appendChild(linhaTitulo);

	// === Criar container flex para tabelas lado a lado ===
	const containerTabelas = document.createElement("div");
	containerTabelas.style.display = "flex";
	containerTabelas.style.flexDirection = "row";
	containerTabelas.style.alignItems = "flex-start";
	container.appendChild(containerTabelas);

	// === Primeira tabela ===
	const tabela = document.createElement("table");
	tabela.style.borderCollapse = "collapse";
	tabela.style.tableLayout = "fixed";
	tabela.style.boxSizing = "border-box";
	tabela.style.border = `2px solid ${estilos.tableborder}`;

	// Adiciona primeira tabela ao container flex
	containerTabelas.appendChild(tabela);

    // === Cabeçalho ===
    const thead = document.createElement("thead");

    const trHead = document.createElement("tr");
    const thInterventor = document.createElement("th");
    thInterventor.textContent = "INTERVENTOR";
    thInterventor.style.fontSize = "13px";
    thInterventor.style.textAlign = "right";
    thInterventor.style.padding = "4px 10px";
    thInterventor.style.boxSizing = "border-box";
    thInterventor.style.width = `${larguraColInterventor}px`;
    thInterventor.style.minWidth = `${larguraColInterventor}px`;
    thInterventor.style.maxWidth = `${larguraColInterventor}px`;
    thInterventor.style.border = `2px solid ${estilos.tableborder}`;
    thInterventor.style.borderBottom = "3px double #000";
    thInterventor.style.backgroundColor = estilos.backgroundTableHeadersMes;
    thInterventor.style.fontWeight = "bold";
    trHead.appendChild(thInterventor);

    for (let d = 1; d <= ultimoDiaMes; d++) {
        const th = document.createElement("th");
        th.textContent = d;
        th.style.fontSize = "13px";
        th.style.padding = "2px";
        th.style.height = "24px";
        th.style.width = `${larguraDiaInteiro}px`;
        th.style.minWidth = `${larguraDiaInteiro}px`;
        th.style.maxWidth = `${larguraDiaInteiro}px`;
        th.style.backgroundColor = estilos.backgroundTableHeadersMes;
        th.style.borderRight = `2px solid ${estilos.tableborder}`;
        th.style.borderBottom = "3px double #000";
        th.style.boxSizing = "border-box";
    	th.style.position = "relative"; // Garante que o cabeçalho fique sempre por cima das barras
    	th.style.zIndex = "10";
        trHead.appendChild(th);
    }


    thead.appendChild(trHead);
    tabela.appendChild(thead);

    // === Corpo ===
    const tbody = document.createElement("tbody");
    tabela.appendChild(tbody);

    // Container absoluto para retângulos de teste e tarefas
    const containerBarras = document.createElement("div");
    containerBarras.style.position = "absolute";
    containerBarras.style.top = "0";
    containerBarras.style.left = "0";
    containerBarras.style.width = `${larguraTotalPopup}px`;
    containerBarras.style.height = "100%";
    containerBarras.style.zIndex = "2"; // abaixo do cabeçalho
	tabela.style.position = "relative"; // Importante: torna a tabela um contexto de empilhamento

    
    // Permitir interação (para tooltips)
    containerBarras.style.pointerEvents = "auto";
    container.appendChild(tabela);
    container.appendChild(containerBarras);

    function corParaTranche(listaTarefas) {
        if (!listaTarefas || listaTarefas.length === 0) return null;
        if (listaTarefas.length > 1) return "#000";
        const tp = dados.tiposTarefa.find(x => x.tipo === listaTarefas[0].tipo);
        return tp?.cor ?? "#777";
    }

    // === Loop dos técnicos ===
 	dados.tecnicos.forEach((tecnico, idxTec) => {
		const tr = document.createElement("tr");

	    // === Coluna Interventor ===
    	const tdNome = document.createElement("td");
	    tdNome.textContent = tecnico.nome;
	    tdNome.style.width = `${larguraColInterventor}px`;
	    tdNome.style.minWidth = `${larguraColInterventor}px`;
	    tdNome.style.maxWidth = `${larguraColInterventor}px`;
	    tdNome.style.whiteSpace = "nowrap";
	    tdNome.style.overflow = "visible";
	    tdNome.style.textAlign = "right";
	    tdNome.style.fontWeight = "bold";
	    tdNome.style.fontSize = "13px";
	    tdNome.style.padding = "2px 10px";
	    tdNome.style.borderRight = `2px solid ${estilos.tableborder}`;
	    tdNome.style.borderBottom = `1px dashed ${estilos.tableLine}`;
	    tdNome.style.backgroundColor = estilos.backgroundTableHeadersStats;
	    tdNome.style.color = "#000";
	    tr.appendChild(tdNome);

		/// Função auxiliar para determinar a cor de cada dia
		function obterCorDia(dataAtual, tecnico, dados, cores) {
		    // 0 = domingo, 6 = sábado
		    const diaSemana = dataAtual.getDay(); 
		    const isFimSemana = diaSemana === 0 || diaSemana === 6;

		    // Verifica se o dia é feriado
		    const feriado = dados.feriados.some(f =>
		        parseInt(f.dia, 10) === dataAtual.getDate() &&
		        parseInt(f.mes, 10) === dataAtual.getMonth() + 1 &&
		        (!f.ano || parseInt(f.ano, 10) === dataAtual.getFullYear())
		    );

		    // Verifica se existe tarefa nesse dia para o técnico
		    const temTarefa = dados.tarefas.some(t => {
		        if (t.tecnico !== tecnico.nome) return false;
		        const [anoIni, mesIni, diaIni] = t.data_inicio.split("-").map(Number);
		        const inicio = new Date(anoIni, mesIni - 1, diaIni);
 		       	const fim = new Date(inicio);
 		       	fim.setDate(fim.getDate() + t.duracao - 1);
 	       		// O dia atual está dentro do intervalo da tarefa?
 	       		return dataAtual.getTime() >= inicio.getTime() && dataAtual.getTime() <= fim.getTime();
 	   		});

 	   		// Determina a cor final
	    	if ((feriado || isFimSemana) && temTarefa) return cores.tarefafsdColor;
 	   		if (feriado) return cores.feriadoColor;
	    	if (isFimSemana) return cores.fdsColor;
	    	return cores.basicColor;
		}

		// === Colunas de dias ===
		for (let d = 1; d <= ultimoDiaMes; d++) {  // Começa em 1
	    	const dataAtual = new Date(ano, mes, d);
	    	const td = document.createElement("td");

 	   		// Define cor de fundo usando a função
 	   		td.style.backgroundColor = obterCorDia(dataAtual, tecnico, dados, cores);
	
    		td.style.height = `${alturaLinha}px`;
 	   		td.style.width = `${larguraDiaInteiro}px`;
	    	td.style.minWidth = `${larguraDiaInteiro}px`;
	    	td.style.maxWidth = `${larguraDiaInteiro}px`;
	    	td.style.borderRight = `1px solid ${estilos.tableborder}`;
	    	td.style.borderBottom = "1px dashed #808080";
	    	td.style.padding = "0";
	    	td.style.position = "relative";
	
	    	tr.appendChild(td);
		}
    	tbody.appendChild(tr);

    	// === Matriz de tranchas (2 por dia) ===
    	const tranchasMes = Array.from({ length: ultimoDiaMes * 2 }, () => []);

    	// === Preencher tranchas ===
    	// === Preencher tranchas (corrigido para meses seguintes) ===
		dados.tarefas
    		.filter(t => t.tecnico === tecnico.nome)
    		.forEach(t => {
        		const [anoIni, mesIni, diaIni] = t.data_inicio.split("-").map(Number);
        		let inicioOriginal = new Date(anoIni, mesIni - 1, diaIni);
 	    	   	let fimOriginal = new Date(inicioOriginal);
    	    	fimOriginal.setDate(fimOriginal.getDate() + t.duracao - 1);

	        	// Determinar o início e fim dentro do mês atual
    	    	const inicioMes = inicioOriginal < new Date(ano, mes, 1) ? new Date(ano, mes, 1) : inicioOriginal;
        		const fimMes = fimOriginal > new Date(ano, mes, ultimoDiaMes) ? new Date(ano, mes, ultimoDiaMes) : fimOriginal;

		       	if (fimMes < new Date(ano, mes, 1) || inicioMes > new Date(ano, mes, ultimoDiaMes)) return;

        		// === CALCULAR TRANCHES RESTANTES ===
        		const diasJaPassados = inicioMes > inicioOriginal
            		? Math.floor((inicioMes - inicioOriginal) / (1000*60*60*24))
            		: 0;

 	    	   	const diasRestantes = t.duracao - diasJaPassados;
    	    	const duracaoTranches = diasRestantes * 2; // 2 tranches por dia
        		const diaInicio = inicioMes.getDate();

  		      	for (let i = 0; i < duracaoTranches; i++) {
        	    	const trancheIdx = (diaInicio - 1) * 2 + i;
            		if (trancheIdx >= 0 && trancheIdx < ultimoDiaMes * 2) {
                		tranchasMes[trancheIdx].push(t);
 	           		}
    	    	}
    	});
    
    	// === Converter tranchas consecutivas com mesma cor em blocos ===
    	let i = 0;
    	while (i < tranchasMes.length) {
        	const tranche = tranchasMes[i];
        	if (!tranche || tranche.length === 0) {
            	i++;
            	continue;
        	}

        	const corAtual = tranche.length > 1
            	? "#000"
            	: (dados.tiposTarefa.find(tp => tp.tipo === tranche[0].tipo)?.cor ?? "#777");
        	const sobreposicaoAtual = tranche.length > 1;
        	let mostrarInterrogacao = sobreposicaoAtual;

        	let span = 1;
        	while (
            	i + span < tranchasMes.length &&
            	tranchasMes[i + span] &&
            	tranchasMes[i + span].length > 0
        	) {
            	const prox = tranchasMes[i + span];
            	const corProx = prox.length > 1
                	? "#000"
                	: (dados.tiposTarefa.find(tp => tp.tipo === prox[0].tipo)?.cor ?? "#777");
            	if (corProx !== corAtual) break;
            	if (prox.length > 1) mostrarInterrogacao = true;
            	span++;
        	}

        	// === Detectar tranchas vizinhas ===
        	const trancheAntes = tranchasMes[i - 1];
        	const trancheDepois = tranchasMes[i + span];
        	const corAntes = trancheAntes?.length
            	? (trancheAntes.length > 1 ? "#000" : (dados.tiposTarefa.find(tp => tp.tipo === trancheAntes[0].tipo)?.cor ?? "#777"))
            	: null;
        	const corDepois = trancheDepois?.length
            	? (trancheDepois.length > 1 ? "#000" : (dados.tiposTarefa.find(tp => tp.tipo === trancheDepois[0].tipo)?.cor ?? "#777"))
            	: null;

        	const sobreposicaoAntes = corAntes === "#000";
        	const sobreposicaoDepois = corDepois === "#000";

        	// === Posição e dimensões ===
        	const diaBase = Math.floor(i / 2);
        	const leftPos = larguraColInterventor + diaBase * larguraDiaInteiro + offsetX + diaBase;
        	const topBarPos = offsetY + idxTec * incrementoVertical;
        	const larguraTranche = larguraDiaInteiro / 2;
        	const larguraTotal = span * larguraTranche - 1; // reduz em 1px (context menor)

        	// === Criar barra ===
        	const divBarra = document.createElement("div");
        	divBarra.style.position = "absolute";
        
        	divBarra.style.display = "flex";
			divBarra.style.alignItems = "center";     // centraliza verticalmente
			divBarra.style.justifyContent = "center"; // centraliza horizontalmente
			divBarra.style.textAlign = "center";
        
        	// Ajusta sobreposições
        	if (mostrarInterrogacao) {
            	divBarra.style.top = `${topBarPos - 2}px`;
            	divBarra.style.zIndex = "5"; // sobreposições - acima de tudo
        		divBarra.style.left = `${leftPos + (i % 2) * larguraTranche - 1}px`;
        		divBarra.style.height =  `${alturaBarra + 3 }px`; 
        		divBarra.style.width = `${larguraTotal + span/2 + 4}px`;
        		divBarra.style.borderLeft = "1"; 
        		divBarra.style.borderRight = "1"; 
        	}
        	// Ajusta tarefas
        	else {
        		divBarra.style.top = `${topBarPos}px`;
        		divBarra.style.zIndex = "3"; // tarefas normais - acima do fundo, abaixo do cabeçalho
        		divBarra.style.left = `${leftPos + (i % 2) * larguraTranche}px`;
        		divBarra.style.width = `${larguraTotal + span/2-1}px`;
        		divBarra.style.height = `${alturaBarra - 1}px`; // reduz altura ligeiramente
        	}
        
        	divBarra.style.backgroundColor = corAtual;
        	divBarra.style.boxShadow = "2px 2px 4px rgba(80,80,80,0.8)";
        	divBarra.style.border = "0.5px solid #000";
        
        	// === Texto para "?" para sobreposições) ===
        	divBarra.style.color = "#fff";
        	divBarra.style.fontWeight = "bold";
        	divBarra.style.lineHeight = `${alturaBarra - 1}px`;
        	divBarra.style.fontSize = "18px";
			divBarra.textContent = mostrarInterrogacao ? "?" : "";

			// === Verificar se é a última tranche antes do próximo mês (">>") ou a primeira ("<<") ===
			const tarefaAtual = tranche.length === 1 ? tranche[0] : null;
			if (tarefaAtual && corAtual !== "#000") {
    			const [anoIni, mesIni, diaIni] = tarefaAtual.data_inicio.split("-").map(Number);
    			const inicioOriginal = new Date(anoIni, mesIni - 1, diaIni);
	    		const fimOriginal = new Date(inicioOriginal);
	    		fimOriginal.setDate(fimOriginal.getDate() + tarefaAtual.duracao - 1);

	    		const ultimoDiaMesAtual = new Date(ano, mes, ultimoDiaMes);

	    		// Se termina depois do mês atual → tarefa continua no próximo mês
	    		const continuaProximoMes = fimOriginal > ultimoDiaMesAtual;
	
   			 	// Se começou antes do mês atual → veio do mês anterior
    			const veioMesAnterior = inicioOriginal < new Date(ano, mes, 1);

	    		// === Criar seta visual ("<<" ou ">>") apenas na primeira/última tranche ===
    			const primeiraTrancheMes = Math.floor(i / 2) === 0;
    			const ultimaTrancheMes = Math.floor((i + span) / 2) >= ultimoDiaMes;

    			if ((continuaProximoMes && ultimaTrancheMes) || (veioMesAnterior && primeiraTrancheMes)) {
	        		const seta = document.createElement("span");
    	    		seta.style.position = "absolute";
        			seta.style.top = "0";
        			seta.style.fontWeight = "bold";
        			seta.style.color = "#000";
	        		seta.style.fontSize = "16px";
    	    		seta.style.lineHeight = `${alturaBarra - 1}px`;

        			if (continuaProximoMes && ultimaTrancheMes) {
            			seta.textContent = ">>";
            			seta.style.right = "2px";
        			}
        			if (veioMesAnterior && primeiraTrancheMes) {
            			seta.textContent = "<<";
            			seta.style.left = "2px";
        			}
        			divBarra.appendChild(seta);
    			}
			}

        	// === Bordas arredondadas / retas ===
        	const ladoEsqAdjacente = (sobreposicaoAntes && corAtual !== "#000") || (sobreposicaoAtual && corAntes && corAntes !== "#000");
        	const ladoDirAdjacente = (sobreposicaoDepois && corAtual !== "#000") || (sobreposicaoAtual && corDepois && corDepois !== "#000");

	        divBarra.style.borderTopLeftRadius = (ladoEsqAdjacente || i === 0) ? "0px" : "4px";
    	    divBarra.style.borderBottomLeftRadius = (ladoEsqAdjacente || i === 0) ? "0px" : "4px";
        	divBarra.style.borderTopRightRadius = (ladoDirAdjacente || i + span === tranchasMes.length) ? "0px" : "4px";
	        divBarra.style.borderBottomRightRadius = (ladoDirAdjacente || i + span === tranchasMes.length) ? "0px" : "4px";

    	    // === Remover bordas comuns (ambos lados retos) ===
        	if (ladoEsqAdjacente) divBarra.style.borderLeft = "0";
	        if (ladoDirAdjacente) divBarra.style.borderRight = "0";

        	// === TOOLTIPS CUSTOMIZADO ===
			let tarefasSpan = [];
			for (let k = 0; k < span; k++) {
			    tranchasMes[i + k].forEach(tt => {
			        if (!tarefasSpan.includes(tt)) tarefasSpan.push(tt);
			    });
			}

			const sobreposicao = tarefasSpan.length > 1;

			// Cria tooltip (uma vez)
			let tooltip = document.createElement("div");
			tooltip.className = "tooltip-gantt";
			tooltip.style.position = "absolute";
			tooltip.style.backgroundColor = "rgba(0,0,0,0.8)";
			tooltip.style.color = "#fff";
			tooltip.style.padding = "4px 8px";
			tooltip.style.borderRadius = "4px";
			tooltip.style.fontSize = "13px";
			tooltip.style.pointerEvents = "none";
			tooltip.style.whiteSpace = "pre";
			tooltip.style.display = "none";
			tooltip.style.zIndex = "10000";
			document.body.appendChild(tooltip);

			// Texto do tooltip
			const textoTooltip = tarefasSpan.map(tt => {
			    return sobreposicao
			        ? `${tt.cliente} (${tt.tipo}): ${tt.duracao} dia(s)`
			        : `${tt.cliente}: ${tt.duracao} dia(s)`;
			}).join("\n");

			// Função de mostrar tooltip
			function showTooltip(e) {
			    tooltip.textContent = textoTooltip;
 			   	tooltip.style.display = "block";

    			if (e.pointerType === "touch" || e.pointerType === "pen") {
        			const rect = divBarra.getBoundingClientRect();
        			tooltip.style.left = rect.left + window.scrollX + rect.width / 2 + "px";
        			tooltip.style.top = rect.top + window.scrollY - 30 + "px";

        			// Remove após 3 segundos
        			setTimeout(() => {
            			tooltip.style.display = "none";
        			}, 3000);
    			} else { // mouse
        			tooltip.style.left = e.pageX + 10 + "px";
        			tooltip.style.top = e.pageY + 10 + "px";
    			}
			}

			// Eventos
			divBarra.addEventListener("mouseenter", showTooltip); // desktop
			divBarra.addEventListener("mousemove", showTooltip);  // atualiza posição
			divBarra.addEventListener("mouseleave", () => { tooltip.style.display = "none"; });
			divBarra.addEventListener("pointerdown", showTooltip); // touch

			
        	containerBarras.appendChild(divBarra);
        i += span;
	    }
	});
	
	// Criar um container flex para as duas tabelas
	const tabelasWrapper = document.createElement("div");
	tabelasWrapper.style.display = "flex";
	tabelasWrapper.style.flexDirection = "row";
	tabelasWrapper.style.alignItems = "flex-start"; // alinha pelo topo
	tabelasWrapper.style.gap = "0"; // sem espaço entre elas

	// Adiciona a primeira tabela e o overlay de barras
	const tabelaWrapper = document.createElement("div");
	tabelaWrapper.style.position = "relative"; // para o containerBarras
	tabelaWrapper.appendChild(tabela);
	tabelaWrapper.appendChild(containerBarras);

	tabelasWrapper.appendChild(tabelaWrapper);

	// Adiciona a segunda tabela
	if (ultimoDiaMes < totalDias) {
	    const tabelaContinuidade = document.createElement("table");
	    tabelaContinuidade.style.borderCollapse = "collapse";
	    tabelaContinuidade.style.tableLayout = "fixed";
	    tabelaContinuidade.style.boxSizing = "border-box";
	    tabelaContinuidade.style.borderRight = `2px solid rgba(85,91,95,0.3)`;
		tabelaContinuidade.style.borderBottom = `2px solid rgba(85,91,95,0.3)`;

	    // Cabeçalho da segunda tabela
 	   	const thead2 = document.createElement("thead");
	    const trHead2 = document.createElement("tr");
    	for (let d = ultimoDiaMes + 1; d <= totalDias; d++) {
        	const th = document.createElement("th");
        	th.textContent = d;
        	th.style.fontSize = "13px";
        	th.style.padding = "2px";
        	th.style.height = `${alturaLinha-2.5}px`;
        	th.style.width = `${larguraDiaInteiro}px`;
        	th.style.backgroundColor = cores.fdsColor;
        	th.style.opacity = "0.2";
        	th.style.borderTop = "2px solid rgba(85,91,95,0.3)";
        	th.style.borderRight = "2px solid rgba(85,91,95,0.3)";
        	th.style.borderBottom = "3px double rgba(85,91,95,0.3)";
        	trHead2.appendChild(th);
    	}
    	thead2.appendChild(trHead2);
    	tabelaContinuidade.appendChild(thead2);

    	// Corpo da segunda tabela
    	const tbody2 = document.createElement("tbody");
    	for (let i = 0; i < tbody.rows.length; i++) {
        	const trNova = document.createElement("tr");
        	for (let d = ultimoDiaMes + 1; d <= totalDias; d++) {
            	const td = document.createElement("td");
            	td.style.height = `${alturaLinha-2.03}px`;
            	td.style.width = `${larguraDiaInteiro}px`;
            	td.style.borderLeft = "none"; // sem borda esquerda
            	td.style.backgroundColor = cores.basicColor;
	    		td.style.borderRight = "1px solid rgba(85,91,95,0.3)"; // borda preta semi-transparente
	    		td.style.borderBottom = "1px dashed rgba(128,128,128,0.4)"; // borda preta semi-transparente
        		td.style.opacity = "0.3"; // fundo
            	trNova.appendChild(td);
        	}
        	tbody2.appendChild(trNova);
    	}
    	tabelaContinuidade.appendChild(tbody2);
    	tabelasWrapper.appendChild(tabelaContinuidade);
	}
	// Adiciona o wrapper ao container
	container.appendChild(tabelasWrapper);

	// === Criar tabela separada para a legenda ===
	const tabelaLegenda = document.createElement("table");
	tabelaLegenda.style.borderCollapse = "collapse";
	tabelaLegenda.style.tableLayout = "fixed";
	tabelaLegenda.style.width = `${larguraTotalPopup}px`; // mesma largura da tabela principal
	tabelaLegenda.style.marginTop = "4px"; // espaçamento opcional
	tabelaLegenda.style.boxSizing = "border-box";

	// Criar linha única para a legenda
	const trLegenda = document.createElement("tr");
	const tdLegenda = document.createElement("td");
	tdLegenda.style.padding = "6px 4px";
	tdLegenda.style.width = "100%";
	tdLegenda.style.boxSizing = "border-box";

	// Criar container flex para os itens da legenda
	const legendaGantt = document.createElement("div");
	legendaGantt.style.display = "flex";
	legendaGantt.style.flexWrap = "wrap";
	legendaGantt.style.gap = "12px";
	legendaGantt.style.width = "100%";

	// Preencher a legenda
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
    	bola.style.border = `1px solid ${estilos.tableborder}`;

   	 	const texto = document.createElement("span");
   	 	texto.textContent = tp.tipo;
    	texto.style.fontSize = "13px";

    	item.appendChild(bola);
    	item.appendChild(texto);
    	legendaGantt.appendChild(item);
	});

	// Montagem final
	tdLegenda.appendChild(legendaGantt);
	trLegenda.appendChild(tdLegenda);
	tabelaLegenda.appendChild(trLegenda);

	// Adiciona a tabela de legenda ao container
	container.appendChild(tabelaLegenda);

}

// ============================================================================
// 17. PARA TROUBLESHOOTING: MOSTRA NA PRIMEIRA LINHA A RESOLUÇÃO REAL Vs FÍSICA DP ECRÃ E TRUE/FALSE PARA MOBILE
// ============================================================================
function showInfos() {
    // Detectar telemóvel via userAgent
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua);

    // Mostra a resolução
    const largura = window.innerWidth;
    const altura = window.innerHeight;
    const ratio = window.devicePixelRatio || 1;
    const resolucaoFisica = `${Math.round(largura * ratio)} x ${Math.round(altura * ratio)}`;
    const resolucaoCSS = `${largura} x ${altura}`;

    const mensagemTexto = `Resolução do ecrã: ${resolucaoCSS} (CSS pixels), ${resolucaoFisica} (físico) - Mobile: ${isMobile}`;

    // Criar fundo semi-transparente
    const overlay = document.createElement('div');
    overlay.id = 'overlayInfos';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';

    // Criar janela/modal
    const modal = document.createElement('div');
    modal.style.backgroundColor = '#fff';
    modal.style.padding = '20px';
    modal.style.borderRadius = '8px';
    modal.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
    modal.style.textAlign = 'center';
    modal.style.maxWidth = '90%';
    modal.style.fontSize = '14px';
    modal.style.fontWeight = 'bold';

    // Texto da resolução
    const texto = document.createElement('p');
    texto.textContent = mensagemTexto;

    // Botão Fechar
    const btnFechar = document.createElement('button');
    btnFechar.textContent = 'Fechar';
    btnFechar.style.marginTop = '10px';
    btnFechar.style.padding = '5px 15px';
    btnFechar.style.cursor = 'pointer';
    btnFechar.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });

    // Montar modal
    modal.appendChild(texto);
    modal.appendChild(btnFechar);
    overlay.appendChild(modal);

    // Adicionar ao body
    document.body.appendChild(overlay);
}