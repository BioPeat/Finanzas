#!/usr/bin/env python3
from pathlib import Path
import os
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether, Image)

ROOT=Path(__file__).resolve().parent.parent
OUT=Path(os.environ.get('GUIA_OUT',ROOT/'GUIA_FINANZAS_v7.pdf'))
SHOTS=Path(os.environ.get('CAPTURAS_DIR',ROOT/'capturas_finales'))
NAVY=colors.HexColor('#182027'); BLUE=colors.HexColor('#285F9D'); BRONZE=colors.HexColor('#8A6331'); TEAL=colors.HexColor('#397C67')
PLUM=colors.HexColor('#66537E'); MUTED=colors.HexColor('#5F6F79'); PALE=colors.HexColor('#F2F4F5'); LINE=colors.HexColor('#D7DDE1'); RED=colors.HexColor('#A8322D'); WHITE=colors.white
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='Cover',parent=styles['Title'],fontName='Helvetica-Bold',fontSize=29,leading=32,textColor=NAVY,spaceAfter=7*mm))
styles.add(ParagraphStyle(name='Deck',parent=styles['BodyText'],fontName='Helvetica',fontSize=12,leading=17,textColor=MUTED,spaceAfter=5*mm))
styles.add(ParagraphStyle(name='H1x',parent=styles['Heading1'],fontName='Helvetica-Bold',fontSize=18,leading=22,textColor=NAVY,spaceBefore=2*mm,spaceAfter=4*mm,keepWithNext=True))
styles.add(ParagraphStyle(name='H2x',parent=styles['Heading2'],fontName='Helvetica-Bold',fontSize=12,leading=15,textColor=BLUE,spaceBefore=3.5*mm,spaceAfter=2*mm,keepWithNext=True))
styles.add(ParagraphStyle(name='H3x',parent=styles['Heading3'],fontName='Helvetica-Bold',fontSize=10,leading=13,textColor=BRONZE,spaceBefore=2.5*mm,spaceAfter=1.5*mm,keepWithNext=True))
styles.add(ParagraphStyle(name='Bodyx',parent=styles['BodyText'],fontName='Helvetica',fontSize=9.3,leading=13.1,textColor=NAVY,spaceAfter=2.1*mm))
styles.add(ParagraphStyle(name='Smallx',parent=styles['BodyText'],fontName='Helvetica',fontSize=7.9,leading=10.5,textColor=MUTED,spaceAfter=1.5*mm))
styles.add(ParagraphStyle(name='Step',parent=styles['BodyText'],fontName='Helvetica',fontSize=9.4,leading=13.3,textColor=NAVY,leftIndent=9*mm,firstLineIndent=-7*mm,spaceAfter=2.3*mm))
styles.add(ParagraphStyle(name='Callout',parent=styles['BodyText'],fontName='Helvetica-Bold',fontSize=9.2,leading=13,textColor=NAVY,backColor=PALE,borderColor=BLUE,borderWidth=.7,borderPadding=8,spaceAfter=4*mm))
styles.add(ParagraphStyle(name='Danger',parent=styles['BodyText'],fontName='Helvetica-Bold',fontSize=9.2,leading=13,textColor=RED,backColor=colors.HexColor('#FAEFEF'),borderColor=RED,borderWidth=.7,borderPadding=8,spaceAfter=4*mm))
styles.add(ParagraphStyle(name='Caption',parent=styles['BodyText'],fontName='Helvetica',fontSize=7.6,leading=10,textColor=MUTED,alignment=TA_CENTER,spaceAfter=3*mm))

def P(text,style='Bodyx'):return Paragraph(text,styles[style])
def steps(items,start=1):return [P(f'<b>{i}.</b> {text}','Step') for i,text in enumerate(items,start)]
def bullets(items):return [P(f'• {x}','Bodyx') for x in items]
def link(label,url):return f'<link href="{url}" color="#285F9D"><u>{label}</u></link>'
def footer(canvas,doc):
    canvas.saveState();canvas.setStrokeColor(LINE);canvas.line(18*mm,15*mm,192*mm,15*mm)
    canvas.setFont('Helvetica',7.3);canvas.setFillColor(MUTED);canvas.drawString(18*mm,10*mm,'Finanzas v7 · guía desde cero · 5 de noviembre de 2026');canvas.drawRightString(192*mm,10*mm,str(doc.page));canvas.restoreState()
