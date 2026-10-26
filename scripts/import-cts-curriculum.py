"""Create the versioned, offline CTS teaching handoff; never used by the website at runtime."""
import argparse, hashlib, json, re, shutil, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

COURSES = [
    ('PV101', 'Solar and electrical foundations'),
    ('RCS', 'Residential construction systems'),
    ('PV102', 'Solar applications and design'),
    ('EDM101', 'Sound, lighting and fabrication'),
    ('EBIKE101', 'Bicycle and e-bike systems'),
]
ROLES = [
 ('student_packet', 'Student packet', r'student_?(?:print_?)?packet'),
 ('instructor_packet', 'Instructor packet', r'instructor_?packet|master_?(?:print_?)?packet'),
 ('run_sheet', 'Instructor run sheet', r'(?:instructor_|daily_)?run_?sheet'),
 ('slides', 'Slide deck', r'slide_?deck|daily_?slides|_slides\b'),
 ('answers', 'Quiz answer key', r'answer_?key|quiz_?(?:key|answers)'),
 ('quiz', 'Quiz', r'quiz'),
 ('lab', 'Lab activity', r'(?:afternoon_)?lab\b'),
 ('worksheet', 'Worksheet', r'worksheet|practice_?sheet'),
 ('student_guide', 'Student guide', r'student_?guide'),
 ('whiteboard', 'Whiteboard plan', r'whiteboard'),
 ('exit_ticket', 'Exit ticket', r'exit_?ticket'),
 ('verification', 'Verification log', r'verification_?log|qc_?check'),
]
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'

def digest(data): return hashlib.sha256(data).hexdigest()
def clean_name(text): return re.sub(r'\s+', ' ', text.replace('_', ' ')).strip()

def element_text(element):
    return ''.join((node.text or '') if node.tag==W+'t' else '\n' if node.tag in (W+'br',W+'cr') else '\t' if node.tag==W+'tab' else '' for node in element.iter())

def docx_text(file):
    with zipfile.ZipFile(file) as archive: body = ET.fromstring(archive.read('word/document.xml')).find(W+'body')
    result=[]
    for child in body:
        if child.tag == W+'p':
            text=element_text(child).replace('\n','\n\n')
            if not text.strip(): continue
            style=child.find('./'+W+'pPr/'+W+'pStyle')
            value=style.get(W+'val','') if style is not None else ''
            heading=re.search(r'heading([1-6])', value, re.I)
            prefix='#'*int(heading[1])+' ' if heading else '# ' if value.lower()=='title' else ''
            result.append(prefix+text)
        elif child.tag==W+'tbl':
            rows=[]
            for row in child.findall(W+'tr'):
                rows.append([' ; '.join(element_text(paragraph).replace('\n',' ; ') for paragraph in cell.findall(W+'p')).replace('|','\\|') for cell in row.findall(W+'tc')])
            if rows:
                width=max(map(len,rows)); rows=[row+['']*(width-len(row)) for row in rows]
                result.append('\n'.join(['| '+' | '.join(rows[0])+' |','| '+' | '.join(['---']*width)+' |']+['| '+' | '.join(row)+' |' for row in rows[1:]]))
    return '\n\n'.join(result)

def read_text(file):
    if file.suffix.lower()=='.docx': return docx_text(file)
    return file.read_text(encoding='utf-8-sig').replace('\r\n','\n')

def eligible(file, day):
    relative=file.relative_to(day)
    if any(re.search(r'^(?:qa|render.*|_archive|archive|tmp|_tmp.*)$', part, re.I) for part in relative.parts[:-1]): return False
    if file.name.startswith('_'): return False
    return True

