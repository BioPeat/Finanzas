#!/usr/bin/env python3
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether, Table, TableStyle

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'GUIA_PASO_A_PASO.pdf'
INK=colors.HexColor('#172023'); MUTED=colors.HexColor('#586467'); AMBER=colors.HexColor('#B87500'); PAPER=colors.HexColor('#F6F3EA'); LINE=colors.HexColor('#D8D1C2'); GREEN=colors.HexColor('#087D55')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='CoverTitle',parent=styles['Title'],fontName='Helvetica-Bold',fontSize=27,leading=30,textColor=INK,spaceAfter=7*mm,alignment=TA_LEFT))
styles.add(ParagraphStyle(name='Deck',parent=styles['BodyText'],fontName='Helvetica',fontSize=11.5,leading=16,textColor=MUTED,spaceAfter=5*mm))
styles.add(ParagraphStyle(name='H1x',parent=styles['Heading1'],fontName='Helvetica-Bold',fontSize=17,leading=20,textColor=INK,spaceBefore=2*mm,spaceAfter=4*mm))
styles.add(ParagraphStyle(name='H2x',parent=styles['Heading2'],fontName='Helvetica-Bold',fontSize=11,leading=14,textColor=AMBER,spaceBefore=3*mm,spaceAfter=2*mm))
styles.add(ParagraphStyle(name='Bodyx',parent=styles['BodyText'],fontName='Helvetica',fontSize=9.4,leading=13.2,textColor=INK,spaceAfter=1.8*mm))
styles.add(ParagraphStyle(name='Smallx',parent=styles['BodyText'],fontName='Helvetica',fontSize=8,leading=11,textColor=MUTED))
styles.add(ParagraphStyle(name='Step',parent=styles['BodyText'],fontName='Helvetica',fontSize=9.4,leading=13.2,textColor=INK,leftIndent=8*mm,firstLineIndent=-6*mm,spaceAfter=2.2*mm))
styles.add(ParagraphStyle(name='Callout',parent=styles['BodyText'],fontName='Helvetica-Bold',fontSize=9.3,leading=13,textColor=INK,backColor=PAPER,borderColor=AMBER,borderWidth=.7,borderPadding=8,spaceAfter=4*mm))

def P(t,style='Bodyx'): return Paragraph(t,styles[style])
def steps(items): return [P(f'<b>{i}.</b> {t}','Step') for i,t in enumerate(items,1)]
def footer(canvas,doc):
    canvas.saveState();canvas.setStrokeColor(LINE);canvas.line(18*mm,15*mm,192*mm,15*mm);canvas.setFont('Helvetica',7.5);canvas.setFillColor(MUTED);canvas.drawString(18*mm,10*mm,'Finanzas v6 · Atlas financiero');canvas.drawRightString(192*mm,10*mm,f'{doc.page}');canvas.restoreState()

doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=18*mm,leftMargin=18*mm,topMargin=18*mm,bottomMargin=20*mm,title='Finanzas v6 - Guia paso a paso',author='Microsoft Copilot')
story=[]
story += [Spacer(1,14*mm),P('FINANZAS v6','H2x'),P('Atlas financiero','CoverTitle'),P('Guía corta para actualizar, proteger el TOKEN, activar la automatización y empezar sin saber programar. Todo lo obligatorio usa servicios gratuitos.','Deck')]
summary=[['1','GitHub','Copiar y Push'],['2','Cloudflare','Pegar worker.js y Deploy'],['3','Comprobar','Worker w4 y sincronización'],['4','Opcional','IA y exchanges de solo lectura']]
t=Table(summary,colWidths=[12*mm,34*mm,118*mm],hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PAPER),('GRID',(0,0),(-1,-1),.4,LINE),('TEXTCOLOR',(0,0),(-1,-1),INK),('FONT',(0,0),(-1,-1),'Helvetica'),('FONT',(0,0),(1,-1),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]));story += [t,Spacer(1,7*mm),P('NO BORRES el KV CAUDAL ni los datos del sitio. No compartas TOKEN, claves, copias JSON, extractos ni enlaces de vinculación.','Callout'),P('Tus contratos internos siguen iguales: <b>caudal_v1</b>, <b>caudal:</b>, <b>X-Caudal-Token</b> y <b>CAUDAL</b>.','Smallx'),PageBreak()]

