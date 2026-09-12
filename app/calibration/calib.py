import numpy as np
import cv2

def compute_homography(src_pts, dst_pts):
    """Compute a 3×3 homography matrix.
    Args:
        src_pts: list of (x, y) in camera coordinates.
        dst_pts: list of (x, y) in screen coordinates.
    Returns:
        NumPy array of shape (3, 3).
    """
    src = np.array(src_pts, dtype=np.float32)
    dst = np.array(dst_pts, dtype=np.float32)
    H, _ = cv2.findHomography(src, dst, method=0)
    return H
