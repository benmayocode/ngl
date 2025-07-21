# backend/utils/embedding.py
import numpy as np
from typing import List

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    a = np.array(vec1)
    b = np.array(vec2)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def normalize_vector(vec: List[float]) -> List[float]:
    """Normalize a vector to unit length."""
    a = np.array(vec)
    norm = np.linalg.norm(a)
    return (a / norm).tolist() if norm != 0 else a.tolist()

def mean_pooling(vectors: List[List[float]]) -> List[float]:
    """Average multiple vectors."""
    if not vectors:
        return []
    return np.mean(np.array(vectors), axis=0).tolist()
