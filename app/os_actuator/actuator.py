import structlog
from pynput.mouse import Controller as MouseCtrl, Button
from pynput.keyboard import Controller as KeyboardCtrl
import win32gui

log = structlog.get_logger(__name__)
mouse = MouseCtrl()
keyboard = KeyboardCtrl()

def glide_to(x, y, duration=0.2):
    """Smoothly glide the mouse cursor to (x, y) over *duration* seconds.
    Uses linear interpolation with ~60 updates per second.
    """
    start_x, start_y = mouse.position
    steps = max(1, int(duration * 60))
    for i in range(1, steps + 1):
        ix = int(start_x + (x - start_x) * i / steps)
        iy = int(start_y + (y - start_y) * i / steps)
        mouse.position = (ix, iy)
    log.info("glided mouse", start=(start_x, start_y), end=(x, y))

def click(x, y):
    """Glide to (x, y) then perform a left click."""
    glide_to(x, y)
    mouse.click(Button.left, 1)
    log.info("mouse click", x=x, y=y)

def drag(start, end):
    glide_to(*start)
    mouse.press(Button.left)
    glide_to(*end)
    mouse.release(Button.left)
    log.info("mouse drag", start=start, end=end)

def type_keys(text: str):
    for ch in text:
        keyboard.press(ch)
        keyboard.release(ch)
    log.info("typed keys", text=text)

def focus_window(handle: int):
    """Bring the window with the given handle to the foreground."""
    win32gui.SetForegroundWindow(handle)
    log.info("focused window", handle=handle)
