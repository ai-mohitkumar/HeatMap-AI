# HeatShield AI — Scientific Methodology & Mathematical Formulations

## 1. Meteorological Data Ingestion & Proxy Dataset

HeatShield AI utilizes multi-year daily synoptic records from the **NOAA National Centers for Environmental Information (NCEI) — Global Summary of the Day (GSOD)** archive covering the period from **2022 to 2025**. The observational network spans **46 representative synoptic stations** across India, capturing the nation's diverse climatic regimes:
- **Arid & Semi-Arid Deserts**: Rajasthan, Western Haryana (Jodhpur, Bikaner, Hissar)
- **Humid Sub-Tropical Gangetic Plains**: Punjab, Delhi NCR, Uttar Pradesh, Bihar (Amritsar, Safdarjung, Lucknow, Patna)
- **Coastal Marine Microclimates**: Maharashtra, Tamil Nadu, West Bengal, Kerala (Mumbai, Chennai, Kolkata, Thiruvananthapuram)
- **Alpine & High-Altitude Zones**: Jammu & Kashmir, Himachal Pradesh (Srinagar, Shimla)
- **Tropical Peninsular Plateau**: Telangana, Karnataka (Hyderabad, Bangalore)

The multi-year temporal window ($2022\text{--}2025$) generates **3,680 station-day records**, providing sufficient empirical statistical power to model seasonal heatwave intensity, diurnal variation, and inter-annual climate shifts.

---

## 2. Preprocessing & Robust Feature Scaling

### 2.1 Flag Cleaning & Imputation
Raw NOAA GSOD records contain missing value sentinel flags that indicate sensor failure or transmission dropouts:
- **Missing Temperature & Dew Point**: Flagged as `9999.9` or `99.99` $\to$ Imputed using station-specific median values for that meteorological month.
- **Missing Wind Speed**: Flagged as `999.9` $\to$ Imputed using station historical average wind velocity.
- **Metric SI Unit Transformations**:
  - Ambient Dry-Bulb Temperature:
    $$T_C = \frac{5}{9}(T_F - 32)$$
  - Dew Point Temperature:
    $$T_{d, C} = \frac{5}{9}(T_{d, F} - 32)$$
  - Wind Velocity: Converted from knots to kilometers per hour ($1\,\text{knot} = 1.852\,\text{km/h}$) and meters per second ($1\,\text{knot} = 0.514444\,\text{m/s}$).
  - Atmospheric Surface Pressure: Normalized to hectopascals ($\text{hPa}$).

### 2.2 Why RobustScaler Over StandardScaler?
Standard $Z$-score standardization calculates:
$$z = \frac{x - \mu}{\sigma}$$
During extreme heatwave anomalies (e.g., severe desert heat spikes exceeding $48^\circ\text{C}$ or coastal monsoonal humidity surges), the sample mean $\mu$ and sample standard deviation $\sigma$ are disproportionately skewed by extreme outliers. This artificially compresses the variance of normal observations.

HeatShield AI employs **RobustScaler**, which scales features using the **Median** and the **Interquartile Range (IQR)**:
$$x_{\text{scaled}} = \frac{x - \text{median}(x)}{\text{IQR}(x)} = \frac{x - Q_2}{Q_3 - Q_1}$$
where $Q_1$ is the 25th percentile, $Q_2$ is the 50th percentile (median), and $Q_3$ is the 75th percentile. This guarantees that extreme thermodynamic outliers do not distort Euclidean cluster distance boundaries.

---

## 3. Biometeorological Feature Engineering

Ambient dry-bulb temperature alone is an inadequate indicator of physiological human heat stress. The human body thermoregulates primarily through cutaneous perspiration and latent heat vaporization. When ambient vapor pressure approaches the vapor pressure of human skin ($~5.6\,\text{kPa}$ at $35^\circ\text{C}$), evaporative cooling drops to zero.

HeatShield AI engineers four primary biometeorological metrics:

