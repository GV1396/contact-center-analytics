window.CCA = window.CCA || {};

(() => {
  const kpiDefinitions = [
    { key: "received", label: "Recebidas", icon: "call_received", desc: "Chamadas recebidas no periodo", type: "number" },
    { key: "answered", label: "Atendidas", icon: "phone_in_talk", desc: "Interacoes atendidas pela equipa", type: "number" },
    { key: "abandoned", label: "Abandonos", icon: "phone_missed", desc: "Chamadas sem atendimento", type: "number", negative: true },
    { key: "attempts", label: "Tentativas", icon: "restart_alt", desc: "Tentativas realizadas em outbound", type: "number" },
    { key: "contacts", label: "Contactos", icon: "contacts", desc: "Contactos efetivos registados", type: "number" },
    { key: "validContacts", label: "Contactos Validos", icon: "verified", desc: "Contactos com resultado util", type: "number" },
    { key: "answerRate", label: "Taxa Atendimento", icon: "fact_check", desc: "Peso das chamadas atendidas", type: "percent" },
    { key: "contactRate", label: "Taxa Contacto", icon: "radar", desc: "Contactos sobre volume total", type: "percent" },
    { key: "validContactRate", label: "Taxa Contacto Valido", icon: "check_circle", desc: "Contactos validos sobre volume", type: "percent" },
    { key: "productivity", label: "Produtividade", icon: "speed", desc: "Busy + wrap sobre tempo total", type: "percent" }
  ];

  const campaignKpis = ["contacts", "validContacts", "contactRate", "validContactRate", "answerRate", "abandoned", "productivity", "attempts"];
  const operationKpis = [
    { key: "productivity", label: "Produtividade", icon: "speed", desc: "Media operacional da equipa", type: "percent" },
    { key: "busy", label: "Busy", icon: "headset_mic", desc: "Tempo medio em conversacao", type: "percent" },
    { key: "wrap", label: "Wrap", icon: "edit_note", desc: "Tempo medio de pos-chamada", type: "percent" },
    { key: "busyWrap", label: "Busy + Wrap", icon: "timer", desc: "Tempo produtivo combinado", type: "percent" },
    { key: "productiveTime", label: "Tempo Produtivo", icon: "task_alt", desc: "Minutos produtivos acumulados", type: "minutes" },
    { key: "nonProductiveTime", label: "Tempo Nao Produtivo", icon: "pause_circle", desc: "Minutos fora de producao", type: "minutes", negative: true }
  ];

  let dashboardData;
  let filterApi;
  let navigationApi;
  let activePage = "landing";
  let agentsTable;

  document.addEventListener("DOMContentLoaded", async () => {
    dashboardData = await loadData();
    setupIconFallback();
    setupTheme();
    filterApi = window.CCA.filters.init(dashboardData, render);
    navigationApi = window.CCA.navigation.init((page) => {
      activePage = page;
      render();
    });
    renderLanding();
    render();
  });

  async function loadData() {
    try {
      const response = await fetch("data/dashboardData.json", { cache: "no-store" });
      if (!response.ok) throw new Error("JSON unavailable");
      return await response.json();
    } catch (error) {
      return fallbackData();
    }
  }

  function setupTheme() {
    const saved = localStorage.getItem("cca-theme");
    const dark = saved === "dark";
    const toggles = [document.getElementById("themeToggle"), document.getElementById("sidebarDarkMode")];

    document.body.classList.toggle("dark", dark);
    document.getElementById("sidebarDarkMode").checked = dark;

    toggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const nextDark = !document.body.classList.contains("dark");
        document.body.classList.toggle("dark", nextDark);
        document.getElementById("sidebarDarkMode").checked = nextDark;
        localStorage.setItem("cca-theme", nextDark ? "dark" : "light");
        window.CCA.charts.refreshTheme();
        render();
      });
    });
  }

  function render() {
    const state = filterApi.getState();
    const campaigns = getFilteredCampaigns(state);
    const selectedCampaign = getSelectedCampaign(state, campaigns);
    const agents = getFilteredAgents(state);

    if (activePage === "landing") renderLanding();
    if (activePage === "executive") renderExecutive(campaigns);
    if (activePage === "campaign") renderCampaign(selectedCampaign);
    if (activePage === "operations") renderOperations(agents);

    if (activePage === "campaign" && selectedCampaign) {
      document.getElementById("campaignHeadline").textContent = selectedCampaign.name;
      document.getElementById("campaignTypePill").textContent = selectedCampaign.type;
    }

    applyIconFallbacks();
  }

  function setupIconFallback() {
    applyIconFallbacks();
    setTimeout(() => {
      const materialReady = document.fonts && document.fonts.check('20px "Material Icons Round"');
      document.body.classList.toggle("icons-fallback", !materialReady);
      applyIconFallbacks();
    }, 900);
  }

  function applyIconFallbacks() {
    const fallbackMap = {
      account_balance: "B",
      auto_awesome: "*",
      calendar_month: "C",
      calendar_today: "C",
      call_received: "R",
      campaign: "M",
      check_circle: "✓",
      contacts: "C",
      corporate_fare: "▦",
      dark_mode: "◐",
      edit_note: "W",
      emoji_events: "T",
      fact_check: "✓",
      groups: "G",
      headset_mic: "H",
      history: "↺",
      hub: "H",
      insights: "I",
      keyboard_double_arrow_left: "‹",
      menu: "≡",
      outbound: "↗",
      pause_circle: "P",
      phone_in_talk: "A",
      phone_missed: "!",
      radar: "R",
      restart_alt: "↻",
      schedule: "T",
      search: "S",
      settings: "⚙",
      signal_cellular_alt: "▥",
      space_dashboard: "▦",
      speed: "S",
      stacked_line_chart: "↗",
      support_agent: "O",
      sync: "↻",
      task_alt: "✓",
      timer: "T",
      trending_up: "↗",
      verified: "✓",
      warning: "!"
    };

    document.querySelectorAll(".material-icons-round").forEach((icon) => {
      const key = icon.textContent.trim();
      icon.dataset.fallback = fallbackMap[key] || "•";
    });
  }

  function getFilteredCampaigns(state) {
    const filtered = dashboardData.campaigns
      .filter((campaign) => state.client === "Todos" || campaign.client === state.client)
      .filter((campaign) => state.type === "Todos" || campaign.type === state.type)
      .filter((campaign) => state.campaign === "Todos" || campaign.name === state.campaign)
      .filter((campaign) => state.period === campaign.period);

    return filtered.length ? filtered : dashboardData.campaigns;
  }

  function getSelectedCampaign(state, campaigns) {
    return campaigns.find((campaign) => campaign.name === state.campaign) || campaigns[0] || dashboardData.campaigns[0];
  }

  function getFilteredAgents(state) {
    const selectedCampaign = state.campaign;
    return dashboardData.operations.agents
      .filter((agent) => selectedCampaign === "Todos" || agent.campaign === selectedCampaign)
      .filter((agent) => state.client === "Todos" || agent.campaign.includes(state.client))
      .filter((agent) => {
        if (state.type === "Todos") return true;
        return state.type === "Inbound" ? agent.campaign.includes("INB") : agent.campaign.includes("OUT");
      });
  }

  function renderExecutive(campaigns) {
    const totals = aggregateKpis(campaigns);
    const cards = kpiDefinitions.map((definition, index) => createKpiCard(definition, totals, index));
    document.getElementById("executiveKpis").innerHTML = cards.join("");
    document.getElementById("executiveInsights").innerHTML = createExecutiveInsights(campaigns);
    window.CCA.charts.renderExecutive(campaigns);
  }

  function renderLanding() {
    const clients = [
      {
        name: "Vodafone",
        status: "healthy",
        label: "Estável",
        score: "92%",
        metric: "INB Vodafone",
        campaign: "INB Vodafone",
        client: "Vodafone",
        type: "Inbound",
        icon: "signal_cellular_alt"
      },
      {
        name: "Oney",
        status: "watch",
        label: "Atenção",
        score: "78%",
        metric: "OUT Oney",
        campaign: "OUT Oney",
        client: "Oney",
        type: "Outbound",
        icon: "outbound"
      },
      {
        name: "GNB",
        status: "healthy",
        label: "Estável",
        score: "88%",
        metric: "Em desenho",
        icon: "account_balance"
      },
      {
        name: "NOS",
        status: "critical",
        label: "Crítico",
        score: "61%",
        metric: "A validar",
        icon: "warning"
      }
    ];

    document.getElementById("clientLandingCards").innerHTML = clients.map((client) => `
      <button class="client-card ${client.status}" data-campaign="${client.campaign || ""}" data-client="${client.client || ""}" data-type="${client.type || ""}" ${client.campaign ? "" : "disabled"}>
        <span class="client-status"></span>
        <span class="material-icons-round">${client.icon}</span>
        <strong>${client.name}</strong>
        <small>${client.metric}</small>
        <em>${client.score}</em>
        <b>${client.label}</b>
      </button>
    `).join("");

    document.querySelectorAll(".client-card[data-campaign]").forEach((card) => {
      if (!card.dataset.campaign) return;
      card.addEventListener("click", () => {
        filterApi.setState({
          client: card.dataset.client,
          type: card.dataset.type,
          campaign: card.dataset.campaign,
          period: dashboardData.meta.period
        });
        navigationApi.navigateTo("campaign");
      });
    });
  }

  function renderCampaign(campaign) {
    const defs = campaignKpis
      .map((key) => kpiDefinitions.find((definition) => definition.key === key))
      .filter((definition) => definition && (campaign.kpis[definition.key] || ["answerRate", "abandoned", "attempts"].includes(definition.key)));

    document.getElementById("campaignKpis").innerHTML = defs
      .slice(0, 8)
      .map((definition, index) => createKpiCard(definition, campaign.kpis, index))
      .join("");

    document.getElementById("campaignInsights").innerHTML = createCampaignInsights(campaign);
    window.CCA.charts.renderCampaign(campaign);
  }

  function renderOperations(agents) {
    const summary = summarizeAgents(agents);
    document.getElementById("operationsKpis").innerHTML = operationKpis
      .map((definition, index) => createKpiCard(definition, summary, index))
      .join("");

    window.CCA.charts.renderOperations(agents, summary);
    renderAgentsTable(agents);
  }

  function createKpiCard(definition, source, index) {
    const value = source[definition.key] || 0;
    const delta = definition.negative ? -Math.abs(1.6 + index * 0.2) : 2.4 + index * 0.3;
    const down = delta < 0;
    return `
      <article class="kpi-card">
        <div class="kpi-top">
          <div class="kpi-icon"><span class="material-icons-round">${definition.icon}</span></div>
          <span class="kpi-delta ${down ? "down" : ""}">${down ? "" : "+"}${delta.toFixed(1)}%</span>
        </div>
        <div class="kpi-value">${formatValue(value, definition.type)}</div>
        <div class="kpi-label">${definition.label}</div>
        <div class="kpi-desc">${definition.desc}</div>
      </article>
    `;
  }

  function createExecutiveInsights(campaigns) {
    const bestCampaign = [...campaigns].sort((a, b) => b.kpis.productivity - a.kpis.productivity)[0];
    const allDays = campaigns.flatMap((campaign) => campaign.daily.map((day) => ({ ...day, campaign: campaign.name })));
    const allHours = campaigns.flatMap((campaign) => campaign.hourly.map((hour) => ({ ...hour, campaign: campaign.name })));
    const bestDay = [...allDays].sort((a, b) => b.productivity - a.productivity)[0];
    const bestHour = [...allHours].sort((a, b) => b.value - a.value)[0];
    const highestAbandon = [...allDays].sort((a, b) => b.abandoned - a.abandoned)[0];
    const bestContact = [...allDays].sort((a, b) => b.contactRate - a.contactRate)[0];
    const bestProductivity = [...allDays].sort((a, b) => b.productivity - a.productivity)[0];

    return [
      ["emoji_events", "Melhor campanha", bestCampaign.name, `${bestCampaign.kpis.productivity}% produtividade`],
      ["calendar_month", "Melhor dia", bestDay.day, `${bestDay.campaign}`],
      ["trending_up", "Melhor hora", bestHour.hour, `${bestHour.value}% performance`],
      ["warning", "Atenção abandono", highestAbandon.day, `${highestAbandon.abandoned} chamadas`],
      ["stacked_line_chart", "Melhor Contact Rate", bestContact.day, `${bestContact.contactRate}%`],
      ["check_circle", "Melhor produtividade", bestProductivity.day, `${bestProductivity.productivity}%`]
    ].map(createInsightCard).join("");
  }

  function createCampaignInsights(campaign) {
    const bestDay = [...campaign.daily].sort((a, b) => b.productivity - a.productivity)[0];
    const bestHour = [...campaign.hourly].sort((a, b) => b.value - a.value)[0];
    const bestContact = [...campaign.daily].sort((a, b) => b.contactRate - a.contactRate)[0];
    const bestValid = [...campaign.daily].sort((a, b) => b.validContactRate - a.validContactRate)[0];
    const abandon = [...campaign.daily].sort((a, b) => b.abandoned - a.abandoned)[0];

    return [
      ["hub", "Cobertura", `${campaign.kpis.contacts}`, "contactos totais"],
      ["speed", "Eficiência", `${campaign.kpis.productivity}%`, "busy + wrap"],
      ["stacked_line_chart", "Contact Rate", `${bestContact.contactRate}%`, bestContact.day],
      ["verified", "Contacto válido", `${bestValid.validContactRate}%`, bestValid.day],
      ["schedule", "Melhor hora", bestHour.hour, `${bestHour.value}%`],
      ["warning", "Atenção", campaign.type === "Inbound" ? `${abandon.abandoned} abandonos` : "Follow-up", campaign.type === "Inbound" ? abandon.day : "lista ativa"]
    ].map(createInsightCard).join("");
  }

  function createInsightCard([icon, label, value, detail]) {
    return `
      <article class="insight-card">
        <div class="insight-icon"><span class="material-icons-round">${icon}</span></div>
        <span>${label}</span>
        <strong>${value}</strong>
        <small>${detail}</small>
      </article>
    `;
  }

  function renderAgentsTable(agents) {
    if (!agentsTable) {
      agentsTable = new Tabulator("#agentsTable", {
        data: agents,
        height: 360,
        layout: "fitColumns",
        reactiveData: true,
        columns: [
          { title: "Agente", field: "agent", minWidth: 160, frozen: true },
          { title: "Campanha", field: "campaign", minWidth: 140 },
          { title: "Produtividade", field: "productivity", sorter: "number", formatter: percentFormatter },
          { title: "Busy", field: "busy", sorter: "number", formatter: percentFormatter },
          { title: "Wrap", field: "wrap", sorter: "number", formatter: percentFormatter },
          { title: "Busy + Wrap", field: "busyWrap", sorter: "number", formatter: percentFormatter },
          { title: "Produtivo", field: "productiveTime", sorter: "number", formatter: minuteFormatter },
          { title: "Nao Produtivo", field: "nonProductiveTime", sorter: "number", formatter: minuteFormatter },
          { title: "Contactos", field: "contacts", sorter: "number" },
          { title: "Validos", field: "validContacts", sorter: "number" }
        ]
      });

      document.getElementById("agentSearch").addEventListener("input", (event) => {
        const value = event.target.value.toLowerCase();
        if (!value) {
          agentsTable.clearFilter();
          return;
        }
        agentsTable.setFilter((row) => row.agent.toLowerCase().includes(value) || row.campaign.toLowerCase().includes(value));
      });
    } else {
      agentsTable.setData(agents);
    }
  }

  function percentFormatter(cell) {
    return `${Number(cell.getValue()).toFixed(1)}%`;
  }

  function minuteFormatter(cell) {
    return `${cell.getValue()} min`;
  }

  function aggregateKpis(campaigns) {
    const totals = {
      received: 0,
      answered: 0,
      abandoned: 0,
      attempts: 0,
      contacts: 0,
      validContacts: 0,
      answerRate: 0,
      contactRate: 0,
      validContactRate: 0,
      productivity: 0
    };

    campaigns.forEach((campaign) => {
      totals.received += campaign.kpis.received;
      totals.answered += campaign.kpis.answered;
      totals.abandoned += campaign.kpis.abandoned;
      totals.attempts += campaign.kpis.attempts;
      totals.contacts += campaign.kpis.contacts;
      totals.validContacts += campaign.kpis.validContacts;
      totals.productivity += campaign.kpis.productivity;
    });

    const count = campaigns.length || 1;
    const totalOperationalVolume = totals.received + totals.attempts;
    totals.answerRate = totals.received ? +((totals.answered / totals.received) * 100).toFixed(1) : 0;
    totals.contactRate = totalOperationalVolume ? +((totals.contacts / totalOperationalVolume) * 100).toFixed(1) : 0;
    totals.validContactRate = totalOperationalVolume ? +((totals.validContacts / totalOperationalVolume) * 100).toFixed(1) : 0;
    totals.productivity = +(totals.productivity / count).toFixed(1);

    return totals;
  }

  function summarizeAgents(agents) {
    const count = agents.length || 1;
    const totals = agents.reduce((acc, agent) => {
      acc.productivity += agent.productivity;
      acc.busy += agent.busy;
      acc.wrap += agent.wrap;
      acc.busyWrap += agent.busyWrap;
      acc.productiveTime += agent.productiveTime;
      acc.nonProductiveTime += agent.nonProductiveTime;
      return acc;
    }, { productivity: 0, busy: 0, wrap: 0, busyWrap: 0, productiveTime: 0, nonProductiveTime: 0 });

    return {
      productivity: +(totals.productivity / count).toFixed(1),
      busy: +(totals.busy / count).toFixed(1),
      wrap: +(totals.wrap / count).toFixed(1),
      busyWrap: +(totals.busyWrap / count).toFixed(1),
      productiveTime: Math.round(totals.productiveTime),
      nonProductiveTime: Math.round(totals.nonProductiveTime)
    };
  }

  function formatValue(value, type) {
    if (type === "percent") return `${Number(value).toFixed(1)}%`;
    if (type === "minutes") return `${new Intl.NumberFormat("pt-PT").format(value)} min`;
    return new Intl.NumberFormat("pt-PT").format(value);
  }

  function fallbackData() {
    return {
      meta: { period: "22-26 Junho" },
      filters: {
        clients: ["Todos", "Vodafone", "Oney"],
        types: ["Todos", "Inbound", "Outbound"],
        campaigns: ["INB Vodafone", "OUT Oney"],
        periods: ["22-26 Junho"]
      },
      campaigns: [
        {
          id: "inb-vodafone",
          name: "INB Vodafone",
          client: "Vodafone",
          type: "Inbound",
          period: "22-26 Junho",
          kpis: { received: 4860, answered: 4382, abandoned: 478, attempts: 0, contacts: 4382, validContacts: 4038, answerRate: 90.2, contactRate: 90.2, validContactRate: 83.1, productivity: 76.4, busy: 64.8, wrap: 11.6, busyWrap: 76.4, nonProductive: 23.6 },
          daily: [
            { day: "22 Jun", received: 910, answered: 815, abandoned: 95, attempts: 0, contacts: 815, validContacts: 746, answerRate: 89.6, contactRate: 89.6, validContactRate: 82.0, productivity: 74.5 },
            { day: "23 Jun", received: 1020, answered: 928, abandoned: 92, attempts: 0, contacts: 928, validContacts: 858, answerRate: 91.0, contactRate: 91.0, validContactRate: 84.1, productivity: 77.8 },
            { day: "24 Jun", received: 980, answered: 886, abandoned: 94, attempts: 0, contacts: 886, validContacts: 817, answerRate: 90.4, contactRate: 90.4, validContactRate: 83.4, productivity: 76.1 },
            { day: "25 Jun", received: 1125, answered: 1026, abandoned: 99, attempts: 0, contacts: 1026, validContacts: 953, answerRate: 91.2, contactRate: 91.2, validContactRate: 84.7, productivity: 78.4 },
            { day: "26 Jun", received: 825, answered: 727, abandoned: 98, attempts: 0, contacts: 727, validContacts: 664, answerRate: 88.1, contactRate: 88.1, validContactRate: 80.5, productivity: 74.9 }
          ],
          hourly: [
            { hour: "09:00", value: 67, answerRate: 86, abandonRate: 14 },
            { hour: "10:00", value: 82, answerRate: 91, abandonRate: 9 },
            { hour: "11:00", value: 88, answerRate: 92, abandonRate: 8 },
            { hour: "12:00", value: 74, answerRate: 89, abandonRate: 11 },
            { hour: "14:00", value: 91, answerRate: 93, abandonRate: 7 },
            { hour: "15:00", value: 86, answerRate: 91, abandonRate: 9 },
            { hour: "16:00", value: 79, answerRate: 90, abandonRate: 10 },
            { hour: "17:00", value: 63, answerRate: 85, abandonRate: 15 }
          ]
        },
        {
          id: "out-oney",
          name: "OUT Oney",
          client: "Oney",
          type: "Outbound",
          period: "22-26 Junho",
          kpis: { received: 0, answered: 0, abandoned: 0, attempts: 7380, contacts: 2894, validContacts: 1846, answerRate: 0, contactRate: 39.2, validContactRate: 25.0, productivity: 71.8, busy: 58.7, wrap: 13.1, busyWrap: 71.8, nonProductive: 28.2 },
          daily: [
            { day: "22 Jun", received: 0, answered: 0, abandoned: 0, attempts: 1320, contacts: 502, validContacts: 318, answerRate: 0, contactRate: 38.0, validContactRate: 24.1, productivity: 69.3 },
            { day: "23 Jun", received: 0, answered: 0, abandoned: 0, attempts: 1485, contacts: 604, validContacts: 397, answerRate: 0, contactRate: 40.7, validContactRate: 26.7, productivity: 72.6 },
            { day: "24 Jun", received: 0, answered: 0, abandoned: 0, attempts: 1510, contacts: 566, validContacts: 358, answerRate: 0, contactRate: 37.5, validContactRate: 23.7, productivity: 70.8 },
            { day: "25 Jun", received: 0, answered: 0, abandoned: 0, attempts: 1665, contacts: 682, validContacts: 442, answerRate: 0, contactRate: 41.0, validContactRate: 26.5, productivity: 74.0 },
            { day: "26 Jun", received: 0, answered: 0, abandoned: 0, attempts: 1400, contacts: 540, validContacts: 331, answerRate: 0, contactRate: 38.6, validContactRate: 23.6, productivity: 72.1 }
          ],
          hourly: [
            { hour: "09:00", value: 28, answerRate: 0, abandonRate: 0 },
            { hour: "10:00", value: 36, answerRate: 0, abandonRate: 0 },
            { hour: "11:00", value: 43, answerRate: 0, abandonRate: 0 },
            { hour: "12:00", value: 31, answerRate: 0, abandonRate: 0 },
            { hour: "14:00", value: 45, answerRate: 0, abandonRate: 0 },
            { hour: "15:00", value: 42, answerRate: 0, abandonRate: 0 },
            { hour: "16:00", value: 38, answerRate: 0, abandonRate: 0 },
            { hour: "17:00", value: 30, answerRate: 0, abandonRate: 0 }
          ]
        }
      ],
      operations: {
        agents: [
          { agent: "Ana Martins", campaign: "INB Vodafone", productivity: 82.4, busy: 69.2, wrap: 13.2, busyWrap: 82.4, productiveTime: 398, nonProductiveTime: 85, contacts: 438, validContacts: 407 },
          { agent: "Bruno Silva", campaign: "OUT Oney", productivity: 79.8, busy: 65.0, wrap: 14.8, busyWrap: 79.8, productiveTime: 372, nonProductiveTime: 94, contacts: 356, validContacts: 232 },
          { agent: "Carla Reis", campaign: "INB Vodafone", productivity: 78.6, busy: 67.1, wrap: 11.5, busyWrap: 78.6, productiveTime: 381, nonProductiveTime: 104, contacts: 421, validContacts: 391 },
          { agent: "Diogo Costa", campaign: "OUT Oney", productivity: 76.9, busy: 61.8, wrap: 15.1, busyWrap: 76.9, productiveTime: 355, nonProductiveTime: 107, contacts: 330, validContacts: 214 },
          { agent: "Eva Pereira", campaign: "INB Vodafone", productivity: 75.2, busy: 63.3, wrap: 11.9, busyWrap: 75.2, productiveTime: 348, nonProductiveTime: 115, contacts: 386, validContacts: 356 },
          { agent: "Fabio Lopes", campaign: "OUT Oney", productivity: 73.8, busy: 59.6, wrap: 14.2, busyWrap: 73.8, productiveTime: 341, nonProductiveTime: 121, contacts: 318, validContacts: 198 },
          { agent: "Ines Sousa", campaign: "INB Vodafone", productivity: 72.7, busy: 61.4, wrap: 11.3, busyWrap: 72.7, productiveTime: 334, nonProductiveTime: 126, contacts: 360, validContacts: 330 },
          { agent: "Joao Lima", campaign: "OUT Oney", productivity: 70.5, busy: 57.5, wrap: 13.0, busyWrap: 70.5, productiveTime: 319, nonProductiveTime: 133, contacts: 294, validContacts: 181 },
          { agent: "Marta Gomes", campaign: "INB Vodafone", productivity: 69.8, busy: 58.8, wrap: 11.0, busyWrap: 69.8, productiveTime: 312, nonProductiveTime: 135, contacts: 342, validContacts: 316 },
          { agent: "Nuno Ribeiro", campaign: "OUT Oney", productivity: 67.9, busy: 54.6, wrap: 13.3, busyWrap: 67.9, productiveTime: 301, nonProductiveTime: 142, contacts: 276, validContacts: 164 }
        ]
      }
    };
  }
})();
