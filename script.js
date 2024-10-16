import { Chart, registerables } from 'chart.js/auto';

// Register necessary components
Chart.register(...registerables);
Chart.register(Chart.FinancialController, Chart.FinancialElement);


// Your previous code...
const symbolSelect = document.getElementById('symbolSelect');
const intervalSelect = document.getElementById('intervalSelect');
const ctx = document.getElementById('candlestickChart').getContext('2d');

let chart;
let socket;
let storedData = JSON.parse(localStorage.getItem('candlestickData')) || {};

function createWebSocket(symbol, interval) {
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;
    if (socket) {
        socket.close();
    }
    socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const candlestick = data.k;

        const symbolKey = `${symbol}_${interval}`;
        storedData[symbolKey] = storedData[symbolKey] || [];
        storedData[symbolKey].push({
            time: candlestick.t,
            open: parseFloat(candlestick.o),
            high: parseFloat(candlestick.h),
            low: parseFloat(candlestick.l),
            close: parseFloat(candlestick.c)
        });

        localStorage.setItem('candlestickData', JSON.stringify(storedData));
        updateChart(symbolKey);
    };
}

function updateChart(symbolKey) {
    const data = storedData[symbolKey] || [];
    const labels = data.map(candle => new Date(candle.time).toLocaleTimeString());
    const chartData = {
        labels: labels,
        datasets: [{
            label: 'Candlestick Chart',
            data: data.map(candle => ({
                x: candle.time,
                y: [candle.open, candle.high, candle.low, candle.close]
            })),
            borderColor: 'rgba(75, 192, 192, 0.5)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 1
        }]
    };

    if (chart) {
        chart.destroy();
    }
    chart = new Chart(ctx, {
        type: 'candlestick',
        data: chartData,
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute'
                    }
                }
            }
        }
    });
}

symbolSelect.addEventListener('change', () => {
    const symbol = symbolSelect.value;
    const interval = intervalSelect.value;
    const symbolKey = `${symbol}_${interval}`;
    createWebSocket(symbol, interval);
    updateChart(symbolKey);
});

intervalSelect.addEventListener('change', () => {
    const symbol = symbolSelect.value;
    const interval = intervalSelect.value;
    const symbolKey = `${symbol}_${interval}`;
    createWebSocket(symbol, interval);
    updateChart(symbolKey);
});

// Initialize with default values
const initialSymbol = symbolSelect.value;
const initialInterval = intervalSelect.value;
createWebSocket(initialSymbol, initialInterval);
updateChart(`${initialSymbol}_${initialInterval}`);