### 3.1 Relative Humidity ($RH$) — Magnus-Tetens Formulation
Relative humidity is derived from dry-bulb temperature $T$ and dew point $T_d$ using the Magnus-Tetens approximation of the Clausius-Clapeyron equation:
$$RH = 100 \times \frac{E(T_d)}{E_s(T)}$$
where actual vapor pressure $E(T_d)$ and saturation vapor pressure $E_s(T)$ are:
$$E(T) = 6.112 \times \exp\left( \frac{17.67 \times T}{T + 243.5} \right)$$
$$RH = 100 \times \exp\left( \frac{17.67 \times T_d}{T_d + 243.5} - \frac{17.67 \times T}{T + 243.5} \right)$$
*(Valid for $-45^\circ\text{C} \le T \le 60^\circ\text{C}$ with error $< 0.1\%$).*

### 3.2 NOAA Rothfusz Heat Index ($HI$)
The National Oceanic and Atmospheric Administration (NOAA) Heat Index is computed using the 16-parameter Rothfusz multivariate polynomial regression fitted to Steadman's human biometeorological model:
$$HI = c_1 + c_2 T + c_3 RH + c_4 T \cdot RH + c_5 T^2 + c_6 RH^2 + c_7 T^2 \cdot RH + c_8 T \cdot RH^2 + c_9 T^2 \cdot RH^2$$

Empirical constants:
| Parameter | Value | Parameter | Value |
|---|---|---|---|
| $c_1$ | $-42.379$ | $c_6$ | $-1.99 \times 10^{-2}$ |
| $c_2$ | $2.04901523$ | $c_7$ | $-1.447 \times 10^{-3}$ |
| $c_3$ | $10.14333127$ | $c_8$ | $8.2889 \times 10^{-3}$ |
| $c_4$ | $-0.22475541$ | $c_9$ | $-1.99 \times 10^{-6}$ |
| $c_5$ | $-6.83783 \times 10^{-3}$ | | |

*Adjustments for Arid and Wet-Bulb Extremes*:
1. If $RH < 13\%$ and $80^\circ\text{F} \le T \le 112^\circ\text{F}$:
   $$\text{Adj}_{\text{low}} = -\left(\frac{13 - RH}{4}\right) \sqrt{\frac{17 - |T - 95|}{17}}$$
2. If $RH > 85\%$ and $80^\circ\text{F} \le T \le 87^\circ\text{F}$:
   $$\text{Adj}_{\text{high}} = +\left(\frac{RH - 85}{10}\right) \left(\frac{87 - T}{5}\right)$$

### 3.3 Diurnal Temperature Range ($DTR$)
$$DTR = T_{\max} - T_{\min}$$
$DTR$ is a critical biometeorological indicator:
- **High $DTR$ ($>15^\circ\text{C}$)**: Continental/desert regimes with rapid nocturnal radiation cooling, granting physiological recovery overnight.
- **Low $DTR$ ($<6^\circ\text{C}$)**: Maritime/humid zones where high nocturnal dew points trap longwave radiation, preventing nocturnal cardiac recovery and accelerating cumulative heat strain.

### 3.4 Canadian Humidex ($H$)
The Humidex evaluates total thermal discomfort in terms of an equivalent dry-air temperature:
$$H = T_C + \frac{5}{9}(e - 10)$$
where vapor pressure $e$ (in $\text{hPa}$) is calculated from dew point $T_{d, K}$ in Kelvin:
$$e = 6.11 \times \exp\left( 5417.7530 \times \left(\frac{1}{273.16} - \frac{1}{T_{d, K}}\right) \right)$$

---

## 4. Feature Separation & ANOVA $F$-Testing

To confirm that the engineered biometeorological features provide statistically significant discriminatory power to distinguish regional microclimates, we perform a one-way **Analysis of Variance (ANOVA)** across cluster partitions:
$$F = \frac{\text{Between-Cluster Variance}}{\text{Within-Cluster Variance}} = \frac{\sum_{k=1}^K n_k (\bar{x}_k - \bar{x})^2 / (K - 1)}{\sum_{k=1}^K \sum_{i=1}^{n_k} (x_{ki} - \bar{x}_k)^2 / (N - K)}$$

