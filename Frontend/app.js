const fileInput = document.getElementById('file-input');
const pointsTextarea = document.getElementById('points');
const form = document.getElementById('interpolation-form');
const resultDiv = document.getElementById('result');
const downloadBtn = document.getElementById('download-graph');
const canvas = document.getElementById('myChart');
let chartInstance = null;

let latestPoints = [];
let latestEstimatedPoint = null;

// Leer archivo CSV y llenar textarea
fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
        const lines = evt.target.result.trim().split('\n');
        pointsTextarea.value = lines.map(line => line.trim()).join(' ');
    };
    reader.readAsText(file);
});

// Enviar datos y obtener interpolación
form.addEventListener('submit', async e => {
    e.preventDefault();
    const pointsText = pointsTextarea.value.trim();
    const xValue = parseFloat(document.getElementById('x-value').value);
    const method = document.getElementById('method').value;

    if (!pointsText) {
        alert('Por favor, ingresa los puntos.');
        return;
    }

    // configurar puntos
    const points = pointsText.split(' ').map(p => {
        const [x, y] = p.split(',').map(Number);
        return [x, y];
    });

    try {
        const res = await fetch('http://127.0.0.1:5000/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points, x: xValue, method })
        });
        const data = await res.json();

        if (data.status === 'success') {
            latestPoints = points;
            latestEstimatedPoint = [xValue, data.y_estimated];

            resultDiv.innerHTML = `
                <p><strong>Resultado:</strong> Y ≈ ${data.y_estimated.toFixed(4)}</p>
                <p><strong>Método:</strong> ${method === 'linear' ? 'Lineal' : 'Lagrange'}</p>
            `;

            downloadBtn.style.display = 'inline-block';
            canvas.style.display = 'block';

            renderChart(points, data.y_estimated, xValue, method);
        } else {
            resultDiv.innerHTML = `<p style="color:red;">Error: ${data.message}</p>`;
            downloadBtn.style.display = 'none';
            canvas.style.display = 'none';
        }
    } catch (err) {
        resultDiv.innerHTML = `<p style="color:red;">Error de conexión: ${err.message}</p>`;
        downloadBtn.style.display = 'none';
        canvas.style.display = 'none';
    }
});

// gráfico con Chart.js
function renderChart(points, estimatedY, targetX, method) {
    const ctx = canvas.getContext('2d');
    if (chartInstance) chartInstance.destroy();

    const datasets = [
        {
            label: 'Puntos dados',
            data: points.map(([x,y]) => ({x,y})),
            borderColor: 'gray',
            backgroundColor: 'gray',
            showLine: false,
            pointRadius: 5
        },
        {
            label: `Interpolación ${method === 'linear' ? 'Lineal' : 'Lagrange'}`,
            data: [...points.map(([x]) => ({x, y: null})), {x: targetX, y: estimatedY}],
            borderColor: method === 'linear' ? 'blue' : 'green',
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.3,
            showLine: true,
            fill: false,
        },
        {
            label: 'Valor estimado',
            data: [{x: targetX, y: estimatedY}],
            borderColor: 'red',
            backgroundColor: 'red',
            pointRadius: 7,
            showLine: false
        }
    ];

    chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: { datasets },
        options: {
            scales: {
                x: { title: { display: true, text: 'X' } },
                y: { title: { display: true, text: 'Y' } }
            },
            plugins: { legend: { position: 'top' } }
        }
    });
}

// Función para descargar CSV con puntos y punto interpolado
function downloadCSV(points, estimatedPoint) {
    let csv = "X,Y\n";
    points.forEach(([x,y]) => { csv += `${x},${y}\n`; });
    csv += `${estimatedPoint[0]},${estimatedPoint[1]}\n`;

    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'datos_interpolacion.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Descargar imagen y CSV al click en botón
downloadBtn.addEventListener('click', () => {
    if (!latestPoints.length || !latestEstimatedPoint) {
        alert('No hay datos para descargar.');
        return;
    }

    // Descargar CSV
    downloadCSV(latestPoints, latestEstimatedPoint);

    // Mostrar imagen en popup para descargar
    const imageURL = canvas.toDataURL('image/png');
    const popup = window.open('', '_blank');
    popup.document.write(`
        <html><head><title>Gráfica Interpolada</title></head>
        <body style="text-align:center; font-family:Arial, sans-serif;">
            <h2>Gráfica Interpolada</h2>
            <img src="${imageURL}" style="max-width:100%; height:auto;" />
            <br><br>
            <a href="${imageURL}" download="grafica_interpolada.png">
                <button>Descargar Imagen</button>
            </a>
        </body></html>
    `);
});
