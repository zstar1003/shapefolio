import json,re,urllib.request,time,concurrent.futures,pathlib
from PIL import Image,ImageOps,ImageDraw
# Requires Python 3 and Pillow. Downloads are UNREVIEWED, never publish automatically.
root=pathlib.Path(__file__).resolve().parents[1]
s=(root/'src/data.js').read_text(); cases=json.JSONDecoder().raw_decode(s[s.index('['):])[0]; out=root/'research/unreviewed-screenshots';out.mkdir(parents=True,exist_ok=True)
def capture(c):
 u='https://image.thum.io/get/noanimate/width/600/crop/800/'+c['url']
 try:
  with urllib.request.urlopen(u,timeout=30) as r:b=r.read()
  p=out/(c['id']+'.png');p.write_bytes(b)
  im=Image.open(p).convert('RGB'); im.save(out/(c['id']+'.webp'),'WEBP',quality=82)
  result={'id':c['id'],'sourceUrl':c['url'],'providerUrl':u,'width':im.width,'height':im.height,'bytes':len(b),'status':'needs_visual_review'}
 except Exception as e: result={'id':c['id'],'sourceUrl':c['url'],'providerUrl':u,'status':'failed','error':str(e)}
 print(json.dumps(result),flush=True);return result
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:results=list(ex.map(capture,cases))
(out/'capture-results.json').write_text(json.dumps(results,indent=2))
for k in range(0,len(results),12):
 batch=results[k:k+12];sheet=Image.new('RGB',(1200,1050),'#dddddd');d=ImageDraw.Draw(sheet)
 for i,r in enumerate(batch):
  x=(i%3)*400;y=(i//3)*262
  p=out/(r['id']+'.webp')
  if p.exists():
   im=Image.open(p);im.thumbnail((390,235));sheet.paste(im,(x,y+22))
  d.text((x+5,y+4),f"{k+i+1}. {r['id']} {r['status']}",fill='black')
 sheet.save(out/f'contact-{k//12+1}.jpg')
print('COMPLETE',len(results),flush=True)
