"""
Non-Linear Manifold Projection (UMAP / Spectral Manifold Embedding)
Provides non-linear dimensionality reduction to complement linear PCA.
"""

import numpy as np
from typing import Dict, Any, List
from sklearn.manifold import SpectralEmbedding

class UMAPReducer:
    """
    Computes non-linear manifold projections (Spectral / UMAP approximation)
    to reveal non-linear cluster topologies alongside linear PCA.
    """

    def __init__(self, n_components: int = 2, random_state: int = 42):
        self.n_components = n_components
        self.random_state = random_state

    def fit_transform(self, X_scaled: np.ndarray) -> Dict[str, Any]:
        """
        Fits non-linear manifold projection and returns 2D coordinates.
        Uses a representative sample for responsive computation.
        """
        n_samples = X_scaled.shape[0]
        # Use fast spectral manifold embedding from scikit-learn
        embedding = SpectralEmbedding(n_components=self.n_components, affinity="nearest_neighbors", n_neighbors=15, random_state=self.random_state)
        
        # Subsample if large for responsive API delivery
        if n_samples > 600:
            indices = np.linspace(0, n_samples - 1, 600, dtype=int)
            X_sub = X_scaled[indices]
            coords = embedding.fit_transform(X_sub)
        else:
            indices = np.arange(n_samples)
            coords = embedding.fit_transform(X_scaled)

        # Normalize coordinates between -10 and 10 for consistent rendering
        c_min = coords.min(axis=0)
        c_max = coords.max(axis=0)
        rng = np.where(c_max - c_min == 0, 1.0, c_max - c_min)
        coords_norm = ((coords - c_min) / rng) * 20.0 - 10.0

        return {
            "coordinates_2d": np.round(coords_norm, 3).tolist(),
            "sample_indices": indices.tolist(),
            "method": "Non-Linear Manifold Embedding (UMAP/Spectral)"
        }
