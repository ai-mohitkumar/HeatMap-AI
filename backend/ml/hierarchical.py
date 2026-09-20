"""
Hierarchical Clustering Comparison Engine
Implements Agglomerative Hierarchical Clustering, Linkage Computation, 
and comparative evaluation against K-Means (Silhouette, Cophenetic, ARI, NMI).
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from scipy.cluster.hierarchy import linkage, cophenet, fcluster
from scipy.spatial.distance import pdist
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics import silhouette_score, adjusted_rand_score, normalized_mutual_info_score, davies_bouldin_score

class HierarchicalClusterEngine:
    """
    Performs Agglomerative Hierarchical Clustering and systematic comparison with K-Means.
    """

    def __init__(self, linkage_method: str = "ward"):
        self.linkage_method = linkage_method
        self.linkage_matrix: np.ndarray = None
        self.cophenetic_corr: float = None

    def compute_linkage(self, X_scaled: np.ndarray) -> Tuple[np.ndarray, float]:
        """
        Computes the hierarchical linkage matrix and the Cophenetic correlation coefficient.
        For large datasets, uses a representative stratified subsample for responsive rendering.
        """
        # If matrix is large, sample up to 300 points for crisp linkage/dendrogram calculations
        n_samples = X_scaled.shape[0]
        if n_samples > 350:
            indices = np.linspace(0, n_samples - 1, 350, dtype=int)
            X_sample = X_scaled[indices]
        else:
            X_sample = X_scaled

        # Calculate pairwise euclidean distances and hierarchical linkage
        dist_matrix = pdist(X_sample, metric="euclidean")
        Z = linkage(dist_matrix, method=self.linkage_method)
        c_corr, _ = cophenet(Z, dist_matrix)
        
        self.linkage_matrix = Z
        self.cophenetic_corr = float(c_corr)
        return Z, self.cophenetic_corr

    def fit_predict(self, X_scaled: np.ndarray, n_clusters: int = 4) -> np.ndarray:
        """
        Fits AgglomerativeClustering with specified cluster count.
        """
        model = AgglomerativeClustering(n_clusters=n_clusters, metric="euclidean", linkage=self.linkage_method)
        labels = model.fit_predict(X_scaled)
        return labels

    def compare_with_kmeans(self, X_scaled: np.ndarray, kmeans_labels: np.ndarray, n_clusters: int = 4) -> Dict[str, Any]:
        """
        Conducts rigorous statistical comparison between K-Means (partition clustering)
        and Agglomerative Clustering (hierarchical clustering).
        """
        hier_labels = self.fit_predict(X_scaled, n_clusters=n_clusters)
        
        # Calculate metric scores
        hier_sil = float(silhouette_score(X_scaled, hier_labels))
        hier_db = float(davies_bouldin_score(X_scaled, hier_labels))
        km_sil = float(silhouette_score(X_scaled, kmeans_labels))
        km_db = float(davies_bouldin_score(X_scaled, kmeans_labels))
        
        # Cluster consensus metrics
        ari = float(adjusted_rand_score(kmeans_labels, hier_labels))
        nmi = float(normalized_mutual_info_score(kmeans_labels, hier_labels))

        if self.linkage_matrix is None:
            self.compute_linkage(X_scaled)

        return {
            "n_clusters": n_clusters,
            "linkage_method": self.linkage_method,
            "cophenetic_correlation": round(self.cophenetic_corr if self.cophenetic_corr is not None else 0.0, 4),
            "adjusted_rand_index": round(ari, 4),
            "normalized_mutual_info": round(nmi, 4),
            "kmeans": {
                "silhouette_score": round(km_sil, 4),
                "davies_bouldin_index": round(km_db, 4)
            },
            "hierarchical": {
                "silhouette_score": round(hier_sil, 4),
                "davies_bouldin_index": round(hier_db, 4)
            },
            "comparison_summary": (
                f"Agglomerative Clustering ({self.linkage_method}) exhibits an Adjusted Rand Index of {ari:.2f} "
                f"with K-Means, demonstrating {'substantial' if ari > 0.7 else 'moderate'} partition concordance. "
                f"K-Means achieves Silhouette={km_sil:.3f} vs Hierarchical Silhouette={hier_sil:.3f}."
            )
        }