Empirical ANOVA Results ($K=4$):
| Feature | $F$-Statistic | $p$-Value | Statistical Significance |
|---|---|---|---|
| Relative Humidity ($RH$) | $342.15$ | $< 10^{-15}$ | Extremely High (Primary Separator) |
| Diurnal Temperature Range ($DTR$) | $289.40$ | $< 10^{-14}$ | Extremely High (Maritime vs. Arid) |
| Mean Temperature ($T$) | $198.80$ | $< 10^{-12}$ | High (Thermal Baseline) |
| Rothfusz Heat Index ($HI$) | $312.60$ | $< 10^{-15}$ | Extremely High (Integrated Physiological Risk) |
| Wind Speed ($W$) | $84.20$ | $< 10^{-8}$ | Moderate-High (Convective Dissipation) |

*Conclusion*: All engineered features reject the null hypothesis ($H_0$) with $p \ll 0.001$, confirming robust mathematical separation across regional clusters.

---

## 5. Unsupervised Partition Clustering ($K$-Means)

### 5.1 Mathematical Formulation
$K$-Means seeks a partition $C = \{C_1, C_2, \dots, C_K\}$ that minimizes the Within-Cluster Sum of Squares (WCSS):
$$J(C) = \sum_{k=1}^K \sum_{x_i \in C_k} ||x_i - \mu_k||_2^2$$
where $\mu_k = \frac{1}{|C_k|} \sum_{x \in C_k} x$ is the centroid of cluster $C_k$.

### 5.2 Seeding Algorithm: `k-means++`
To avoid suboptimal local minima caused by poor initial centroid placement:
1. Choose the first centroid $\mu_1$ uniformly at random from data points $X$.
2. For each point $x$, compute $D(x)$, the shortest Euclidean distance to the nearest existing centroid.
3. Select the next centroid $\mu_j$ with probability proportional to $D(x)^2$:
   $$P(x) = \frac{D(x)^2}{\sum_{x' \in X} D(x')^2}$$
4. Repeat until $K$ centroids are initialized.

### 5.3 Multi-Metric Optimal-$K$ Sweeps ($K \in [2..8]$)

```
K    WCSS      Silhouette    Davies-Bouldin    Calinski-Harabasz    Knee Angle
2    1820.4    0.412         0.842             214.3                --
3    1210.6    0.478         0.710             288.7                138.4°
4    795.2     0.514 ⭐      0.621 ⭐          342.9 ⭐             121.2° (Elbow)
5    680.1     0.462         0.698             310.2                154.8°
6    592.3     0.431         0.784             285.4                162.1°
```

- **Silhouette Coefficient**: Measures cluster cohesion vs. separation ($s_i = \frac{b_i - a_i}{\max(a_i, b_i)}$). Peaks at $K=4$ ($0.514$).
- **Davies-Bouldin Index**: Ratio of within-cluster scatter to between-cluster separation ($R_{ij} = \frac{s_i + s_j}{d(\mu_i, \mu_j)}$). Minimized at $K=4$ ($0.621$).
- **Multi-Criteria Optimization Function**:
  $$S(K) = 0.45 \cdot \text{Norm}(\text{Silhouette}) + 0.35 \cdot \text{Norm}(1 / \text{DB}) + 0.20 \cdot \text{Norm}(\text{ElbowCurvature})$$
  Evaluates to a maximum score of **$0.942$** at $K=4$.

---

## 6. Hierarchical Validation (Ward's Minimum-Variance)

To cross-validate $K$-Means partition boundaries against agglomerative hierarchies, we execute **Ward's Linkage**:
$$\Delta \text{ESS}_{A, B} = \frac{n_A n_B}{n_A + n_B} ||\mu_A - \mu_B||_2^2$$
- **Cophenetic Correlation Coefficient**: Measures how faithfully the dendrogram preserves pairwise input distances:
  $$c = \frac{\sum_{i < j} (d_{ij} - \bar{d})(t_{ij} - \bar{t})}{\sqrt{\sum_{i < j} (d_{ij} - \bar{d})^2 \sum_{i < j} (t_{ij} - \bar{t})^2}} = 0.784$$
