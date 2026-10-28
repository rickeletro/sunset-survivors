"""Offline art QA from the exported Phaser test scene graph; not a browser screenshot.
SUNSET_ART_QA=1 npx vitest run src/scenes/PulpMenus.test.ts -t 'exports an offline'
python3 scripts/render-gameover-preview.py
Sample leaderboard values are illustration fixtures only, never runtime fallback data.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
assets=json.loads((ROOT/'src/assets/catalog.json').read_text())['images']
canvas=Image.new('RGBA',(1920,1080),'#120b08')
fonts={'Rye':'rye/Rye-Regular.ttf','Roboto Slab':'robotoslab/RobotoSlab-Variable.ttf','Press Start 2P':'pressstart2p/PressStart2P-Regular.ttf'}
def color(value,alpha=1):
    if isinstance(value,str):
        v=value.lstrip('#');rgb=tuple(int(v[i:i+2],16) for i in (0,2,4))
    else:rgb=((int(value)>>16)&255,(int(value)>>8)&255,int(value)&255)
    return (*rgb,round(alpha*255))
def nine(im,w,h):
    result=Image.new('RGBA',(w,h));sw,sh=im.size;border=min(32,(w-1)//2,(h-1)//2)
    for i in range(3):
      for j in range(3):
        source=[0,32,sw-32,sw];source_y=[0,32,sh-32,sh];dest=[0,border,w-border,w];dest_y=[0,border,h-border,h]
        tile=im.crop((source[i],source_y[j],source[i+1],source_y[j+1])).resize((dest[i+1]-dest[i],dest_y[j+1]-dest_y[j]),Image.Resampling.NEAREST)
        result.paste(tile,(dest[i],dest_y[j]))
    return result

def paint(node,px=0,py=0,psx=1,psy=1,alpha=1):
    x=px+node.get('x',0)*psx;y=py+node.get('y',0)*psy;sx=psx*node.get('scaleX',1);sy=psy*node.get('scaleY',1);alpha*=node.get('alpha',1)
    if alpha<=0:return
    key=node.get('key')
    if key in assets:
      im=Image.open(ROOT/'public'/assets[key]).convert('RGBA')
      w=max(1,round(node['width']*abs(sx)));h=max(1,round(node['height']*abs(sy)))
      im=nine(im,w,h) if key.startswith('ui_pulp_') else im.resize((w,h),Image.Resampling.NEAREST)
      if sx<0:im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
      if alpha<1:im.putalpha(im.getchannel('A').point(lambda a:round(a*alpha)))
      canvas.alpha_composite(im,(round(x-w*node.get('originX',.5)),round(y-h*node.get('originY',.5))))
    if node.get('draws'):
      layer=Image.new('RGBA',canvas.size);d=ImageDraw.Draw(layer);fill=(255,255,255,255);stroke=(255,255,255,255);line=1
      def pt(a,b):return(x+a*sx,y+b*sy)
      def box(a,b,w,h):
        ax,ay=pt(a,b);bx,by=pt(a+w,b+h);return(min(ax,bx),min(ay,by),max(ax,bx),max(ay,by))
      for cmd,*args in node['draws']:
        if cmd=='fillStyle':fill=color(args[0],(args[1] if len(args)>1 else 1)*alpha)
        elif cmd=='lineStyle':line=max(1,round(args[0]*abs(sx)));stroke=color(args[1],(args[2] if len(args)>2 else 1)*alpha)
        elif cmd in ('fillRect','fillRoundedRect'):d.rectangle(box(*args[:4]),fill=fill)
        elif cmd in ('strokeRect','strokeRoundedRect'):d.rectangle(box(*args[:4]),outline=stroke,width=line)
        elif cmd in ('fillCircle','strokeCircle'):
          a,b,r=args;bounds=box(a-r,b-r,r*2,r*2)
          if cmd=='fillCircle':d.ellipse(bounds,fill=fill)
          else:d.ellipse(bounds,outline=stroke,width=line)
        elif cmd=='fillPoints':d.polygon([pt(p['x'],p['y']) for p in args[0]],fill=fill)
        elif cmd=='lineBetween':d.line([pt(args[0],args[1]),pt(args[2],args[3])],fill=stroke,width=line)
      canvas.alpha_composite(layer)
    if node.get('text'):
      style=node.get('style',{});name=style.get('fontFamily','Roboto Slab').split(',')[0].strip('"\'');path=fonts.get(name,fonts['Roboto Slab'])
      size=max(1,round(float(str(style.get('fontSize','24px')).replace('px',''))*abs(sx)))
      font=ImageFont.truetype(str(ROOT/'public/assets/fonts'/path),size)
      ox=node.get('originX',.5);oy=node.get('originY',.5);anchor=('l' if ox==0 else 'r' if ox==1 else 'm')+('t' if oy==0 else 'm')
      layer=Image.new('RGBA',canvas.size);d=ImageDraw.Draw(layer)
      d.text((x,y),node['text'],font=font,anchor=anchor,fill=color(node.get('color',style.get('color','#f2d49a')),alpha),stroke_width=round(node.get('strokeWidth',style.get('strokeThickness',0))*abs(sx)),stroke_fill=color(node.get('stroke',style.get('stroke','#120b08')),alpha))
      canvas.alpha_composite(layer)
    for child in node.get('children',[]):paint(child,x,y,sx,sy,alpha)
paint(json.loads(Path('/tmp/sunset-gameover-scene.json').read_text()))
# The native input is an HTML overlay, so its placeholder is composed at its measured canvas coordinates.
d=ImageDraw.Draw(canvas);font=ImageFont.truetype(str(ROOT/'public/assets/fonts/pressstart2p/PressStart2P-Regular.ttf'),24)
d.text((1020,790),'YOUR NAME',font=font,anchor='lm',fill='#82735e')
output=ROOT/'docs/art-direction/game-over-layout-preview.png';canvas.convert('RGB').save(output);print(output)
