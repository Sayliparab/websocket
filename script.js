const binanceBaseUrl = 'wss://stream.binance.com:9443/ws/<symbol>@kline_<interval>';
let socket;
let chart;
let chartData = {
    ethusdt: [],
    bnbusdt: [],
    dotusdt: []
};
let currentSymbol = 'ethusdt';
let currentInterval = '1m';

document.addEventListener('DOMContentLoaded', () => {
    const coinSelect = document.getElementById('coin-select');
    const intervalSelect = document.getElementById('interval-select');
    const ctx = document.getElementById('candlestick-chart').getContext('2d');

    // Ensure the financial chart type is registered
    Chart.register(Chart.financial); 

    chart = new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: 'Candlestick Chart',
                data: chartData[currentSymbol],
                borderColor: '#000',
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time', // Use 'time' for the x-axis
                    time: {
                        unit: 'minute'
                    }
                }
            }
        }
    });

    coinSelect.addEventListener('change', (e) => {
        currentSymbol = e.target.value;
        updateChart();
        connectWebSocket();
    });

    intervalSelect.addEventListener('change', (e) => {
        currentInterval = e.target.value;
        connectWebSocket();
    });

    connectWebSocket();
});

function connectWebSocket() {
    if (socket) {
        socket.close();
    }

    const symbol = currentSymbol;
    const interval = currentInterval;
    socket = new WebSocket(`${binanceBaseUrl}/${symbol}@kline_${interval}`);

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const kline = message.k;
        const candlestick = {
            x: new Date(kline.t),
            o: parseFloat(kline.o),
            h: parseFloat(kline.h),
            l: parseFloat(kline.l),
            c: parseFloat(kline.c)
        };

        chartData[symbol].push(candlestick);
        localStorage.setItem(symbol, JSON.stringify(chartData[symbol]));
        updateChart();
    };

    socket.onclose = () => {
        console.log('WebSocket closed. Reconnecting...');
        connectWebSocket();
    };
}

function updateChart() {
    const data = JSON.parse(localStorage.getItem(currentSymbol)) || [];
    chart.data.datasets[0].data = data;
    chart.update();
}
