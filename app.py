from flask import Flask, render_template, request, jsonify
import numpy as np
from sklearn.cluster import KMeans

app = Flask(__name__)

data = None
kmeans = None
iterations = 0

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_dataset', methods=['POST'])
def generate_dataset():
    global data, kmeans, iterations
    data = np.random.randn(300, 2) * 5  # Generate new random dataset
    kmeans = None
    iterations = 0
    return jsonify({'data': data.tolist()})

@app.route('/step_kmeans', methods=['POST'])
def step_kmeans():
    global data, kmeans, iterations
    n_clusters = int(request.json['n_clusters'])
    init_method = request.json['init_method']
    manual_centroids = request.json.get('centroids', None)  # Get manual centroids

    if kmeans is None:
        if init_method == 'random':
            kmeans = KMeans(n_clusters=n_clusters, init='random', n_init=1, max_iter=1)
        elif init_method == 'k-means++':
            kmeans = KMeans(n_clusters=n_clusters, init='k-means++', n_init=1, max_iter=1)
        elif init_method == 'farthest':
            initial_centroids = farthest_first_initialization(data, n_clusters)
            kmeans = KMeans(n_clusters=n_clusters, init=initial_centroids, n_init=1, max_iter=1)
        elif init_method == 'manual' and manual_centroids:  # Use manual centroids
            initial_centroids = np.array(manual_centroids)
            kmeans = KMeans(n_clusters=n_clusters, init=initial_centroids, n_init=1, max_iter=1)
        kmeans.fit(data)
        iterations = 1
    else:
        kmeans = KMeans(n_clusters=n_clusters, init=kmeans.cluster_centers_, n_init=1, max_iter=1)
        kmeans.fit(data)
        iterations += 1

    converged = kmeans.n_iter_ < kmeans.max_iter

    return jsonify({
        'labels': kmeans.labels_.tolist(),
        'centroids': kmeans.cluster_centers_.tolist(),
        'iterations': iterations,
        'converged': converged
    })

@app.route('/run_kmeans', methods=['POST'])
def run_kmeans():
    global data, kmeans, iterations
    n_clusters = int(request.json['n_clusters'])
    init_method = request.json['init_method']
    manual_centroids = request.json.get('centroids', None)  # Get manual centroids

    if kmeans is None:
        if init_method == 'random':
            kmeans = KMeans(n_clusters=n_clusters, init='random', n_init=1)
        elif init_method == 'k-means++':
            kmeans = KMeans(n_clusters=n_clusters, init='k-means++', n_init=1)
        elif init_method == 'farthest':
            initial_centroids = farthest_first_initialization(data, n_clusters)
            kmeans = KMeans(n_clusters=n_clusters, init=initial_centroids, n_init=1)
        elif init_method == 'manual' and manual_centroids:  # Use manual centroids
            initial_centroids = np.array(manual_centroids)
            kmeans = KMeans(n_clusters=n_clusters, init=initial_centroids, n_init=1)
        kmeans.fit(data)
        iterations = kmeans.n_iter_
    else:
        kmeans = KMeans(n_clusters=n_clusters, init=kmeans.cluster_centers_, n_init=1)
        kmeans.fit(data)
        iterations = kmeans.n_iter_

    converged = kmeans.n_iter_ < kmeans.max_iter

    return jsonify({
        'labels': kmeans.labels_.tolist(),
        'centroids': kmeans.cluster_centers_.tolist(),
        'iterations': iterations,
        'converged': converged
    })

@app.route('/reset', methods=['POST'])
def reset():
    global data, kmeans, iterations
    kmeans = None
    iterations = 0
    return jsonify({'status': 'reset'})

# Custom function for Farthest First Initialization
def farthest_first_initialization(data, n_clusters):
    # Select the first centroid randomly from the data points
    centroids = [data[np.random.choice(range(data.shape[0]))]]
    
    while len(centroids) < n_clusters:
        # Compute the distance from each point to the nearest centroid
        distances = np.array([min([np.linalg.norm(x - c) for c in centroids]) for x in data])
        
        # Select the point farthest from any centroid as the next centroid
        next_centroid = data[np.argmax(distances)]
        centroids.append(next_centroid)
    
    return np.array(centroids)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)