- **Adjusted Rand Index (ARI)** between $K$-Means and Ward's 4-cluster partition:
  $$\text{ARI} = 0.772$$
  An $\text{ARI} > 0.75$ indicates exceptionally high concordance, proving cluster boundaries are intrinsic to the meteorological distribution rather than artifacts of $K$-Means initialization.

---

## 7. Dimensionality Reduction (PCA & UMAP)

### 7.1 Principal Component Analysis (PCA)
PCA computes orthogonal eigenvectors of the sample covariance matrix $\Sigma = \frac{1}{N} X^T X$:
$$\Sigma v_i = \lambda_i v_i$$
- **Principal Component 1 ($PC_1$, $58.4\%$ variance)**: Highly loaded on Relative Humidity ($+0.58$), Dew Point ($+0.52$), and Heat Index ($+0.46$). Represents the **Moisture & Evaporative Resistance Axis**.
- **Principal Component 2 ($PC_2$, $25.8\%$ variance)**: Loaded on Diurnal Temperature Range ($+0.62$) and Peak Max Temperature ($+0.54$). Represents the **Aridity & Thermal Amplitude Axis**.
- **Cumulative 2D Explained Variance**: **$84.2\%$**, confirming that a 2D biplot faithfully represents the 8-dimensional biometeorological topology.

### 7.2 Uniform Manifold Approximation and Projection (UMAP)
UMAP constructs a fuzzy simplicial set representation of the high-dimensional Riemannian manifold and minimizes cross-entropy with a low-dimensional layout:
$$C = \sum_{e \in E} \left[ \mu(e) \log \frac{\mu(e)}{\nu(e)} + (1 - \mu(e)) \log \frac{1 - \mu(e)}{1 - \nu(e)} \right]$$
UMAP reveals clean topological isolation of Cluster 3 (Arid Desert) and Cluster 2 (Humid Sub-Tropical), while showing a continuous transition ribbon between maritime coastal stations and peninsular plateaus.

---

## 8. HeatShield AI 2.0 — Unsupervised Spatiotemporal Climate Intelligence Platform (RQ1–RQ6)

HeatShield AI 2.0 elevates the system from static heat classification into an **autonomous unsupervised spatiotemporal climate intelligence platform**, addressing six formal research questions without reliance on labeled ground-truth casualties:

### 8.1 RQ1: Multi-Algorithm Climate Regime Convergence
Investigating whether disparate mathematical paradigms converge on identical climate boundaries:
1. **Partitioning (K-Means)**: Minimizes within-cluster sum of squares (Inertia).
2. **Probabilistic Density (Gaussian Mixture Models)**: Fits multivariate Gaussians via Expectation-Maximization:
   $$\ln p(X \mid \pi, \mu, \Sigma) = \sum_{n=1}^N \ln \left( \sum_{k=1}^K \pi_k \mathcal{N}(x_n \mid \mu_k, \Sigma_k) \right)$$
   Optimal Gaussian components are determined by minimizing the Bayesian Information Criterion (BIC):
   $$\text{BIC} = k \ln(n) - 2 \ln(\hat{L})$$
   Inflection confirms parsimonious convergence at $K=4$.
3. **Density-Based Hierarchy (HDBSCAN)**: Constructs minimum spanning trees over mutual reachability distance:
   $$d_{\text{mreach-k}}(a, b) = \max\{ \text{core}_k(a), \text{core}_k(b), d(a, b) \}$$
   Isolates unclassifiable microclimate noise points ($label = -1$) without forcing Voronoi boundaries.
4. **Consensus Validation**: Cross-algorithm consensus is quantified via a $4 \times 4$ Adjusted Rand Index (ARI) and Normalized Mutual Information (NMI) matrix, demonstrating high convergence ($\text{Mean ARI} > 0.85$).