story += [P('1 · Publicar v6','H1x'),P('A. GitHub Desktop','H2x')]+steps(['Descomprime el ZIP. Entra en <b>1_CODIGO_GITHUB</b>.','Copia todo dentro de tu repositorio local <b>finanzas</b> y elige Reemplazar. En Windows activa Vista > Mostrar > Elementos ocultos para incluir <b>.github</b> y <b>.gitignore</b>.','GitHub Desktop: Summary <b>v6</b> > Commit to main > Push origin.','En github.com > Actions, espera el visto verde de <b>Prueba Finanzas</b>.'])
story += [P('B. Worker w4','H2x')]+steps(['Cloudflare > Workers & Pages > Worker <b>finanzas</b> > Edit code.','Abre <b>worker.js</b>, copia todo, sustituye todo y pulsa <b>Deploy</b>.','No borres el binding KV <b>CAUDAL</b> ni secretos existentes.','Finanzas > Ajustes. La app lo comprueba sola; debe decir <b>w4</b>. Si no, pulsa Guardar y probar.'])
story += [P('La web y el Worker son dos despliegues distintos. GitHub no puede sustituir el código de Cloudflare sin guardar un token de administración; por seguridad ese único paso permanece manual.','Callout'),PageBreak()]

story += [P('2 · Seguridad, instalación e IA','H1x'),P('Rotar TOKEN (solo si se expuso o quieres renovarlo)','H2x')]+steps(['Ajustes > Conexiones > Generar TOKEN nuevo > Copiar TOKEN nuevo.','Cloudflare > Worker > Settings > Variables and Secrets > TOKEN > Edit.','Pega, guarda y Deploy. Regresa a Finanzas > Guardar y probar.'])
story += [P('El campo TOKEN queda vacío y enmascarado aunque esté guardado. Es correcto.','Callout'),P('IA opcional','H2x'),P('<b>Local</b>: no necesita clave. Para Gemini añade <b>GEMINI_API_KEY</b>; OpenAI: <b>OPENAI_API_KEY</b>; Anthropic: <b>ANTHROPIC_API_KEY</b>; otra compatible: <b>AI_BASE_URL</b>, <b>AI_API_KEY</b> y <b>AI_MODEL</b>. Son secrets del Worker.'),P('Por defecto solo se envían totales agregados, categorías, activos y alertas. Los últimos movimientos requieren activar un permiso específico. La IA no opera ni sustituye asesoramiento.','Smallx'),P('Si Android dice «ya existe»','H2x')]+steps(['Ajustes > Aplicación instalada > <b>Instalar / localizar</b>.','Busca Finanzas en el cajón de aplicaciones: a veces solo se quitó el icono de inicio.','Si no aparece: Chrome > Información de la aplicación > Desinstalar; vuelve a la web e instala.','Si ves una versión antigua: Ajustes > Reparar caché. No borra datos.'])
story += [PageBreak()]

