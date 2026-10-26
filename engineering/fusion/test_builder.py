import unittest
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent/'MakerCar'))
from config_core import select_ring_profile, validate_config
import json

class LoopList:
    def __init__(self,n): self.count=n
class Profile:
    def __init__(self,loops,area): self.profileLoops=LoopList(loops); self.area=area
class NativeBuilderTests(unittest.TestCase):
    def test_ring_chosen_even_when_hole_disc_has_larger_area(self):
        ring=Profile(2,31.4473);disc=Profile(1,32.1699)
        self.assertIs(select_ring_profile([disc,ring]),ring)
    def test_missing_ring_is_reported(self):
        with self.assertRaises(ValueError):select_ring_profile([Profile(1,32)])
    def test_default_and_maximum_shaft_configs_are_valid(self):
        c=json.loads((Path(__file__).parent.parent/'generated/MakerCar-project.json').read_text(encoding='utf-8'))
        self.assertEqual(validate_config(c)['wheelTrack'],94)
        c['geometry']['shaftDiameter']=6;self.assertEqual(validate_config(c)['shaftDiameter'],6)
        c['geometry']['wheelTrack']=60
        with self.assertRaises(ValueError):validate_config(c)
if __name__=='__main__':unittest.main()
