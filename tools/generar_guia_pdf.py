from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether, Table, TableStyle

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'GUIA_PASO_A_PASO.pdf'
pdfmetrics.registerFont(TTFont('DejaVu','/usr/share/fonts/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVu-Bold','/usr/share/fonts/liberation/LiberationSans-Bold.ttf'))
PAGE=A4
BG=colors.HexColor('#0A0D10'); INK=colors.HexColor('#182027'); MUTED=colors.HexColor('#53626E'); BRAND=colors.HexColor('#006BD6'); SOFT=colors.HexColor('#EAF3FC'); LINE=colors.HexColor('#DDE5EA'); WARN=colors.HexColor('#FFF1E6')

styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='CoverTitle',fontName='DejaVu-Bold',fontSize=30,leading=34,textColor=colors.white,alignment=TA_CENTER,spaceAfter=9*mm))
styles.add(ParagraphStyle(name='CoverSub',fontName='DejaVu',fontSize=12.5,leading=18,textColor=colors.HexColor('#B8C3CC'),alignment=TA_CENTER))
styles.add(ParagraphStyle(name='H1x',fontName='DejaVu-Bold',fontSize=16,leading=20,textColor=INK,spaceBefore=7*mm,spaceAfter=3*mm,keepWithNext=True))
styles.add(ParagraphStyle(name='Bodyx',fontName='DejaVu',fontSize=9.8,leading=14.2,textColor=INK,spaceAfter=2.2*mm))
styles.add(ParagraphStyle(name='Stepx',fontName='DejaVu',fontSize=9.5,leading=13.5,textColor=INK,leftIndent=9*mm,firstLineIndent=-6*mm,spaceAfter=1.5*mm))
styles.add(ParagraphStyle(name='Smallx',fontName='DejaVu',fontSize=8.5,leading=12,textColor=MUTED))
styles.add(ParagraphStyle(name='Boxx',fontName='DejaVu',fontSize=9.5,leading=14,textColor=INK))

sections=[]; current=None
for raw in (ROOT/'GUIA_PASO_A_PASO.txt').read_text(encoding='utf-8').splitlines():
    line=raw.strip()
    if not line or set(line)<=set('=-'): continue
    if len(line)>3 and line[0].isalpha() and line[1]=='.' and line[2]==' ':
        current=[line,[]]; sections.append(current)
    elif current: current[1].append(line)


def box(text,bg=SOFT):
    t=Table([[Paragraph(text,styles['Boxx'])]],colWidths=[166*mm])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),bg),('BOX',(0,0),(-1,-1),.6,colors.HexColor('#BFD6EA')),('LEFTPADDING',(0,0),(-1,-1),5*mm),('RIGHTPADDING',(0,0),(-1,-1),5*mm),('TOPPADDING',(0,0),(-1,-1),4*mm),('BOTTOMPADDING',(0,0),(-1,-1),4*mm)]))
    return t

def first_page(c,doc):
    w,h=PAGE;c.saveState();c.setFillColor(BG);c.rect(0,0,w,h,fill=1,stroke=0)
    c.setFillColor(BRAND);c.roundRect(w/2-17*mm,h-55*mm,34*mm,34*mm,7*mm,fill=1,stroke=0)
    c.setStrokeColor(colors.white);c.setLineWidth(2.4);c.line(w/2-9*mm,h-43*mm,w/2-4*mm,h-47*mm);c.line(w/2-4*mm,h-47*mm,w/2+1*mm,h-39*mm);c.line(w/2+1*mm,h-39*mm,w/2+9*mm,h-33*mm)
    c.restoreState()

def later_page(c,doc):
    w,h=PAGE;c.saveState();c.setStrokeColor(LINE);c.line(22*mm,16*mm,w-22*mm,16*mm)
    c.setFont('DejaVu',8);c.setFillColor(MUTED);c.drawString(22*mm,10.5*mm,'Finanzas v5 · Guía paso a paso');c.drawRightString(w-22*mm,10.5*mm,f'{doc.page}')
    c.restoreState()

story=[Spacer(1,63*mm),Paragraph('Finanzas v5',styles['CoverTitle']),Paragraph('Guía paso a paso',styles['CoverTitle']),Paragraph('Actualizar, proteger el TOKEN y empezar a usar el nuevo diseño<br/>sin saber programar y sin servicios de pago',styles['CoverSub']),Spacer(1,18*mm),box('<b>Importante:</b> en una captura anterior se veía el TOKEN del Worker. Esta guía incluye el cambio seguro, clic a clic.',WARN),PageBreak()]

story += [Paragraph('Qué vas a hacer',styles['H1x']),Paragraph('1. Subir la v5 y actualizar el Worker. 2. Regenerar el TOKEN expuesto. 3. Comprobar ordenador, móvil y gestos. 4. Importar bancos, brókeres o exchanges. 5. Actualizar Gemini y Claude.',styles['Bodyx']),box('<b>Regla de seguridad:</b> no borres el KV <b>CAUDAL</b>, no borres datos del sitio y no compartas extractos, copias JSON, claves, TOKEN ni enlaces de vinculación.'),Spacer(1,3*mm)]

for title,lines in sections:
    block=[Paragraph(title,styles['H1x'])]
    for line in lines:
        safe=line.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
        # Restore simple emphasis for exact known words is unnecessary; keep robust text.
        if line.startswith(tuple(f'{i}.' for i in range(1,20))):
            n,txt=line.split('.',1); block.append(Paragraph(f'<b>{n}.</b>{txt}',styles['Stepx']))
        elif line.startswith('- '): block.append(Paragraph('• '+safe[2:],styles['Stepx']))
        elif line.endswith(':'): block.append(Paragraph('<b>'+safe+'</b>',styles['Bodyx']))
        else: block.append(Paragraph(safe,styles['Bodyx']))
    story.extend(block)

story += [Spacer(1,8*mm),box('<b>Comprobación final:</b> GitHub Actions en verde; Worker w3 conectado; TOKEN regenerado; v5 visible en móvil; pestañas Inicio, Gastos, Invertir y Cuentas; sincronización correcta.'),Spacer(1,5*mm),Paragraph('Finanzas v5 conserva caudal_v1, caudal:, X-Caudal-Token y CAUDAL para que tus datos actuales sigan funcionando.',styles['Smallx'])]

doc=SimpleDocTemplate(str(OUT),pagesize=PAGE,rightMargin=22*mm,leftMargin=22*mm,topMargin=20*mm,bottomMargin=22*mm,title='Finanzas v5 · Guía paso a paso',author='Microsoft Copilot')
doc.build(story,onFirstPage=first_page,onLaterPages=later_page)
print(OUT)
