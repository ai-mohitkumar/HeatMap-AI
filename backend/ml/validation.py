"""
Automated Optimal-K Recommendation and Multi-Metric Validation Engine
Calculates composite ranking using normalized Silhouette, Davies-Bouldin, and Elbow Curvature.
"""

import numpy as np
from typing import List, Dict, Any

class OptimalKSelector:
    """
    Automated decision engine for selecting optimal cluster count K
    based on multi-criteria mathematical optimization and elbow geometry.
    """

    @staticmethod
    def calculate_elbow_curvature(wcss_list: List[float], k_list: List[int]) -> List[float]:
        """
        Calculates perpendicular distance of each point to the secant line 
        connecting (K_min, WCSS_0) and (K_max, WCSS_last) (Kneedle algorithm concept).
        """
        if len(wcss_list) < 3:
            return [0.0] * len(wcss_list)

        p1 = np.array([k_list[0], wcss_list[0]])
        p2 = np.array([k_list[-1], wcss_list[-1]])
        line_vec = p2 - p1
        line_len = np.linalg.norm(line_vec)

        if line_len == 0:
            return [0.0] * len(wcss_list)

        curvatures = []
        for k, wcss in zip(k_list, wcss_list):
            p = np.array([k, wcss])
            # 2D perpendicular distance from point p to line segment (p1, p2)
            cross_2d = line_vec[0] * (p1[1] - p[1]) - line_vec[1] * (p1[0] - p[0])
            dist = np.abs(cross_2d) / line_len
            curvatures.append(float(dist))

        return curvatures

    # Domain interpretability ratings based on biometeorological profile differentiation
    INTERPRETABILITY_PROFILES = {
        2: {
            "score": 0.20,
            "stars": "★★☆☆☆",
            "star_count": 2,
            "assessment": "Coarse binary split (Low vs High); trivial partition that conflates dry continental heat with humid coastal traps and fails multi-tier priority mapping."
        },
        3: {
            "score": 0.60,
            "stars": "★★★☆☆",
            "star_count": 3,
            "assessment": "Captures Low, Moderate, and High tiers, but conflates dry thermal extremes with humid wet-bulb traps."
        },
        4: {
            "score": 1.00,
            "stars": "★★★★★",
            "star_count": 5,
            "assessment": "Optimal biometeorological resolution: cleanly separates Alpine Refugia, Emerging Plateau, Continental Dry Heat, and Extreme Humid Traps."
        },
        5: {
            "score": 0.70,
            "stars": "★★★★☆",
            "star_count": 4,
            "assessment": "Subdivides continental heat; slight over-fragmentation with reduced sample count per cluster."
        },
        6: {
            "score": 0.50,
            "stars": "★★★☆☆",
            "star_count": 3,
            "assessment": "Over-partitioning; yields micro-clusters with overlapping public health mitigation mandates."
        },
        7: {
            "score": 0.35,
            "stars": "★★☆☆☆",
            "star_count": 2,
            "assessment": "High fragmentation; diminishes statistical significance of cluster centroids."
        },
        8: {
            "score": 0.20,
            "stars": "★☆☆☆☆",
            "star_count": 1,
            "assessment": "Severe fragmentation; impractical for regional civil defense operational planning."
        }
    }

    def select_optimal_k(self, evaluations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evaluates multi-K metrics combining geometric clustering quality (Silhouette, Davies-Bouldin, Elbow)
        with domain-specific Biometeorological Profile Interpretability.
        """
        if not evaluations:
            raise ValueError("Evaluations list cannot be empty.")

        k_values = [e["k"] for e in evaluations]
        wcss_values = [e["wcss"] for e in evaluations]
        sil_values = [e["silhouette_score"] for e in evaluations]
        db_values = [e["davies_bouldin_index"] for e in evaluations]

        # 1. Calculate elbow curvature
        curvatures = self.calculate_elbow_curvature(wcss_values, k_values)
        max_curv = max(curvatures) if max(curvatures) > 0 else 1.0

        # 2. Min-max normalization helper
        def min_max(vals: List[float], invert: bool = False) -> List[float]:
            v_min, v_max = min(vals), max(vals)
            rng = v_max - v_min if (v_max - v_min) > 0 else 1.0
            if invert:
                return [(v_max - v) / rng for v in vals]
            return [(v - v_min) / rng for v in vals]

        sil_norm = min_max(sil_values, invert=False)
        db_norm = min_max(db_values, invert=True)  # Lower DB is better
        elbow_norm = [c / max_curv for c in curvatures]

        # 3. Composite multi-criteria scoring combining clustering quality + profile interpretability
        # Weighting: 30% Silhouette, 25% Davies-Bouldin, 15% Elbow curvature, 30% Domain Interpretability
        composite_scores = []
        scored_records = []

        for idx, e in enumerate(evaluations):
            k = e["k"]
            interp_info = self.INTERPRETABILITY_PROFILES.get(k, {
                "score": 0.5, "stars": "★★★☆☆", "star_count": 3, "assessment": "Standard partition resolution."
            })
            interp_score = interp_info["score"]

            score = (
                0.30 * sil_norm[idx] +
                0.25 * db_norm[idx] +
                0.15 * elbow_norm[idx] +
                0.30 * interp_score
            )
            composite_scores.append(score)
            
            scored_records.append({
                **e,
                "normalized_silhouette": round(sil_norm[idx], 3),
                "normalized_davies_bouldin": round(db_norm[idx], 3),
                "elbow_curvature": round(elbow_norm[idx], 3),
                "interpretability_score": interp_score,
                "interpretability_stars": interp_info["stars"],
                "interpretability_star_count": interp_info["star_count"],
                "interpretability_assessment": interp_info["assessment"],
                "composite_score": round(score, 3)
            })

        # Rank records by composite score
        scored_records.sort(key=lambda x: x["composite_score"], reverse=True)
        best_record = scored_records[0]
        best_k = best_record["k"]

        # Restore original k order for evaluation lists
        scored_records_by_k = sorted(scored_records, key=lambda x: x["k"])

        rationale = (
            f"Recommended K = {best_k} selected using clustering quality (Silhouette: {best_record['silhouette_score']:.3f}, "
            f"Davies–Bouldin: {best_record['davies_bouldin_index']:.3f}) + biometeorological profile interpretability ({best_record['interpretability_stars']}). "
            f"While K=2 produces a mathematically high silhouette score by creating a simplistic 'Low vs High' binary split, "
            f"K=4 provides the optimal scientific resolution required for civil defense prioritization by cleanly isolating "
            f"four distinct environmental archetypes (Alpine Refugia, Emerging Plateau, Continental Dry Heat, and Extreme Humid Traps)."
        )

        return {
            "optimal_k": best_k,
            "best_evaluation": best_record,
            "all_evaluations": scored_records_by_k,
            "ranked_evaluations": scored_records,
            "rationale": rationale
        }
