"""
PCA Dimensionality Reduction Engine for Cluster Interpretation and Biplot Visualisation.
Computes 2D & 3D projections, explained variance ratio, and feature loading vectors.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any
from sklearn.decomposition import PCA

class PCAReducer:
    """
    Principal Component Analysis engine for projecting high-dimensional 
    meteorological feature space into interpretable 2D and 3D visual coordinates.
    """

    def __init__(self, n_components: int = 3):
        self.n_components = n_components
        self.pca = PCA(n_components=n_components, random_state=42)
        self.feature_names: List[str] = []

    def fit_transform(self, X_scaled: np.ndarray, feature_names: List[str]) -> Dict[str, Any]:
        """
        Fits PCA and transforms the scaled feature matrix.
        Returns coordinates, explained variance, and biplot loadings.
        """
        self.feature_names = feature_names
        coords = self.pca.fit_transform(X_scaled)

        explained_variance = [round(float(v), 4) for v in self.pca.explained_variance_ratio_]
        cumulative_variance = [round(float(v), 4) for v in np.cumsum(self.pca.explained_variance_ratio_)]

        # Extract feature loadings (eigenvector weights) for PC1 and PC2
        loadings_2d = []
        for i, feat in enumerate(feature_names):
            loadings_2d.append({
                "feature": feat,
                "pc1_loading": round(float(self.pca.components_[0, i]), 4),
                "pc2_loading": round(float(self.pca.components_[1, i]), 4),
                "magnitude": round(float(np.sqrt(self.pca.components_[0, i]**2 + self.pca.components_[1, i]**2)), 4)
            })

        # Sort loadings by vector magnitude
        loadings_2d.sort(key=lambda x: x["magnitude"], reverse=True)

        return {
            "coordinates_2d": np.round(coords[:, :2], 3).tolist(),
            "coordinates_3d": np.round(coords[:, :3], 3).tolist() if self.n_components >= 3 else [],
            "explained_variance_ratio": explained_variance,
            "cumulative_variance_ratio": cumulative_variance,
            "total_variance_explained_2d": round(sum(explained_variance[:2]) * 100, 2),
            "feature_loadings": loadings_2d
        }