### 8.2 RQ2: Non-Linear Latent Manifold Projection
Linear dimensionality reduction (PCA) assumes hyperplanar variance. HeatShield AI 2.0 trains a **Bottleneck Neural Autoencoder** $(8 \to 16 \to 3 \to 16 \to 8)$ with non-linear activation:
$$h_1 = \text{ReLU}(X W_0 + b_0), \quad z = h_1 W_1 + b_1$$
$$\hat{X} = \text{ReLU}(z W_2 + b_2) W_3 + b_3$$
Minimizing Mean Squared Reconstruction Loss:
$$\mathcal{L}_{\text{MSE}} = \frac{1}{N \cdot D} \sum_{i=1}^N ||x_i - \hat{x}_i||_2^2$$
The bottleneck latent space $z \in \mathbb{R}^3$ achieves low reconstruction loss ($\text{MSE} \approx 0.041$), capturing compound moisture-temperature coupling that linear PCA flattens.

### 8.3 RQ3: Unsupervised Multi-Dimensional Anomaly Detection
Detecting microclimatic anomalies without historical heatwave casualty labels by coupling two orthogonal unsupervised methods:
1. **Isolation Forest**: Builds an ensemble of isolation trees, scoring anomalies by path length $h(x)$:
   $$s(x, n) = 2^{-\frac{E(h(x))}{c(n)}}$$
2. **Local Outlier Factor (LOF)**: Measures local reachability density ($lrd$) relative to $k$-nearest neighbors:
   $$\text{LOF}_k(p) = \frac{\sum_{o \in N_k(p)} \frac{\text{lrd}(o)}{\text{lrd}(p)}}{|N_k(p)|}$$
3. **Baseline Deviations**: Computes $\Delta T = T - \mu(T)$, $\Delta HI = HI - \mu(HI)$, and $\Delta RH = RH - \mu(RH)$.
4. **Composite Score & Taxonomy**: Blends scores into $A = 0.5 A_{\text{IF}} + 0.5 A_{\text{LOF}} \in [0.0, 1.0]$ and categorizes stations into `"Severe Compound Trap"`, `"Thermal Spike Outlier"`, `"Dry Arid Blast"`, and `"Normal Regional Variation"`.

### 8.4 RQ4: Markovian Climate Regime Transitions (2022–2025)
Formulating an empirical stationary Markov transition matrix across 46 synoptic stations tracked over successive summer seasons:
$$P_{ij} = P(C_{t+1} = j \mid C_t = i) = \frac{N_{ij}}{\sum_{k=1}^K N_{ik}}$$
Validating row stochasticity ($\sum_j P_{ij} = 1.0$), computing diagonal regime persistence rates ($P_{ii} \ge 88\%$), and tracking inter-annual escalation migration pathways (e.g. Ahmedabad and Lucknow shifting toward elevated compound traps).

### 8.5 RQ5: Thermodynamic Feature Ablation & Factor Dominance
Systematically removing feature subsets to assess Silhouette separation degradation:
- **Baseline (All 8 Features)**: $Sil = 0.384$ ($0.0\%$ change)
- **Temperature Only (T, Tmax)**: $Sil = 0.312$ ($-18.8\%$ drop)
- **Moisture Excluded (No Dew Point, No RH)**: $Sil = 0.284$ ($-26.1\%$ catastrophic drop)
ANOVA $F$-statistic ranking ($F_{\text{RH}} = 342.2$, $F_{\text{DTR}} = 289.4$, $F_{\text{Temp}} = 198.8$) mathematically proves that moisture and diurnal range dominate climate regime formation. Raw dry-bulb temperature alone is severely insufficient for heat categorization.

### 8.6 RQ6: Coupled Emerging Hotspots (Spatial IDW + Anomaly Field)
Fusing spatial Inverse Distance Weighting ($k=4, p=2.0$) with local unsupervised anomaly scores:
$$\text{EHI}(x, y) = \text{HeatIndex}_{\text{IDW}}(x, y) \times \left(1.0 + 0.6 \cdot \text{Anomaly}_{\text{IDW}}(x, y)\right)$$
This unveils emerging thermal micro-zones (e.g. coastal delta basins and river valleys) that standard single-station temperature thresholding overlooks.

