document.addEventListener('DOMContentLoaded', function () {
    const plotDiv = document.getElementById('plot');
    let data = [];
    let manualCentroids = [];
    let maxCentroids = 0;

    // Update "Generate Dataset" button to show the message
    document.getElementById('generateDataset').addEventListener('click', function () {
        fetch('/generate_dataset', { method: 'POST' })
            .then(response => response.json())
            .then(dataset => {
                data = dataset.data;
                plotData(data);
                enableButtons(true);  // Enable other buttons after generating the dataset
                manualCentroids = []; // Reset manual centroids
                maxCentroids = 0; // Reset maxCentroids count
                clearConvergenceMessage();  // Show the "Convergence hasn't been reached yet" message
            });
    });

    // Step Through KMeans
    document.getElementById('stepKMeans').addEventListener('click', function () {
        const nClusters = document.getElementById('nClusters').value;
        const initMethod = document.getElementById('initMethod').value;

        fetch('/step_kmeans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ n_clusters: nClusters, init_method: initMethod, centroids: manualCentroids })
        })
            .then(response => response.json())
            .then(result => plotClusters(result, result.iterations));
    });

    // Run KMeans to Convergence
    document.getElementById('runKMeans').addEventListener('click', function () {
        const nClusters = document.getElementById('nClusters').value;
        const initMethod = document.getElementById('initMethod').value;

        fetch('/run_kmeans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ n_clusters: nClusters, init_method: initMethod, centroids: manualCentroids })
        })
            .then(response => response.json())
            .then(result => plotClusters(result, result.iterations));
    });

    // Update "Reset Algorithm" button to show the message
    document.getElementById('resetAlgorithm').addEventListener('click', function () {
        fetch('/reset', { method: 'POST' })
            .then(response => response.json())
            .then(result => {
                if (result.status === 'reset') {
                    plotData(data);  // Reset to original data points
                    enableButtons(false);  // Disable all except Generate Dataset
                    manualCentroids = []; // Clear manual centroids
                    maxCentroids = 0; // Reset maxCentroids count
                    clearConvergenceMessage();  // Show the "Convergence hasn't been reached yet" message
                }
            });
    });

    // Enable manual centroid selection
    plotDiv.on('plotly_click', function (event) {
        const initMethod = document.getElementById('initMethod').value;
        const nClusters = parseInt(document.getElementById('nClusters').value, 10);

        if (initMethod === 'manual') {
            if (manualCentroids.length < nClusters) {
                const point = event.points[0];
                const newCentroid = [point.x, point.y];
                manualCentroids.push(newCentroid);

                // Plot the selected centroids
                const traceCentroids = {
                    x: manualCentroids.map(point => point[0]),
                    y: manualCentroids.map(point => point[1]),
                    mode: 'markers',
                    type: 'scatter',
                    marker: { color: 'red', size: 12, symbol: 'x' },
                    name: 'Manual Centroids'
                };
                Plotly.addTraces(plotDiv, traceCentroids);
            } else {
                if (maxCentroids === 0) {
                    alert('Maximum number of centroids reached. Click Reset Algorithm to start over.');
                    maxCentroids = 1;  // Alert only once
                }
            }
        }
    });

     // Plot the initial data points
    function plotData(data) {
        const trace = {
            x: data.map(point => point[0]),
            y: data.map(point => point[1]),
            mode: 'markers',
            type: 'scatter',
            marker: { color: '#888' },
            name: ''
        };
        myPlot = Plotly.newPlot(plotDiv, [trace], { title: 'KMeans Clustering Data' });
        console.log('Initial plot created'); // Debug log
        
        // Add click event listener after plot is created
        plotDiv.on('plotly_click', handlePlotClick);
        console.log('Click event listener added'); // Debug log
    }

    // Separate function for handling plot clicks
    function handlePlotClick(event) {
        console.log('Plot clicked'); // Debug log
        const initMethod = document.getElementById('initMethod').value;
        const nClusters = parseInt(document.getElementById('nClusters').value, 10);
        console.log('Init method:', initMethod, 'N clusters:', nClusters); // Debug log

        if (initMethod === 'manual') {
            if (manualCentroids.length < nClusters) {
                const point = event.points[0];
                const newCentroid = [point.x, point.y];
                manualCentroids.push(newCentroid);
                console.log('New centroid added:', newCentroid); // Debug log

                // Plot the selected centroids
                const traceCentroids = {
                    x: manualCentroids.map(point => point[0]),
                    y: manualCentroids.map(point => point[1]),
                    mode: 'markers',
                    type: 'scatter',
                    marker: { color: 'red', size: 12, symbol: 'x' },
                    name: 'Manual Centroids'
                };
                Plotly.addTraces(plotDiv, traceCentroids);
                console.log('Centroid trace added to plot'); // Debug log
            } else {
                if (maxCentroids === 0) {
                    alert('Maximum number of centroids reached. Click Reset Algorithm to start over.');
                    maxCentroids = 1;  // Alert only once
                }
                console.log('Max centroids reached'); // Debug log
            }
        } else {
            console.log('Manual init not selected'); // Debug log
        }
    }

    function displayConvergenceMessage(iterations) {
        const messageDiv = document.getElementById('convergenceMessage');
        messageDiv.textContent = `Convergence reached!`;
        messageDiv.classList.remove('hidden');  // Show the message
    }

    function clearConvergenceMessage() {
        const messageDiv = document.getElementById('convergenceMessage');
        messageDiv.textContent = "Convergence hasn't been reached yet";
        messageDiv.classList.remove('hidden');  // Make sure the message is visible
    }

// Plot clustered data and transition colors
function plotClusters(result, iterations) {
    const colors = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4'];
    let traceColor = '#888';

    if (result.converged) {
        traceColor = 'blue';
        displayConvergenceMessage(iterations);
    } else if (iterations > 0) {
        const percentageTransition = Math.min(1, iterations / 10);
        const blueIntensity = Math.floor(percentageTransition * 255);
        traceColor = `rgb(0, 0, ${blueIntensity})`;
    }

    const traceData = {
        x: data.map((point, i) => point[0]),
        y: data.map((point, i) => point[1]),
        mode: 'markers',
        type: 'scatter',
        marker: { color: result.labels.map(label => traceColor) },  // Apply the transition color
        name: ''  // Set name to empty string to avoid "trace" in the legend
    };


    const traceCentroids = {
        x: result.centroids.map(point => point[0]),
        y: result.centroids.map(point => point[1]),
        mode: 'markers',
        type: 'scatter',
        marker: { color: 'red', size: 12, symbol: 'x' },
        name: 'Centroids'  // Keep the centroid label
    };

    // Create or update plot
    Plotly.react(plotDiv, [traceData, traceCentroids], {
        title: 'KMeans Clustering Animation',
        showlegend: true  // Legend is shown, but no "trace" should appear
    });
}


    // Enable or disable buttons based on the state
    function enableButtons(enable) {
        document.getElementById('stepKMeans').disabled = !enable;
        document.getElementById('runKMeans').disabled = !enable;
        document.getElementById('resetAlgorithm').disabled = !enable;
    }

    // Initially disable all buttons except Generate Dataset
    enableButtons(false);
});