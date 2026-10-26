"""Offline-testable guard for Fusion input. Units are millimeters."""
import math

RANGES = {
    'length': (90, 180), 'width': (70, 140), 'thickness': (2, 6),
    'standoff': (8, 30), 'wheelDiameter': (28, 64), 'wheelWidth': (6, 18),
    'wheelbase': (50, 130), 'wheelTrack': (88, 180), 'shaftDiameter': (2, 6),
    'boardLength': (40, 110), 'boardWidth': (40, 100), 'boardHeight': (8, 30),
    'clearance': (.3, 2), 'gearLength': (30, 65), 'gearWidth': (10, 24),
    'gearHeight': (12, 28),
}

def select_ring_profile(profiles):
    """Select topology, not area: a large hole may exceed the annulus area."""
    rings = [p for p in profiles if p.profileLoops.count == 2]
    if len(rings) != 1:
        raise ValueError('Expected exactly one annular profile with two boundary loops')
    return rings[0]

def validate_config(config):
    if not isinstance(config, dict) or config.get('schemaVersion') != 1 or config.get('layout') != 'four-wheel-skid':
        raise ValueError('Choose a Maker Car four-wheel project JSON, schema version 1.')
    p = config.get('geometry', {})
    for key, (lo, hi) in RANGES.items():
        n = p.get(key)
        if isinstance(n, bool) or not isinstance(n, (int, float)) or not math.isfinite(n) or not lo <= n <= hi:
            raise ValueError(f'{key}: expected {lo}..{hi} mm')
    if p['wheelTrack']-p['wheelWidth']-p['width'] < 4:
        raise ValueError('Wheel/chassis clearance too small')
    if p['boardWidth']+2*p['clearance']+6 > p['width'] or p['boardLength']+2*p['clearance']+6 > p['length']:
        raise ValueError('Board tray exceeds chassis')
    if not p['wheelDiameter']+6 <= p['wheelbase'] <= p['length']-24:
        raise ValueError('Invalid axle spacing')
    if p['gearHeight']/2+1 > 11:
        raise ValueError('Gearbox intersects deck')
    if p['wheelTrack']/2-p['wheelWidth']/2-4-p['gearWidth'] < 22:
        raise ValueError('Gearbox intersects battery envelope')
    if p['gearLength'] > p['wheelbase']-8:
        raise ValueError('Gearbox intersects front bearing support')
    if config.get('motor', {}).get('gearRatio') != 48:
        raise ValueError('This native builder is for the 1:48 layout')
    return dict(p)
