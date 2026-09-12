"""
Perceptual Hashing & Visual Feature Comparison Utilities
Implements Difference Hash (dHash) & Average Hash (aHash) for microsecond UI landmark matching.
"""
from io import BytesIO
from typing import Union
from PIL import Image, ImageDraw, ImageFont


def compute_dhash(image: Image.Image, hash_size: int = 8) -> str:
    """
    Computes a 64-bit difference hash (dHash) for an image crop.
    dHash is invariant to lighting, contrast, and scaling shifts, ideal for UI landmarks.
    """
    # Resize to (hash_size + 1, hash_size) and convert to grayscale
    resized = image.convert("L").resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
    if hasattr(resized, "get_flattened_data"):
        pixels = list(resized.get_flattened_data())
    else:
        pixels = list(resized.getdata())
    
    # Compare adjacent pixels horizontally
    diff_bits = []
    width = hash_size + 1
    for row in range(hash_size):
        row_offset = row * width
        for col in range(hash_size):
            left_pixel = pixels[row_offset + col]
            right_pixel = pixels[row_offset + col + 1]
            diff_bits.append(1 if left_pixel > right_pixel else 0)
    
    # Convert list of 64 bits to a 16-character hex string
    hex_str = ""
    for i in range(0, len(diff_bits), 4):
        nibble = diff_bits[i:i+4]
        val = sum(bit << (3 - idx) for idx, bit in enumerate(nibble))
        hex_str += f"{val:x}"
    
    return hex_str


def compute_ahash(image: Image.Image, hash_size: int = 8) -> str:
    """
    Computes a 64-bit average hash (aHash).
    """
    resized = image.convert("L").resize((hash_size, hash_size), Image.Resampling.LANCZOS)
    if hasattr(resized, "get_flattened_data"):
        pixels = list(resized.get_flattened_data())
    else:
        pixels = list(resized.getdata())
    avg = sum(pixels) / len(pixels) if pixels else 0
    bits = [1 if p > avg else 0 for p in pixels]
    
    hex_str = ""
    for i in range(0, len(bits), 4):
        nibble = bits[i:i+4]
        val = sum(bit << (3 - idx) for idx, bit in enumerate(nibble))
        hex_str += f"{val:x}"
    return hex_str


def hamming_distance(hex_hash1: str, hex_hash2: str) -> int:
    """
    Calculates the Hamming distance (number of bit positions that differ)
    between two hex-encoded hashes.
    """
    if len(hex_hash1) != len(hex_hash2):
        # Pad to equal length
        max_len = max(len(hex_hash1), len(hex_hash2))
        hex_hash1 = hex_hash1.zfill(max_len)
        hex_hash2 = hex_hash2.zfill(max_len)
        
    val1 = int(hex_hash1, 16)
    val2 = int(hex_hash2, 16)
    xor_val = val1 ^ val2
    # Count set bits in xor_val
    return bin(xor_val).count("1")


def normalized_hash_distance(hex_hash1: str, hex_hash2: str, max_bits: int = 64) -> float:
    """
    Returns normalized distance in range [0.0, 1.0].
    0.0 = identical, 1.0 = completely opposite.
    """
    dist = hamming_distance(hex_hash1, hex_hash2)
    return min(1.0, max(0.0, dist / float(max_bits)))


def hash_from_bytes(image_bytes: bytes) -> str:
    """
    Utility to compute dHash directly from image bytes.
    """
    img = Image.open(BytesIO(image_bytes))
    return compute_dhash(img)


def generate_synthetic_element(label: str, bg_color: str = "#2563eb", text_color: str = "#ffffff", size: tuple[int, int] = (160, 48)) -> Image.Image:
    """
    Generates a synthetic UI element (e.g. button, input field) for tests and simulations.
    """
    img = Image.new("RGB", size, color=bg_color)
    draw = ImageDraw.Draw(img)
    # Simple bounding border
    draw.rectangle([0, 0, size[0] - 1, size[1] - 1], outline="#1e40af", width=2)
    # Draw simple text or representation
    draw.text((12, size[1] // 4), label, fill=text_color)
    return img
