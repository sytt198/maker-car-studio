"""Run inside Autodesk Fusion. Creates a NEW parametric document, never edits the source f3d.
Native dimensions drive sketch profiles, offsets and extrudes. Commercial parts are envelopes.
Not yet executed in a native Fusion session. See README for coordinate offset and boundaries.
"""
import os
import sys
import json
import traceback

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)
from config_core import validate_config, select_ring_profile

def run(context):
    import adsk.core as core
    import adsk.fusion as fusion
    app = core.Application.get()
    ui = app.userInterface
    try:
        dialog = ui.createFileDialog()
        dialog.title = 'Choose Maker Car project JSON'
        dialog.filter = 'Maker Car project (*.json)'
        if dialog.showOpen() != core.DialogResults.DialogOK:
            return
        with open(dialog.filename, encoding='utf-8-sig') as stream:
            config = json.load(stream)
        p = validate_config(config)
        document = app.documents.add(core.DocumentTypes.FusionDesignDocumentType)
        design = fusion.Design.cast(app.activeProduct)
        design.designType = fusion.DesignTypes.ParametricDesignType
        document.name = 'MakerCar-four-wheel-48'
        root = design.rootComponent
        root.name = 'MakerCar - four tires - provisional fit'
        mapping = {'length':'chassis_length','width':'chassis_width','thickness':'plate_thickness',
                   'standoff':'board_standoff','wheelDiameter':'wheel_diameter','wheelWidth':'wheel_width',
                   'wheelbase':'wheelbase','wheelTrack':'wheel_track','shaftDiameter':'shaft_diameter',
                   'boardLength':'board_length','boardWidth':'board_width','boardHeight':'board_height',
                   'clearance':'fit_clearance','gearLength':'gear_length','gearWidth':'gear_width','gearHeight':'gear_height'}
        for key, name in mapping.items():
            design.userParameters.add(name, core.ValueInput.createByString(f'{p[key]} mm'), 'mm',
                                      'Maker Car input; commercial part dimensions require measurement')
        for name, expr in {
            'origin_shift':'100 mm', 'axle_z':'wheel_diameter / 2',
            'deck_z':'axle_z + 12 mm', 'deck_top':'deck_z + plate_thickness',
            'board_z':'deck_top + board_standoff',
            'tray_w':'board_width + 2*fit_clearance + 4 mm',
            'tray_l':'board_length + 2*fit_clearance + 4 mm',
            'gear_x':'wheel_track/2 - wheel_width/2 - 4 mm - gear_width/2',
            'gear_y':'-wheelbase/2 + gear_length/2 - 4 mm',
        }.items():
            design.userParameters.add(name, core.ValueInput.createByString(expr), 'mm', 'Derived assembly dimension')
        design.userParameters.add('gear_ratio', core.ValueInput.createByReal(48), '', 'Nominal package ratio, not a verified tooth definition')
        def value(expr):
            return design.unitsManager.evaluateExpression(expr, 'mm')  # Fusion internal cm
        def point(x,y,z=0):
            return core.Point3D.create(x,y,z)
        def component(name):
            obj = root.occurrences.addNewComponent(core.Matrix3D.create()).component
            obj.name = name
            return obj
        def plane(comp, axis, offset):
            inp = comp.constructionPlanes.createInput()
            inp.setByOffset(comp.xYConstructionPlane if axis=='z' else comp.yZConstructionPlane,
                            core.ValueInput.createByString(offset))
            return comp.constructionPlanes.add(inp)
        def pin_point(sk, pt, xexpr, yexpr):
            # All native assembly positions remain in the positive sketch quadrants.
            for expr, orientation in [(xexpr,fusion.DimensionOrientations.HorizontalDimensionOrientation),
                                      (yexpr,fusion.DimensionOrientations.VerticalDimensionOrientation)]:
                dim = sk.sketchDimensions.addDistanceDimension(sk.originPoint,pt,orientation,point(1,1))
                dim.parameter.expression = expr
        def rectangle(sk, xexpr, yexpr, wexpr, hexpr):
            x,y,w,h = map(value,(xexpr,yexpr,wexpr,hexpr))
            lines = sk.sketchCurves.sketchLines.addTwoPointRectangle(point(x,y),point(x+w,y+h))
            sk.geometricConstraints.addHorizontal(lines.item(0))
            sk.geometricConstraints.addHorizontal(lines.item(2))
            sk.geometricConstraints.addVertical(lines.item(1))
            sk.geometricConstraints.addVertical(lines.item(3))
            dims = sk.sketchDimensions
            dims.addDistanceDimension(lines.item(0).startSketchPoint,lines.item(0).endSketchPoint,
                                      fusion.DimensionOrientations.HorizontalDimensionOrientation,point(x+w/2,y-.5)).parameter.expression = wexpr
            dims.addDistanceDimension(lines.item(1).startSketchPoint,lines.item(1).endSketchPoint,
                                      fusion.DimensionOrientations.VerticalDimensionOrientation,point(x+w+.5,y+h/2)).parameter.expression = hexpr
            pin_point(sk,lines.item(0).startSketchPoint,xexpr,yexpr)
        def extrude(comp,sk,depth,cut=False,profile=None):
            if profile is None:
                profile = max((sk.profiles.item(i) for i in range(sk.profiles.count)),
                              key=lambda pr:pr.areaProperties().area)
            op = fusion.FeatureOperations.CutFeatureOperation if cut else fusion.FeatureOperations.NewBodyFeatureOperation
            inp = comp.features.extrudeFeatures.createInput(profile,op)
            extent = fusion.DistanceExtentDefinition.create(core.ValueInput.createByString(depth))
            inp.setOneSideExtent(extent,fusion.ExtentDirections.PositiveExtentDirection)
            result=comp.features.extrudeFeatures.add(inp)
            sk.isVisible=False
            return result
        def rect_body(comp,x,y,z,w,l,h,cut=False):
            sk=comp.sketches.add(plane(comp,'z',z));rectangle(sk,x,y,w,l);return extrude(comp,sk,h,cut)
        def centered_box(name,x,y,z,w,l,h):
            comp=component(name)
            rect_body(comp,f'({x})-({w})/2',f'({y})-({l})/2',z,w,l,h)
            return comp
        def round_cut(comp,x,y,z,r,depth):
            sk=comp.sketches.add(plane(comp,'z',z))
            circle=sk.sketchCurves.sketchCircles.addByCenterRadius(point(value(x),value(y)),value(r))
            pin_point(sk,circle.centerSketchPoint,x,y)
            sk.sketchDimensions.addDiameterDimension(circle,point(value(x)+.5,value(y))).parameter.expression=f'2*({r})'
            extrude(comp,sk,depth,True)
        def round_body(name,x,y,z,r,h,axis='x',inner=None):
            comp=component(name);sk=comp.sketches.add(plane(comp,axis,x if axis=='x' else z))
            a,b=(y,z) if axis=='x' else (x,y)
            circle=sk.sketchCurves.sketchCircles.addByCenterRadius(point(value(a),value(b)),value(r))
            pin_point(sk,circle.centerSketchPoint,a,b)
            sk.sketchDimensions.addDiameterDimension(circle,point(value(a)+value(r),value(b)+.5)).parameter.expression=f'2*({r})'
            if inner:
                hole=sk.sketchCurves.sketchCircles.addByCenterRadius(circle.centerSketchPoint,value(inner))
                sk.sketchDimensions.addDiameterDimension(hole,point(value(a),value(b))).parameter.expression=f'2*({inner})'
            profile=select_ring_profile([sk.profiles.item(i) for i in range(sk.profiles.count)]) if inner else None
            extrude(comp,sk,h,profile=profile)
            return comp
        O='origin_shift'
        chassis=centered_box('01 Chassis - printable',O,O,'deck_z','chassis_width','chassis_length','plate_thickness')
        # Native cuts retain their own driving sketch dimensions.
        rect_body(chassis,f'{O}-10 mm',f'{O}-7 mm','deck_z','20 mm','14 mm','plate_thickness',True)
        for sx in [-1,1]:
            for sy in [-1,1]:
                rect_body(chassis,f'{O}+({sx}*21 mm)-1.5 mm',f'{O}+({sy}*14 mm)-8.5 mm','deck_z','3 mm','17 mm','plate_thickness',True)
        tray=centered_box('02 Board tray - printable',O,O,'board_z-2.4 mm','tray_w','tray_l','2.4 mm')
        rect_body(tray,f'{O}-(board_width-14 mm)/2',f'{O}-(board_length-14 mm)/2','board_z-2.4 mm','board_width-14 mm','board_length-14 mm','2.4 mm',True)
        for sx in [-1,1]:
            for sy in [-1,1]:
                X=f'{O}+{sx}*(tray_w/2-5 mm)';Y=f'{O}+{sy}*(tray_l/2-5 mm)'
                round_cut(chassis,X,Y,'deck_z','1.35 mm','plate_thickness')
                round_cut(tray,X,Y,'board_z-2.4 mm','1.35 mm','2.4 mm')
        # Each lip is its own editable feature/component; commercial interfaces remain provisional.
        for sx in [-1,1]:
            centered_box(f'03 Tray lip X {sx}',f'{O}+{sx}*(tray_w/2-1 mm)',O,'board_z','2 mm','tray_l-8 mm','3.5 mm')
            centered_box(f'03 Tray lip Y {sx}',O,f'{O}+{sx}*(tray_l/2-1 mm)','board_z','tray_w-16 mm','2 mm','3.5 mm')
            for sy in [-1,1]:
                round_body(f'04 Standoff {sx} {sy}',f'{O}+{sx}*(tray_w/2-5 mm)',f'{O}+{sy}*(tray_l/2-5 mm)',
                           'deck_top','2.5 mm','board_standoff-2.4 mm','z','1.25 mm')
        for sx in [-1,1]:
            X=f'{O}+{sx}*gear_x'
            centered_box(f'05 Gearbox 1to48 envelope {sx}',X,f'{O}+gear_y','axle_z+1 mm-gear_height/2','gear_width','gear_length','gear_height')
            # Three walls form the printable hanger; dimensions match the mesh U clip.
            bottom='axle_z-gear_height/2'; top='deck_z+plate_thickness'
            for edge in [-1,1]:
                centered_box(f'06 Hanger wall {sx} {edge}',f'{X}+{edge}*(gear_width/2+1.3 mm)',f'{O}+gear_y',bottom,'1.6 mm','9 mm',f'{top}-({bottom})')
            centered_box(f'06 Hanger bridge {sx}',X,f'{O}+gear_y','axle_z+gear_height/2+1.6 mm','gear_width+4.2 mm','9 mm','deck_z+plate_thickness-(axle_z+gear_height/2+1.6 mm)')
            for sy in [-1,1]:
                Y=f'{O}+{sy}*wheelbase/2'
                round_body(f'07 Tire {sx} {sy}',f'{O}+{sx}*wheel_track/2-wheel_width/2',Y,'axle_z','wheel_diameter/2','wheel_width','x','wheel_diameter*0.34')
                round_body(f'08 Hub envelope {sx} {sy}',f'{O}+{sx}*wheel_track/2-wheel_width*0.44',Y,'axle_z','wheel_diameter*0.34','wheel_width*0.88','x','shaft_diameter/2')
                round_body(f'09 Shaft {sx} {sy}',f'{X}+{sx}*(gear_width/2+4 mm)-7 mm',Y,'axle_z','shaft_diameter/2','14 mm')
                round_body(f'10 Pulley envelope {sx} {sy}',f'{O}+{sx}*(wheel_track/2-wheel_width/2-3 mm)-1.25 mm',Y,'axle_z','6 mm','2.5 mm','x','shaft_diameter/2')
                if sy==1:
                    round_body(f'11 Front bearing {sx}',f'{X}-3.5 mm',Y,'axle_z','4.5 mm','7 mm','x','shaft_diameter/2+0.2 mm')
                    centered_box(f'11 Front bearing hanger {sx}',X,Y,'axle_z+3 mm','7 mm','8 mm','deck_z-axle_z-3 mm')
            for signz in [-1,1]:
                centered_box(f'12 Belt envelope {sx} {signz}',f'{O}+{sx}*(wheel_track/2-wheel_width/2-3 mm)',O,
                             f'axle_z+{signz}*6 mm-0.45 mm','1.6 mm','wheelbase','0.9 mm')
        centered_box('13 Mosaico envelope - measure before fit',O,O,'board_z','board_width','board_length','board_height')
        centered_box('14 Driver envelope',O,f'{O}-9 mm','deck_top+2 mm','20 mm','18 mm','3 mm')
        centered_box('15 Battery envelope',O,f'{O}+8 mm','deck_z-13 mm','40 mm','25 mm','12 mm')
        design.computeAll()
        app.activeViewport.fit()
        ui.messageBox('Created NEW four-tire parametric concept.\nEdit Modify > Change Parameters.\nMosaico, 1:48 gearbox and belt interfaces need measurement.\nCommercial parts are envelopes, not verified tooth profiles.\nOrigin shifted +100 mm in X/Y for driving sketch dimensions.\nUse Save As to save your own .f3d; original reference is untouched.')
    except Exception:
        ui.messageBox('Maker Car build failed. Original document is untouched.\nA partially built NEW document may remain.\n'+traceback.format_exc())