def table(rows,widths,header=True):
    t=Table(rows,colWidths=widths,repeatRows=1 if header else 0,hAlign='LEFT')
    style=[('GRID',(0,0),(-1,-1),.35,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('FONT',(0,0),(-1,-1),'Helvetica'),('FONTSIZE',(0,0),(-1,-1),8.2),('LEADING',(0,0),(-1,-1),10.7),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('ROWBACKGROUNDS',(0,1),(-1,-1),[WHITE,PALE])]
    if header:style += [('BACKGROUND',(0,0),(-1,0),NAVY),('TEXTCOLOR',(0,0),(-1,0),WHITE),('FONT',(0,0),(-1,0),'Helvetica-Bold')]
    t.setStyle(TableStyle(style));return t
def shot(name,width=170*mm):
    p=SHOTS/name
    if not p.exists():return []
    im=Image(str(p));ratio=im.imageHeight/im.imageWidth;im.drawWidth=width;im.drawHeight=width*ratio
    return [im,P(name.replace('_',' ').replace('.png',''),'Caption')]

story=[]
story += [Spacer(1,12*mm),P('FINANZAS v7','H2x'),P('Tu posición financiera, paso a paso','Cover'),P('Guía escrita desde cero para actualizar la app, protegerla, conectar la sincronización, activar Gemini y enlazar exchanges sin saber programar. Todo lo obligatorio puede hacerse con servicios gratuitos.','Deck')]
story += [table([['Orden','Qué harás','Resultado'],['1','Guardar una copia','Puedes volver atrás'],['2','Subir la carpeta de GitHub','La web queda en v7'],['3','Actualizar el Worker','Sincronización y mercados responden w5'],['4','Corregir seguridad','TOKEN nuevo y ALLOWED_ORIGIN exacto'],['5','Opcional','Gemini y exchanges de solo lectura'],['6','Comprobar','PC, móvil, claro, oscuro y copia']], [15*mm,65*mm,84*mm]),Spacer(1,6*mm),P('No borres el KV CAUDAL, no borres los datos del sitio y no compartas TOKEN, claves, extractos, copias JSON ni enlaces de vinculación.','Danger'),P('Dentro del ZIP hay exactamente dos carpetas. La primera reemplaza el repositorio. La segunda contiene esta guía, instrucciones para Gemini/Claude, capturas y el resumen de evaluación.','Callout'),PageBreak()]

story += [P('Índice de la guía','H1x')]
contents=[('1','Antes de tocar nada','copia y vocabulario'),('2','Subir v7 a GitHub','copiar, commit, push y Actions'),('3','Actualizar Cloudflare Worker','pegar worker.js y confirmar w5'),('4','Corregir HTTP 403','ALLOWED_ORIGIN exacto'),('5','Regenerar TOKEN','sin mostrarlo ni perder datos'),('6','Activar Gemini','API separada de Gemini Pro'),('7','Conectar exchanges','solo lectura'),('8','Vincular móvil y PC','sincronización cifrada'),('9','Instalar o recuperar Android','identidad estable'),('10','Usar Inicio y Mercados','qué significa cada dato'),('11','Diagnóstico y vuelta atrás','errores comunes'),('12','Lista final','todo comprobado')]
story += [table([['Parte','Tema','Incluye']]+[list(x) for x in contents],[16*mm,60*mm,88*mm]),PageBreak()]

story += [P('1 · Antes de tocar nada','H1x'),P('1.1 Cierra y respalda','H2x')]+steps([
'En el móvil, cierra Finanzas por completo. En el PC, deja abierta solo una pestaña.',
'En Finanzas abre <b>Ajustes</b> → baja hasta <b>Automatización y salud</b> → pulsa <b>Descargar copia ahora</b>. Guarda el archivo JSON en una carpeta privada.',
'Comprueba que el archivo descargado no pesa 0 KB. No lo subas a GitHub, Gemini, Claude ni un chat.',
'En Ajustes anota solo la dirección del Worker que termina en <b>.workers.dev</b>. No anotes ni fotografíes el TOKEN.'
])
story += [P('1.2 Palabras que aparecen en esta guía','H2x'),table([['Palabra','Qué significa'],['Repositorio','La carpeta de GitHub que publica tu web.'],['Worker','El pequeño servicio de Cloudflare que sincroniza, consulta precios y protege claves.'],['KV CAUDAL','El almacén cifrado de sincronización. No se borra.'],['TOKEN','La contraseña entre la app y el Worker.'],['ALLOWED_ORIGIN','La web exacta autorizada para llamar al Worker.'],['Secret','Una variable cifrada de Cloudflare. Su valor no vuelve a mostrarse.'],['API key','Clave de Gemini o de un exchange. Siempre va en Cloudflare, nunca en GitHub.']], [38*mm,126*mm]),P('Los nombres internos <b>caudal_v1</b>, <b>caudal:</b>, <b>X-Caudal-Token</b> y <b>CAUDAL</b> se mantienen para conservar tus datos.','Callout'),PageBreak()]

story += [P('2 · Subir Finanzas v7 a GitHub','H1x'),P('2.1 Descomprimir bien','H2x')]+steps([
'Haz clic derecho sobre el ZIP final → <b>Extraer todo</b>. No copies archivos desde la vista interior del ZIP.',
'Abre la carpeta extraída → abre <b>1_CODIGO_GITHUB</b>. Debes ver <b>index.html</b>, <b>worker.js</b>, <b>manifest.json</b>, <b>.github</b>, <b>tests</b>, <b>tools</b> y <b>.gitignore</b>.',
'En el Explorador de Windows activa <b>Ver → Mostrar → Elementos ocultos</b>. Así no se pierden <b>.github</b> ni <b>.gitignore</b>.'
])
story += [P('2.2 Copiar y reemplazar','H2x')]+steps([
'Abre GitHub Desktop. Arriba a la izquierda selecciona el repositorio de Finanzas.',
'Pulsa <b>Repository → Show in Explorer</b>. Se abre la carpeta local correcta.',
'Vuelve a <b>1_CODIGO_GITHUB</b>, selecciona todo con Ctrl+A y copia con Ctrl+C.',
'Pega dentro de la carpeta del repositorio con Ctrl+V. Cuando Windows pregunte, elige <b>Reemplazar los archivos del destino</b>. No borres la carpeta <b>.git</b>.',
'Vuelve a GitHub Desktop. En la caja <b>Summary</b> escribe <b>Finanzas v7 final</b>. Pulsa <b>Commit to main</b> y después <b>Push origin</b>.'
])
story += [P('2.3 Esperar la prueba automática','H2x')]+steps([
'Abre github.com y entra en tu repositorio.',
'Pulsa la pestaña <b>Actions</b>. Abre la ejecución llamada <b>Prueba Finanzas</b>.',
'Espera al visto verde. Prueba el Worker, importa ejemplos, recorre pantallas, verifica sincronización y revisa móvil/escritorio.',
'Si sale rojo, abre el paso rojo y copia el mensaje. No sigas con Cloudflare hasta corregirlo.'
])+[P('GitHub Pages puede tardar unos minutos. Recargar repetidamente no acelera el despliegue.','Callout'),PageBreak()]

story += [P('3 · Actualizar el Worker de Cloudflare','H1x'),P('El código de GitHub y el Worker son dos despliegues distintos. Este paso es manual para no guardar un token de administración.','Callout')]+steps([
'Entra en '+link('dash.cloudflare.com','https://dash.cloudflare.com')+' e inicia sesión.',
'En el menú izquierdo pulsa <b>Workers & Pages</b>. Abre tu Worker llamado <b>finanzas</b>.',
'Pulsa <b>Edit code</b>. En el editor haz clic dentro, Ctrl+A y Supr.',
'En la carpeta <b>1_CODIGO_GITHUB</b> abre <b>worker.js</b> con Bloc de notas. Ctrl+A, Ctrl+C.',
'Vuelve al editor de Cloudflare, pega con Ctrl+V y pulsa <b>Deploy</b>. Espera el mensaje de éxito.',
'No borres <b>Variables and Secrets</b> ni el binding <b>CAUDAL</b>. Actualizar código no exige recrearlos.',
'Abre Finanzas → <b>Ajustes</b> → <b>Conexiones automáticas y Worker</b>. Pulsa <b>Guardar y probar</b>. Debe mostrar <b>Worker conectado · w5</b>.'
])
story += [P('Si sigue diciendo w4 o anterior','H2x')]+steps(['Comprueba que pulsaste <b>Deploy</b>, no solo Save.','Recarga Finanzas con internet.','En Ajustes pulsa <b>Reparar caché</b>; no borra tus datos.','Vuelve a Guardar y probar.'])+[PageBreak()]

story += [P('4 · Corregir HTTP 403 y ALLOWED_ORIGIN','H1x'),P('Un 403 significa: Cloudflare ha recibido la petición, pero el origen autorizado no coincide con la web. La v7 muestra el valor que debes corregir.','Callout')]+steps([
'En Cloudflare abre <b>Workers & Pages → finanzas → Settings</b>.',
'Entra en <b>Variables and Secrets</b>. Busca <b>ALLOWED_ORIGIN</b>.',
'Pulsa el icono de editar. Para tu web escribe exactamente <b>https://biopeat.github.io</b>.',
'No añadas <b>/finanzas</b>, no añadas una barra al final, no pongas comillas y no uses la dirección <b>.workers.dev</b>.',
'Guarda el secret. Si Cloudflare ofrece desplegar los cambios, confirma el despliegue.',
'Vuelve a Finanzas → Ajustes → Guardar y probar. Después abre Mercados y pulsa Actualizar.'
])
story += [P('Cómo saber cuál es el valor correcto','H2x'),P('Abre la app en el navegador y mira solo esta parte de la dirección: protocolo + dominio. Si la dirección es <b>https://biopeat.github.io/finanzas/</b>, el origen sigue siendo <b>https://biopeat.github.io</b>. La ruta posterior no forma parte de ALLOWED_ORIGIN.'),P('No elimines ALLOWED_ORIGIN para “arreglar” el 403: funcionaría, pero cualquier web podría intentar llamar a tu Worker.','Danger'),PageBreak()]

story += [P('5 · Regenerar el TOKEN con seguridad','H1x'),P('Hazlo si el TOKEN apareció en una captura, si lo compartiste o si quieres renovarlo. El valor nunca se enseña después de guardarlo.','Bodyx')]+steps([
'En Finanzas abre <b>Ajustes → Conexiones automáticas y Worker</b>.',
'Pulsa <b>Generar TOKEN nuevo</b>. Después pulsa <b>Copiar TOKEN nuevo</b>. No lo pegues en un chat ni lo guardes en un documento.',
'Sin cerrar esa pestaña, abre Cloudflare → <b>finanzas → Settings → Variables and Secrets</b>.',
'Busca el secret <b>TOKEN</b> → Edit → pega el nuevo valor → Save. Confirma el despliegue si aparece.',
'Vuelve a Finanzas y pulsa <b>Guardar y probar</b>. Si falla “código incorrecto”, repite la copia; no generes otro hasta comprobar qué valor guardaste.',
'Comprueba el móvil. Si allí queda el TOKEN anterior, abre Ajustes, pega temporalmente el nuevo TOKEN en el campo y pulsa Guardar y probar. El campo volverá a quedar vacío.'
])+[P('No borres el KV CAUDAL al cambiar TOKEN. El TOKEN controla el acceso; el KV contiene las copias cifradas.','Danger'),PageBreak()]

story += [P('6 · Activar Gemini real (opcional)','H1x'),P('Gemini Pro y la API no son lo mismo','H2x'),P('Tu suscripción Gemini Pro puede mejorar el producto Gemini, pero Finanzas necesita una <b>GEMINI_API_KEY</b> separada. La clave se crea en Google AI Studio. Google ofrece planes y cuotas de API por separado; revisa allí el límite vigente.')]
story += steps([
'Abre '+link('aistudio.google.com','https://aistudio.google.com')+' con tu cuenta de Google.',
'Busca <b>Get API key</b> o <b>API keys</b>. Pulsa <b>Create API key</b>. Si pide un proyecto, crea uno nuevo para Finanzas o elige uno personal.',
'Copia la clave. No hagas capturas y no la pongas en GitHub.',
'En Cloudflare abre <b>finanzas → Settings → Variables and Secrets → Add variable</b>. Tipo: <b>Secret</b>. Nombre: <b>GEMINI_API_KEY</b>. Valor: pega la clave. Guarda.',
'Opcional: añade <b>GEMINI_MODEL</b> con valor <b>gemini-2.5-flash</b>. Si lo omites, el Worker ya usa ese modelo por defecto.',
'Vuelve a Finanzas → Ajustes → <b>Copiloto de IA</b>. Proveedor: <b>Gemini</b>. Deja “Modelo opcional” vacío salvo que quieras forzarlo. Pulsa <b>Guardar IA</b>.',
'Abre Copiloto y elige <b>Calidad de datos</b>. Si responde, la conexión funciona.'
])
story += [P('Privacidad del Copiloto','H2x')]+bullets(['Modo Local: reglas y cálculos en el dispositivo; no usa clave ni envía datos.','Gemini/otra IA: por defecto recibe totales, categorías, activos y alertas; no recibe TOKEN ni claves.','La casilla de últimos 30 movimientos está desactivada por defecto. Actívala solo si quieres ese análisis.','El Copiloto no opera y puede equivocarse.'])+[PageBreak()]

story += [P('7 · Conectar exchanges (opcional)','H1x'),P('Regla absoluta: crea claves de <b>solo lectura</b>. Nunca marques Trading, Orders, Withdraw, Transfer, Margin, Futures trading ni permisos de retirada. Usa lista blanca de IP solo si sabes mantenerla; el Worker gratuito no tiene una IP fija.','Danger'),P('7.1 Patrón común','H2x')]+steps([
'En el exchange abre tu perfil → <b>API Management</b>, <b>API</b> o <b>Security → API</b>.',
'Crea una clave llamada <b>Finanzas lectura</b>. Completa 2FA si lo pide.',
'Desactiva todos los permisos salvo lectura de saldos/cuenta. Copia Key, Secret y passphrase si existe.',
'En Cloudflare → finanzas → Settings → Variables and Secrets → Add → <b>Secret</b>. Añade los nombres exactos de la tabla inferior.',
'Despliega los cambios y vuelve a Finanzas → Ajustes → Guardar y probar. El Worker indica qué exchanges tienen claves.'
])
exchange=[['Exchange','Secrets exactos','Permiso'],['Binance','BINANCE_KEY + BINANCE_SECRET','Enable Reading'],['Kraken','KRAKEN_KEY + KRAKEN_SECRET','Query Funds / Ledger; sin Withdraw'],['KuCoin','KUCOIN_KEY + KUCOIN_SECRET + KUCOIN_PASSPHRASE','General / Read'],['OKX','OKX_KEY + OKX_SECRET + OKX_PASSPHRASE','Read'],['Bybit','BYBIT_KEY + BYBIT_SECRET','Read-Only']]
story += [table(exchange,[30*mm,86*mm,48*mm]),P('Para una cuenta europea de Bybit que lo requiera, añade <b>BYBIT_BASE</b> con la URL oficial europea mostrada en tu cuenta. No la inventes.','Smallx'),P('7.2 Si no quieres usar API','H2x')]+steps(['Exporta el historial en CSV desde el exchange.','En Finanzas pulsa Importar y elige el archivo.','Repite periodos solapados: la app elimina duplicados.','Para rentabilidad e impuestos importa compras, ventas, comisiones, depósitos y retiradas; una foto de posiciones no basta.'])+[PageBreak()]

story += [P('8 · Vincular móvil y ordenador','H1x')]+steps([
'En el PC abre Ajustes. Confirma primero <b>Worker w5</b>.',
'En <b>Tus dispositivos</b> pulsa <b>Activar sincronización</b>. Espera “Sincronizado”.',
'Pulsa <b>Vincular otro dispositivo</b> o <b>Enviar al móvil</b>. El enlace contiene la clave de descifrado: envíatelo solo a ti.',
'Abre el enlace en Chrome del móvil. Espera a que aparezcan las cuentas y movimientos.',
'En el móvil añade un gasto de prueba. En el PC pulsa <b>Sincronizar ahora</b> y comprueba que aparece.',
'Borra el gasto de prueba. Comprueba el borrado en los dos dispositivos.'
])
story += [P('La app guarda primero en el dispositivo. Si no hay internet, conserva el cambio y reintenta al volver la conexión. La sincronización mezcla cambios por elemento y conserva borrados.','Callout'),P('Si los dispositivos difieren','H2x')]+steps(['No borres datos. Pulsa Sincronizar y verificar en ambos.','Mantén las dos apps abiertas con internet durante un minuto.','Si sigue rojo, descarga una copia JSON de cada dispositivo antes de hacer nada más.'])+[PageBreak()]

story += [P('9 · Instalar o recuperar Android','H1x'),P('La identidad del manifest sigue siendo <b>finanzas-app</b>. No se cambia entre versiones para que Android reconozca la misma PWA.','Bodyx')]+steps([
'Abre Finanzas en Chrome del móvil.',
'Chrome → menú de tres puntos → <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.',
'Si Android dice “ya existe”, busca Finanzas en el cajón de aplicaciones: puede haberse borrado solo el icono de la pantalla de inicio.',
'Si no aparece, en Finanzas abre <b>Ajustes → Aplicación instalada → Instalar / localizar</b> y sigue la ruta mostrada.',
'Si ves una versión antigua, pulsa <b>Reparar caché</b>. Borra solo caché y service worker; no borra datos financieros.',
'Como último recurso, desinstala la PWA desde Información de la aplicación y vuelve a instalar. Antes descarga una copia JSON.'
])+[P('No uses “Borrar datos del sitio” como primer intento: puede eliminar la copia local del dispositivo.','Danger'),PageBreak()]

story += [P('10 · Entender la nueva app','H1x'),P('10.1 Posición','H2x')]+bullets(['Patrimonio total: cuentas, efectivo, inversiones y márgenes registrados.','Hoy / 7 días / 30 días: cambio desde una base real comparable. La primera importación no cuenta como ganancia.','Disponible frente a invertido: dónde está el dinero ahora.','Cuentas y activos: acceso directo sin entrar en menús.','Flujo: ingresos, gasto y balance del mes; está subordinado a la posición general.','Cola de decisiones: problemas que requieren revisión, no notificaciones decorativas.'])
story += shot('01_PC_OSCURO_POSICION.png',150*mm)
story += [PageBreak(),P('10.2 Mercados','H2x')]+bullets(['Panorama: valor, salud, concentración, coste FIFO, liquidez y escenarios.','Posiciones: activos, operaciones y derivados.','Explorar: radar de liquidez/movimiento y acceso a contexto; no son recomendaciones.','Toca un activo: gráfico TradingView, RSI, medias 20/50, volatilidad, drawdown y noticias.','Coste fiable bajo: importa historial antes de interpretar rentabilidad.','Escenarios: muestran impacto lineal; no predicen el mercado ni incluyen todas las correlaciones.'])
story += shot('06_MOVIL_CLARO_MERCADOS.png',45*mm)
story += [P('Objetivo de estas funciones: entender exposición y riesgo, detectar datos incompletos y comparar decisiones. Ninguna función puede garantizar o maximizar beneficios por sí sola.','Callout'),PageBreak()]

story += [P('11 · Diagnóstico rápido y vuelta atrás','H1x')]
diag=[['Lo que ves','Causa más probable','Qué hacer'],['HTTP 403','ALLOWED_ORIGIN distinto','Pon https://biopeat.github.io sin barra y despliega.'],['Código incorrecto','TOKEN distinto','Pega el mismo TOKEN en app y Cloudflare.'],['Worker w4','Código sin desplegar o caché','Pega worker.js, Deploy, Reparar caché.'],['Mercados vacíos','Sin posiciones o Worker bloqueado','Importa historial; confirma w5 y Actualizar.'],['Rentabilidad pendiente','Falta coste FIFO','Importa compras/comisiones o completa depósitos.'],['Gemini no responde','Falta secret o modelo','Comprueba GEMINI_API_KEY; prueba Local.'],['“Ya existe”','PWA residual','Instalar/localizar; después desinstalar residual.'],['Sincronización roja','Sin red, 401/403 o conflicto','No borres; sincroniza, corrige Worker y reintenta.'],['Versión antigua','Service worker anterior','Ajustes → Reparar caché.']]
story += [table(diag,[34*mm,55*mm,75*mm]),P('Volver a la versión anterior','H2x')]+steps(['No borres datos ni KV.','En GitHub Desktop abre <b>History</b>, selecciona el commit anterior y usa <b>Revert this commit</b>. Haz Push origin.','Si el problema era el Worker, pega el worker.js anterior y Deploy.','Restaura JSON solo si faltan datos; la restauración mezcla y no debe usarse para “cambiar diseño”.'])+[PageBreak()]

story += [P('12 · Comprobación final','H1x')]
checks=[['Comprobación','Resultado esperado'],['GitHub Actions','Prueba Finanzas en verde'],['App','Finanzas v7 visible'],['Worker','w5 conectado'],['Origen','Sin HTTP 403'],['TOKEN','Campo vacío/enmascarado; conexión correcta'],['PC y móvil','Mismos datos después de sincronizar'],['Copia','JSON descargado y guardado en privado'],['Mercados','Panorama, Posiciones y Explorar funcionan'],['Gemini (si lo activaste)','Responde Calidad de datos'],['Exchanges (si los activaste)','Solo lectura y saldos visibles'],['Instalación','Una sola app Finanzas en Android']]
story += [table(checks,[55*mm,109*mm]),Spacer(1,5*mm),P('Qué se automatiza','H2x')]+bullets(['Detección de archivos, columnas, duplicados y categorías aprendidas.','Precios, saldos, snapshots, alertas, recurrencias y previsión.','Guardado local, cola sin conexión, reintentos, conflictos y verificación.','Siete copias locales diarias y diez versiones cifradas del KV.','Actualización de contexto/mapa y pruebas en cada Push.'])
story += [P('Qué sigue siendo manual','H2x')]+bullets(['Primer Deploy del Worker y cambios de secrets: requieren confirmación por seguridad.','Exportar el banco: no existe agregación bancaria universal, privada y gratuita sin entregar credenciales.','Decidir inversiones y validar información fiscal: no se delega en una automatización.'])+[P('Fin. Guarda este PDF junto al ZIP, pero guarda copias JSON y claves en un lugar privado distinto.','Callout')]

OUT.parent.mkdir(parents=True,exist_ok=True)
doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=18*mm,leftMargin=18*mm,topMargin=18*mm,bottomMargin=20*mm,title='Finanzas v7 - Guia paso a paso desde cero',author='Microsoft Copilot')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print('Guía creada:',OUT)
