function formatValue(value, decimalPlaces = 2) {
  return Number(value).toFixed(decimalPlaces);
}

function updateProgressRing(element, percent) {
  const fillPercent = Math.min(Math.max(percent, 0), 100);
  element.style.background = `conic-gradient(#00ff88 0% ${fillPercent}%, rgba(255, 255, 255, 0.05) ${fillPercent}% 100%)`;
}

// Loop para atualizar os valores e animar os círculos
for (let i = 0; i < 4; i++) {
  const valueField = data.series[i]?.fields[1];
  const cardValue = htmlNode.getElementById(`value${i}`);
  const iconRing = htmlNode.querySelectorAll('.icon-ring')[i];

  if (cardValue && valueField && iconRing) {
    const length = valueField.values.length;
    if (length > 0) {
      const lastValue = valueField.values.get(length - 1);
      const percent = Number(lastValue);

      cardValue.textContent = formatValue(percent, 0) + (i === 3 ? '°' : '%');
      updateProgressRing(iconRing, percent);
    }
  }
}

// Atualiza o status ONLINE/OFFLINE dinamicamente (data.series[4])
const statusElement = htmlNode.getElementById('status-indicator');
const statusField = data.series[4]?.fields[1];

if (statusElement && statusField) {
  const length = statusField.values.length;
  if (length > 0) {
    const statusValue = statusField.values.get(length - 1);
    const isOnline = String(statusValue).toLowerCase() === 'online';

    statusElement.textContent = isOnline ? 'HA-OFF' : 'HA-ON';
    statusElement.style.backgroundColor = isOnline ? '#c20000' : '#00c26f';
    statusElement.style.boxShadow = isOnline
      ? '0 0 10px rgba(0, 194, 111, 0.5)'
      : '0 0 10px rgba(194, 0, 0, 0.5)';
  }
}
