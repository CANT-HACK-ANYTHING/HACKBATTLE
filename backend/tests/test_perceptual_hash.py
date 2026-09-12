"""
Unit tests for Perceptual Hashing & Hamming Distance
"""
from PIL import Image
from backend.app.memory.perceptual_hash import (
    compute_ahash,
    compute_dhash,
    generate_synthetic_element,
    hamming_distance,
    normalized_hash_distance,
)


def test_dhash_identical_images():
    img1 = generate_synthetic_element("Submit Payment", bg_color="#2563eb")
    img2 = generate_synthetic_element("Submit Payment", bg_color="#2563eb")
    
    hash1 = compute_dhash(img1)
    hash2 = compute_dhash(img2)
    
    assert hash1 == hash2
    assert hamming_distance(hash1, hash2) == 0
    assert normalized_hash_distance(hash1, hash2) == 0.0


def test_dhash_different_images():
    img1 = generate_synthetic_element("Submit Payment", bg_color="#2563eb")
    img2 = generate_synthetic_element("Delete All Logs", bg_color="#dc2626")
    
    hash1 = compute_dhash(img1)
    hash2 = compute_dhash(img2)
    
    dist = hamming_distance(hash1, hash2)
    assert dist > 0
    assert normalized_hash_distance(hash1, hash2) > 0.0


def test_hamming_distance_exact_bits():
    h1 = "0000000000000000"
    h2 = "0000000000000001"
    assert hamming_distance(h1, h2) == 1

    h3 = "ffffffffffffffff"
    assert hamming_distance(h1, h3) == 64
    assert normalized_hash_distance(h1, h3) == 1.0


def test_ahash_computation():
    img = Image.new("RGB", (64, 64), color="white")
    h = compute_ahash(img)
    assert len(h) == 16