def source_choice(files, day):
    # Teacher run sheets carry usable lesson flow; build notes are a last resort.
    def score(file):
        name=file.name.lower(); parent=file.parent.name.lower()
        if file.suffix.lower() not in ('.md','.docx'): return -1
        if file.name=='AGENTS.md' or re.search(r'backup|manifest|readme|\.inspect',name): return -1
        if re.search(r'run_?sheet',name): return 110 if file.suffix.lower()=='.md' else 100
        if name=='lesson.md': return 108
        if 'master_curriculum_source' in name: return 95
        if name.endswith('_source.md') and file.stat().st_size>3000: return 80
        if name.endswith('_source.md'): return 10
        return -1
    candidates=sorted((file for file in files if score(file)>=0), key=lambda file:(-score(file),len(file.relative_to(day).parts),str(file)))
    return candidates[0] if candidates else None

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--source',required=True); args=parser.parse_args()
    source=Path(args.source).resolve(); daily=source/'03_DAILY'; repo=Path(__file__).resolve().parent.parent
    out=repo/'public/teaching/cts'; (out/'assets').mkdir(parents=True,exist_ok=True); (out/'lessons').mkdir(parents=True,exist_ok=True)
    catalog={'schemaVersion':1,'program':{'title':'CTS teaching program','totalDays':40,'weeks':10,'daysPerWeek':4,'daysPerCourse':8},'referenceCohort':'Cohort 6','courses':[]}
    manifest={'contract':'cts.teaching-library.v1','sourceContext':'aya-curriculum','consumer':'canonical-program-os','containsStudentRecords':False,'scope':'Human-approved reusable teaching material; original cohort files preserved','lessons':[]}
    day_dirs={int(match[1]):file for file in daily.iterdir() if file.is_dir() and (match:=re.match(r'Day_(\d+)_',file.name))}
    used=set()
    for course_index,(code,title) in enumerate(COURSES):
        course={'code':code,'title':title,'weeks':2,'days':[]}
        for course_day in range(1,9):
            number=course_index*8+course_day; lesson_id=f'{code.lower()}-{course_day:02}'
            base={'id':lesson_id,'courseCode':code,'courseDay':course_day,'programDay':number,'title':'Material not found','referenceDate':None,'status':'missing','resources':[],'additionalResources':[],'lessonUrl':None}
            folder=day_dirs.get(number)
            if folder:
                expected=re.search(r'^Day_\d+_(PV101|RCS|PV102|EDM101|EBIKE101)',folder.name)
                if not expected or expected[1]!=code: raise ValueError('Course block mismatch: '+folder.name)
                files=sorted(file for file in folder.rglob('*') if file.is_file() and eligible(file,folder))
                date=re.search(r'(\d{4}-\d{2}-\d{2})$',folder.name); base['referenceDate']=date[1] if date else None
                raw_title=re.sub(r'^Day_\d+_(?:PV101|PV102|RCS\d*|EDM101|EBIKE101)_?','',folder.name)
                base['title']=clean_name(re.sub(r'_?\d{4}-\d{2}-\d{2}$','',raw_title)) or f'{title} — Day {course_day}'
                day_json=next((file for file in files if file.name=='day.json' and file.parent.name.lower()=='source'),None)
                if day_json: base['title']=json.loads(day_json.read_text(encoding='utf-8-sig')).get('title',base['title'])
                source_file=source_choice(files,folder); text=read_text(source_file) if source_file else ''
                # Do not publish local filesystem paths or an accidental credential from a source note.
                if re.search(r'(?:\b[A-Za-z]:[\\/]|/Users/|/home/|CANONICAL://|sk-proj-|access_token\s*[=:])',text):
                    raise ValueError('Source needs manual review before import: '+str(source_file.relative_to(source)))
                if code=='RCS' and not day_json:
                    heading=re.search(r'^#\s+(.+)',text,re.M)
                    if heading: base['title']=heading[1].split(' - ',1)[-1]
                selected={}
                for file in files:
                    ext=file.suffix.lower()
                    if ext not in ('.pdf','.docx','.pptx'): continue
                    name=file.stem.lower()
                    for role,label,pattern in ROLES:
                        if re.search(pattern,name):
                            key=(role,ext); rank=(len(file.relative_to(folder).parts),len(file.name),str(file))
                            if key not in selected or rank<selected[key][0]: selected[key]=(rank,file,label)
                            break
                resources=[]; provenance=[]
                for (role,ext),(_,file,label) in sorted(selected.items()):
                    data=file.read_bytes(); checksum=digest(data); href=f'/teaching/cts/assets/{checksum[:24]}{ext}'; dest=repo/'public'/href.lstrip('/')
                    if not dest.exists(): dest.write_bytes(data)
                    used.add(href)
                    resources.append({'kind':role,'label':label,'format':ext[1:].upper(),'url':href,'bytes':len(data),'sha256':checksum})
                    provenance.append({'relativePath':file.relative_to(source).as_posix(),'sha256':checksum,'url':href})
                # Preserve distinct alternate teaching versions, not only the shortest filename.
                # Exact duplicate exports are collapsed by checksum; QA/archives/drawings stay excluded.
                primary_hashes={resource['sha256'] for resource in resources}
                extra_hashes=set(); extras=[]
                for file in files:
                    ext=file.suffix.lower()
                    if ext not in ('.pdf','.docx','.pptx'): continue
                    role_match=next(((role,label) for role,label,pattern in ROLES if re.search(pattern,file.stem.lower())),None)
                    if not role_match: continue
                    data=file.read_bytes(); checksum=digest(data)
                    if checksum in primary_hashes or checksum in extra_hashes: continue
                    extra_hashes.add(checksum)
                    href=f'/teaching/cts/assets/{checksum[:24]}{ext}'; dest=repo/'public'/href.lstrip('/')
                    if not dest.exists(): dest.write_bytes(data)
                    used.add(href)
                    extras.append({'kind':role_match[0],'label':clean_name(file.stem),'format':ext[1:].upper(),'url':href,'bytes':len(data),'sha256':checksum})
                    provenance.append({'relativePath':file.relative_to(source).as_posix(),'sha256':checksum,'url':href,'alternate':True})
                base['additionalResources']=extras
                base['resources']=resources
                base['status']='materials_available' if resources else 'source_only' if text else 'inventory_only'
                if re.search(r'backfill',text,re.I): base['sourceNote']='Includes backfilled source; review before reuse.'
                if re.search(r'\bdraft\b',text[:2500],re.I): base['sourceNote']='Draft teaching source; review before reuse.'
                if text:
                    href=f'/teaching/cts/lessons/{lesson_id}.json'; base['lessonUrl']=href
                    (repo/'public'/href.lstrip('/')).write_text(json.dumps({'id':lesson_id,'title':base['title'],'markdown':text},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
                    used.add(href)
                manifest['lessons'].append({'id':lesson_id,'sourceFolder':folder.relative_to(source).as_posix(),'sourceFile':source_file.relative_to(source).as_posix() if source_file else None,'sourceSha256':digest(source_file.read_bytes()) if source_file else None,'sourceStatus':base['status'],'assets':provenance})
            course['days'].append(base)
        catalog['courses'].append(course)
    (repo/'content/teaching/cts').mkdir(parents=True,exist_ok=True)
    (repo/'content/teaching/cts/catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (repo/'docs/cts-import-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    # No recursive deletion: report stale outputs for explicit review instead.
    stale=[file.relative_to(repo/'public').as_posix() for file in out.rglob('*') if file.is_file() and '/'+file.relative_to(repo/'public').as_posix() not in used]
    print(json.dumps({'lessons':40,'present':len(manifest['lessons']),'uniqueFiles':len(used),'megabytes':round(sum((repo/'public'/url.lstrip('/')).stat().st_size for url in used)/1024/1024,1),'staleOutputs':stale},indent=2))

if __name__=='__main__': main()
