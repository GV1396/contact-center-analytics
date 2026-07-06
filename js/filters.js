window.CCA = window.CCA || {};

window.CCA.filters = (() => {
  const ids = {
    client: "clientFilter",
    type: "typeFilter",
    campaign: "campaignFilter",
    period: "periodFilter"
  };

  function fillSelect(select, values) {
    select.innerHTML = values.map((value) => `<option value="${value}">${value}</option>`).join("");
  }

  function init(data, onChange) {
    const controls = {
      client: document.getElementById(ids.client),
      type: document.getElementById(ids.type),
      campaign: document.getElementById(ids.campaign),
      period: document.getElementById(ids.period)
    };

    fillSelect(controls.client, data.filters.clients);
    fillSelect(controls.type, data.filters.types);
    fillSelect(controls.campaign, ["Todos", ...data.filters.campaigns]);
    fillSelect(controls.period, data.filters.periods);

    controls.period.value = data.meta.period;

    Object.values(controls).forEach((control) => {
      control.addEventListener("change", () => {
        syncCampaignOptions(data, controls);
        onChange(getState());
      });
    });

    function getState() {
      return {
        client: controls.client.value,
        type: controls.type.value,
        campaign: controls.campaign.value,
        period: controls.period.value
      };
    }

    function setState(nextState) {
      if (nextState.client) controls.client.value = nextState.client;
      if (nextState.type) controls.type.value = nextState.type;
      syncCampaignOptions(data, controls);
      if (nextState.campaign) controls.campaign.value = nextState.campaign;
      if (nextState.period) controls.period.value = nextState.period;
      onChange(getState());
    }

    return { getState, setState };
  }

  function syncCampaignOptions(data, controls) {
    const selected = controls.campaign.value;
    const campaigns = data.campaigns
      .filter((campaign) => controls.client.value === "Todos" || campaign.client === controls.client.value)
      .filter((campaign) => controls.type.value === "Todos" || campaign.type === controls.type.value)
      .map((campaign) => campaign.name);

    fillSelect(controls.campaign, ["Todos", ...campaigns]);

    if (campaigns.includes(selected) || selected === "Todos") {
      controls.campaign.value = selected;
    }
  }

  return { init };
})();
