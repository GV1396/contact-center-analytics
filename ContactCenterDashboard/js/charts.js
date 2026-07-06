window.CCA = window.CCA || {};

window.CCA.charts = (() => {
  const charts = {};

  function palette() {
    const dark = document.body.classList.contains("dark");
    return {
      text: dark ? "#edf2f7" : "#111827",
      muted: dark ? "#a5b4c7" : "#64748b",
      grid: dark ? "#233047" : "#e2e8f0",
      blue: "#2563eb",
      cyan: "#14b8a6",
      green: "#16a34a",
      red: "#dc2626",
      yellow: "#f59e0b",
      purple: "#7c3aed"
    };
  }

  function baseOptions(height = 255) {
    const colors = palette();
    return {
      chart: {
        height,
        toolbar: { show: false },
        fontFamily: "Inter, sans-serif",
        foreColor: colors.muted,
        animations: { enabled: true, speed: 450 }
      },
      grid: {
        borderColor: colors.grid,
        strokeDashArray: 4
      },
      dataLabels: { enabled: false },
      tooltip: {
        theme: document.body.classList.contains("dark") ? "dark" : "light"
      },
      legend: {
        labels: { colors: colors.muted }
      }
    };
  }

  function render(id, options) {
    if (charts[id]) {
      charts[id].updateOptions(options, true, true);
      return;
    }

    const el = document.getElementById(id);
    if (!el) return;

    charts[id] = new ApexCharts(el, options);
    charts[id].render();
  }

  function renderExecutive(campaigns) {
    const colors = palette();
    const aggregateDaily = aggregateByDay(campaigns);
    const labels = aggregateDaily.map((item) => item.day);

    render("dailyPerformanceChart", {
      ...baseOptions(285),
      chart: { ...baseOptions().chart, type: "line", height: 285 },
      colors: [colors.blue, colors.green, colors.cyan],
      stroke: { width: 3, curve: "smooth" },
      series: [
        { name: "Recebidas", data: aggregateDaily.map((d) => d.received) },
        { name: "Atendidas", data: aggregateDaily.map((d) => d.answered) },
        { name: "Contactos", data: aggregateDaily.map((d) => d.contacts) }
      ],
      xaxis: { categories: labels }
    });

    render("campaignDistributionChart", {
      ...baseOptions(285),
      chart: { ...baseOptions().chart, type: "donut", height: 285 },
      colors: [colors.blue, colors.cyan],
      labels: campaigns.map((campaign) => campaign.name),
      series: campaigns.map((campaign) => campaign.kpis.contacts || campaign.kpis.answered),
      plotOptions: { pie: { donut: { size: "68%" } } }
    });

    render("inboundOutboundChart", {
      ...baseOptions(255),
      chart: { ...baseOptions().chart, type: "bar", height: 255 },
      colors: [colors.blue, colors.cyan],
      plotOptions: { bar: { borderRadius: 6, columnWidth: "44%" } },
      series: [
        { name: "Volume", data: campaigns.map((c) => c.type === "Inbound" ? c.kpis.received : c.kpis.attempts) }
      ],
      xaxis: { categories: campaigns.map((c) => c.type) }
    });

    renderHeatmap("hourlyHeatmapChart", campaigns, "value", 285);

    render("trendAreaChart", {
      ...baseOptions(255),
      chart: { ...baseOptions().chart, type: "area", height: 255 },
      colors: [colors.blue, colors.cyan],
      stroke: { curve: "smooth", width: 3 },
      fill: { type: "gradient", gradient: { opacityFrom: 0.32, opacityTo: 0.03 } },
      series: [
        { name: "Contact Rate", data: aggregateDaily.map((d) => d.contactRate) },
        { name: "Produtividade", data: aggregateDaily.map((d) => d.productivity) }
      ],
      xaxis: { categories: labels },
      yaxis: { labels: { formatter: (value) => `${Math.round(value)}%` } }
    });
  }

  function renderCampaign(campaign) {
    const colors = palette();
    const labels = campaign.daily.map((day) => day.day);

    render("campaignDailyChart", {
      ...baseOptions(285),
      chart: { ...baseOptions().chart, type: "line", height: 285 },
      colors: [colors.blue, colors.green, colors.red],
      stroke: { width: 3, curve: "smooth" },
      series: [
        { name: campaign.type === "Inbound" ? "Atendidas" : "Tentativas", data: campaign.daily.map((d) => campaign.type === "Inbound" ? d.answered : d.attempts) },
        { name: "Contactos", data: campaign.daily.map((d) => d.contacts) },
        { name: campaign.type === "Inbound" ? "Abandonos" : "Contactos validos", data: campaign.daily.map((d) => campaign.type === "Inbound" ? d.abandoned : d.validContacts) }
      ],
      xaxis: { categories: labels }
    });

    render("campaignEfficiencyChart", {
      ...baseOptions(285),
      chart: { ...baseOptions().chart, type: "radialBar", height: 285 },
      colors: [colors.blue, colors.cyan, colors.green],
      series: [campaign.kpis.contactRate, campaign.kpis.validContactRate, campaign.kpis.productivity],
      labels: ["Contact Rate", "Valido", "Produtividade"],
      plotOptions: {
        radialBar: {
          hollow: { size: "36%" },
          dataLabels: { value: { formatter: (value) => `${Math.round(value)}%` } }
        }
      }
    });

    render("campaignHourlyChart", {
      ...baseOptions(255),
      chart: { ...baseOptions().chart, type: "bar", height: 255 },
      colors: [colors.cyan],
      plotOptions: { bar: { borderRadius: 6, columnWidth: "48%" } },
      series: [{ name: "Performance", data: campaign.hourly.map((hour) => hour.value) }],
      xaxis: { categories: campaign.hourly.map((hour) => hour.hour) }
    });

    renderHeatmap("campaignHeatmapChart", [campaign], "value", 255);
  }

  function renderOperations(agents, summary) {
    const colors = palette();
    const topAgents = [...agents].sort((a, b) => b.productivity - a.productivity).slice(0, 7);

    render("productiveTimeChart", {
      ...baseOptions(285),
      chart: { ...baseOptions().chart, type: "area", height: 285 },
      colors: [colors.green, colors.red],
      stroke: { curve: "smooth", width: 3 },
      fill: { type: "gradient", gradient: { opacityFrom: 0.28, opacityTo: 0.04 } },
      series: [
        { name: "Tempo produtivo", data: agents.slice(0, 8).map((a) => a.productiveTime) },
        { name: "Tempo nao produtivo", data: agents.slice(0, 8).map((a) => a.nonProductiveTime) }
      ],
      xaxis: { categories: agents.slice(0, 8).map((a) => firstName(a.agent)) }
    });

    render("statesChart", {
      ...baseOptions(285),
      chart: { ...baseOptions().chart, type: "donut", height: 285 },
      colors: [colors.blue, colors.cyan, colors.red],
      labels: ["Busy", "Wrap", "Outros"],
      series: [summary.busy, summary.wrap, Math.max(0, 100 - summary.busy - summary.wrap)],
      plotOptions: { pie: { donut: { size: "68%" } } }
    });

    render("agentRankingChart", {
      ...baseOptions(285),
      chart: { ...baseOptions().chart, type: "bar", height: 285 },
      colors: [colors.blue],
      plotOptions: { bar: { borderRadius: 6, horizontal: true } },
      series: [{ name: "Produtividade", data: topAgents.map((a) => a.productivity) }],
      xaxis: { labels: { formatter: (value) => `${value}%` } },
      yaxis: { categories: topAgents.map((a) => a.agent) }
    });

    render("busyWrapChart", {
      ...baseOptions(285),
      chart: { ...baseOptions().chart, type: "bar", height: 285, stacked: true },
      colors: [colors.blue, colors.cyan],
      plotOptions: { bar: { borderRadius: 5, columnWidth: "54%" } },
      series: [
        { name: "Busy", data: agents.slice(0, 8).map((a) => a.busy) },
        { name: "Wrap", data: agents.slice(0, 8).map((a) => a.wrap) }
      ],
      xaxis: { categories: agents.slice(0, 8).map((a) => firstName(a.agent)) }
    });
  }

  function renderHeatmap(id, campaigns, field, height) {
    const colors = palette();
    const hours = campaigns[0]?.hourly.map((item) => item.hour) || [];
    const series = campaigns.map((campaign) => ({
      name: campaign.name,
      data: campaign.hourly.map((item) => ({ x: item.hour, y: item[field] }))
    }));

    render(id, {
      ...baseOptions(height),
      chart: { ...baseOptions().chart, type: "heatmap", height },
      colors: [colors.blue],
      plotOptions: {
        heatmap: {
          radius: 6,
          shadeIntensity: 0.42,
          colorScale: {
            ranges: [
              { from: 0, to: 35, color: colors.red },
              { from: 36, to: 70, color: colors.yellow },
              { from: 71, to: 100, color: colors.green }
            ]
          }
        }
      },
      series,
      xaxis: { categories: hours }
    });
  }

  function aggregateByDay(campaigns) {
    const map = new Map();
    campaigns.forEach((campaign) => {
      campaign.daily.forEach((day) => {
        const entry = map.get(day.day) || {
          day: day.day,
          received: 0,
          answered: 0,
          contacts: 0,
          validContacts: 0,
          attempts: 0,
          productivity: 0,
          contactRate: 0,
          count: 0
        };
        entry.received += day.received;
        entry.answered += day.answered;
        entry.contacts += day.contacts;
        entry.validContacts += day.validContacts;
        entry.attempts += day.attempts;
        entry.productivity += day.productivity;
        entry.contactRate += day.contactRate;
        entry.count += 1;
        map.set(day.day, entry);
      });
    });

    return [...map.values()].map((entry) => ({
      ...entry,
      productivity: +(entry.productivity / entry.count).toFixed(1),
      contactRate: +(entry.contactRate / entry.count).toFixed(1)
    }));
  }

  function refreshTheme() {
    Object.values(charts).forEach((chart) => chart.destroy());
    Object.keys(charts).forEach((key) => delete charts[key]);
  }

  function firstName(name) {
    return name.split(" ")[0];
  }

  return { renderExecutive, renderCampaign, renderOperations, refreshTheme };
})();