story += [P('3 · Automatización y sincronización','H1x'),P('Qué ocurre solo','H2x')]
auto=[['Tarea','Automático'],['Cambios','Guardado local antes de usar red'],['Sincronización','Al cambiar, abrir, volver, recuperar red y cada minuto'],['Fallos','Reintentos a 5 s, 15 s, 60 s y 5 min'],['Conflictos','Detección, mezcla por elemento y verificación'],['Copias','7 locales diarias + 10 cifradas en KV durante 30 días'],['Precios/saldos','Al abrir y por intervalo; claves read-only'],['Avisos','Saldo, presupuesto, anomalías, precios y desactualización'],['App/contexto','Service Worker + GitHub Actions']]
t=Table(auto,colWidths=[42*mm,122*mm],repeatRows=1);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),AMBER),('TEXTCOLOR',(0,0),(-1,0),colors.white),('FONT',(0,0),(-1,0),'Helvetica-Bold'),('FONT',(0,1),(-1,-1),'Helvetica'),('FONTSIZE',(0,0),(-1,-1),8.5),('GRID',(0,0),(-1,-1),.35,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,PAPER]),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]));story += [t,Spacer(1,4*mm),P('Ajustes > Automatización y salud > <b>Sincronizar y verificar</b>. Hazlo una vez en PC y móvil. Si se pone rojo, no borres nada: la cola sigue en el dispositivo y se reintenta.','Callout'),P('Importar el archivo del banco sigue en un toque: no existe una conexión bancaria universal, privada y gratuita. Automatizarla exigiría un agregador externo y entregar credenciales.','Smallx'),PageBreak()]

story += [P('4 · Uso diario','H1x'),P('Móvil','H2x')]+steps(['Inicio resume posición total, margen diario y señales.','Borde izquierdo hacia la derecha: menú. Deslizar lateral: cambia sección. Arrastrar la cabecera de una hoja hacia abajo: cierra. Siempre hay botón alternativo.','El ojo oculta todos los importes, incluido el saldo de cada movimiento.'])
story += [P('Importar y clasificar','H2x')]+steps(['Banco o bróker: exporta CSV, XLSX, OFX/QFX o QIF.','Pulsa Importar o arrastra. La app detecta columnas y elimina duplicados.','Corrige una categoría una vez; se aprende para ese comercio.','Para rentabilidad/FIFO importa el historial completo, no solo una foto de posiciones.'])
story += [P('Mercados','H2x'),P('Concentración, exposición, cambio ponderado, liquidez estable y escenario -10 % priorizan el riesgo. Radar carga tendencias gratuitas; al tocar un activo puedes cargar serie, RSI 14, SMA 20/50, volatilidad, drawdown y noticias.'),P('Son descripciones y escenarios, no señales ni garantía de beneficio.','Callout'),PageBreak()]

story += [P('5 · Diagnóstico rápido','H1x')]
diag=[['Problema','Qué hacer'],['Ajustes dice w2/w3','Pega worker.js v6, Deploy y abre Ajustes: debe comprobar w4 solo.'],['Sincronización roja','Mantén la app; recupera red y pulsa Sincronizar y verificar.'],['Datos diferentes','Sincroniza ambos; la mezcla conserva cambios por elemento.'],['Caché antigua','Ajustes > Reparar caché.'],['App «ya existe»','Instalar/localizar; si no aparece, desinstala la PWA residual desde Chrome.'],['Faltan datos','Ajustes > Recuperar última copia automática o descarga JSON.'],['No aparece rentabilidad','Importa compras, ventas, comisiones y costes de depósitos.'],['IA no responde','Comprueba el secret del proveedor o cambia a modo Local.']]
t=Table(diag,colWidths=[48*mm,116*mm],repeatRows=1);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),INK),('TEXTCOLOR',(0,0),(-1,0),colors.white),('FONT',(0,0),(-1,0),'Helvetica-Bold'),('FONT',(0,1),(-1,-1),'Helvetica'),('FONTSIZE',(0,0),(-1,-1),8.6),('GRID',(0,0),(-1,-1),.35,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,PAPER]),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]));story += [t,Spacer(1,6*mm),P('COMPROBACIÓN FINAL','H2x'),P('✓ GitHub Action verde &nbsp;&nbsp; ✓ Worker w4 &nbsp;&nbsp; ✓ TOKEN oculto &nbsp;&nbsp; ✓ PC y móvil sincronizados &nbsp;&nbsp; ✓ Copias visibles &nbsp;&nbsp; ✓ Gestos y botones funcionan','Callout'),P('Consulta AUTOMATIZACION_E_INNOVACION.txt para ver qué se automatizó, qué queda en un toque y por qué.','Smallx')]

doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(f'Creada {OUT}')
