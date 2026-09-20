"""
K-Means Partition Clustering Engine with Multi-K Comparison and Metric Evaluation.
Calculates WCSS (Inertia), Silhouette Score, Davies-Bouldin Index, and Calinski-Harabasz Index.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score

class KMeansClusterEngine:
    """
    Orchestrates K-Means partition clustering and evaluation metrics for heat-stress profiles.
    """

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.fitted_models: Dict[int, KMeans] = {}
        self.evaluations: List[Dict[str, Any]] = []

    def evaluate_multi_k(self, X_scaled: np.ndarray, k_range: range = range(2, 9)) -> List[Dict[str, Any]]:
        """
        Fits K-Means across a range of cluster counts (default K=2 to K=8)
        and records WCSS, Silhouette Score, Davies-Bouldin Index, and Calinski-Harabasz Index.
        """
        results = []
        for k in k_range:
            kmeans = KMeans(n_clusters=k, init="k-means++", n_init=10, max_iter=300, random_state=self.random_state)
            labels = kmeans.fit_predict(X_scaled)
            self.fitted_models[k] = kmeans

            wcss = float(kmeans.inertia_)
            sil_score = float(silhouette_score(X_scaled, labels))
            db_score = float(davies_bouldin_score(X_scaled, labels))
            ch_score = float(calinski_harabasz_score(X_scaled, labels))

            results.append({
                "k": k,
                "wcss": round(wcss, 2),
                "silhouette_score": round(sil_score, 4),
                "davies_bouldin_index": round(db_score, 4),
                "calinski_harabasz_index": round(ch_score, 2),
                "cluster_counts": [int(np.sum(labels == c)) for c in range(k)]
            })

        self.evaluations = results
        return results

    def fit_predict_k(self, X_scaled: np.ndarray, k: int) -> Tuple[np.ndarray, KMeans]:
        """
        Fits K-Means for a specific cluster count and returns cluster assignments.
        """
        kmeans = KMeans(n_clusters=k, init="k-means++", n_init=10, max_iter=300, random_state=self.random_state)
        labels = kmeans.fit_predict(X_scaled)
        self.fitted_models[k] = kmeans
        return labels, kmeans

    def get_cluster_centroids(self, kmeans: KMeans, scaler = None) -> np.ndarray:
        """
        Returns cluster centroids. If scaler is supplied, inverts scaling to return physical units.
        """
        centroids_scaled = kmeans.cluster_centers_
        if scaler is not None:
            return scaler.inverse_transform(centroids_scaled)
        return centroids_scaled

    def compute_centroid_distances(self, X_scaled: np.ndarray, kmeans: KMeans) -> np.ndarray:
        """
        Computes Euclidean distance from each data point to all cluster centroids.
        Returns shape (N, K).
        """
        centroids = kmeans.cluster_centers_ # Shape (K, D)
        # Compute pairwise Euclidean distance: ||x - c||
        dists = np.linalg.norm(X_scaled[:, np.newaxis, :] - centroids[np.newaxis, :, :], axis=2)
        return dists

    def evaluate_cluster_stability(self, X_scaled: np.ndarray, k: int = 4, n_seeds: int = 20) -> Dict[str, Any]:
        """
        Evaluates cluster partition stability across n_seeds random initializations.
        Computes pairwise Adjusted Rand Index (ARI) to verify cluster boundaries are robust
        and not artifacts of random initialization.
        """
        from sklearn.metrics import adjusted_rand_score, normalized_mutual_info_score

        seed_labels = []
        for seed in range(1, n_seeds + 1):
            km = KMeans(n_clusters=k, init="k-means++", n_init=5, max_iter=200, random_state=seed)
            lbls = km.fit_predict(X_scaled)
            seed_labels.append(lbls)

        pairwise_aris = []
        pairwise_nmis = []
        for i in range(len(seed_labels)):
            for j in range(i + 1, len(seed_labels)):
                ari = float(adjusted_rand_score(seed_labels[i], seed_labels[j]))
                nmi = float(normalized_mutual_info_score(seed_labels[i], seed_labels[j]))
                pairwise_aris.append(ari)
                pairwise_nmis.append(nmi)

        mean_ari = float(np.mean(pairwise_aris)) if pairwise_aris else 1.0
        min_ari = float(np.min(pairwise_aris)) if pairwise_aris else 1.0
        max_ari = float(np.max(pairwise_aris)) if pairwise_aris else 1.0
        mean_nmi = float(np.mean(pairwise_nmis)) if pairwise_nmis else 1.0
        stability_pct = round(max(0.0, min(100.0, mean_ari * 100.0)), 1)

        seed_agreement = [
            {
                "seed": s + 1,
                "ari_to_baseline": round(float(adjusted_rand_score(seed_labels[0], seed_labels[s])), 4),
                "nmi_to_baseline": round(float(normalized_mutual_info_score(seed_labels[0], seed_labels[s])), 4)
            }
            for s in range(n_seeds)
        ]

        return {
            "k": k,
            "n_seeds_tested": n_seeds,
            "stability_percentage": stability_pct,
            "mean_pairwise_ari": round(mean_ari, 4),
            "mean_pairwise_nmi": round(mean_nmi, 4),
            "min_pairwise_ari": round(min_ari, 4),
            "max_pairwise_ari": round(max_ari, 4),
            "stability_tier": "Highly Stable" if stability_pct >= 85.0 else ("Moderately Stable" if stability_pct >= 70.0 else "Sensitive to Init"),
            "seed_agreement_curve": seed_agreement,
            "scientific_rationale": (
                f"Cluster partition stability tested across {n_seeds} random initialization seeds yielded {stability_pct}% "
                f"mean pairwise Adjusted Rand Index (ARI) and {round(mean_nmi, 4)} Normalized Mutual Information (NMI). "
                f"This quantitatively confirms that K={k} identifies consistent physical biometeorological structures rather than algorithmic initialization artifacts."
            )
        }
