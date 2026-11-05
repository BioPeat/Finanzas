# MAPA DEL CÓDIGO · Finanzas v6

Generado solo. Sirve para orientarse: busca siempre por el nombre de la función, las líneas cambian.

- constante `APP_VERSION` · línea 519

## Utilidades (línea 521)
- `localDate(d)` · línea 530
- `addDays(s,n)` · línea 531
- `monthAdd(m,n)` · línea 533
- constante `MONTHS` · línea 534
- `fmtDate(s,o={day:'numeric',month:'short'})` · línea 537
- `nf(n,d=2,min=d)` · línea 538
- `money(eur,opts={})` · línea 540
- `toNum(v)` · línea 551
- `toDate(v,dmy=true)` · línea 562
- constante `ICON` · línea 573

## Estado y guardado (línea 611)
- constante `LISTS` · línea 614
- constante `MAPS` · línea 615
- constante `SHARED` · línea 616
- `defaults()` · línea 617
- `load()` · línea 636
- `migrate(o)` · línea 641
- `autoBackup()` · línea 651
- `backupInfo()` · línea 659
- `restoreAutomaticBackup()` · línea 660
- `save(sync=true)` · línea 661
- `stampChanges(before)` · línea 668
- `change(fn,msg)` · línea 685
- `undo()` · línea 692
- `toast(text,canUndo=false)` · línea 702

## Categorías (línea 709)
- constante `CATS` · línea 711
- constante `RULES_BASE` · línea 723
- `merchantOf(desc)` · línea 744
- `categorize(t)` · línea 752

## Importar archivos (Excel .xlsx y CSV) (línea 762)
- `unzip(buf)` · línea 764
- `readXlsx(buf)` · línea 779
- `parseCSV(text)` · línea 786
- `findHeader(rows,needles)` · línea 800
- constante `FORMATS` · línea 805
- `detect(rows)` · línea 813
- `col(hs,...names)` · línea 817
- `parseBank(rows,fmt,head)` · línea 819
- `normAsset(a)` · línea 834
- `binanceKind(op,acct)` · línea 839
- `krakenKind(type,sub)` · línea 851
- `parseLedger(rows,fmt,head,map)` · línea 860
- `parseOFX(text)` · línea 891
- `parseQIF(text)` · línea 899
- `readFile(file)` · línea 905
- `importFiles(files)` · línea 914
- `openImport(rows,det,fname,map)` · línea 926
- `openMapper(rows,fname)` · línea 962
- `openPositionsImport(rows,head,fname,map)` · línea 987
- `importBackup(o)` · línea 995

## Activos y precios (línea 1001)
- constante `FIAT` · línea 1002
- constante `STABLE` · línea 1003
- constante `CLASS_NAMES` · línea 1004
- constante `CLASS_COLOR` · línea 1005
- `ensureAsset(sym)` · línea 1006
- `priceEUR(sym)` · línea 1009
- `fx(cur)` · línea 1015
- `trackedAssets()` · línea 1017
- `refreshPrices(force=false)` · línea 1024
- `directPrices(cryptos)` · línea 1039
- `priceAt(sym,t)` · línea 1047

## Cartera: qué tienes y cuánto vale (línea 1064)
- `bankBalance(a)` · línea 1065
- `positionRows()` · línea 1074
- `derivRows()` · línea 1086
- `netWorth()` · línea 1095
- `investmentSummary()` · línea 1103
- `snapshot()` · línea 1111
- `bankHistory(days=365)` · línea 1118
- `netSeries(days)` · línea 1129

## Movimientos: resúmenes del mes (línea 1136)
- `monthTotals(m)` · línea 1137
- `lastMonths(n)` · línea 1144
- `recurring()` · línea 1146

## Análisis: de un vistazo (línea 1158)
- `liquidity()` · línea 1160
- `avgMonthlyExpense()` · línea 1162
- `cushion()` · línea 1164
- `pace()` · línea 1166
- `upcoming(days=31)` · línea 1172
- `forecast()` · línea 1182
- `topMerchants(m,n=5)` · línea 1194
- `dailySpend(m)` · línea 1195
- `insights()` · línea 1197

## Fiscalidad (España): FIFO, base del ahorro, borrador (línea 1210)
- constante `TRAMOS_AHORRO` · línea 1212
- `cuotaAhorro(base)` · línea 1213
- `matchTransfers(L)` · línea 1215
- `taxGroups()` · línea 1221
- `taxPrefetch(onStep)` · línea 1227
- `taxCompute()` · línea 1236
- `balancesAt(date)` · línea 1277
- `modelo721(year)` · línea 1278
- `taxSummary(year,extra=0)` · línea 1284
- `byCoin(disp)` · línea 1289

## Conexión con el Worker (exchanges, precios, sincronización) (línea 1291)
- `api(path,opts={})` · línea 1293
- constante `EXCH` · línea 1305
- `syncBalances(manual=false)` · línea 1307

## Sincronización cifrada entre dispositivos (línea 1328)
- `b64u(b)` · línea 1331
- `syncKey()` · línea 1333
- `syncId()` · línea 1334
- constante `LOCAL_ONLY` · línea 1335
- `syncPayload()` · línea 1336
- `encrypt(obj)` · línea 1337
- `decrypt(s)` · línea 1343
- `mergeStates(local,remote)` · línea 1349
- `scheduleSync(ms=1500)` · línea 1376
- `syncNow(manual=false)` · línea 1377
- `ago(t)` · línea 1413
- `paintSync()` · línea 1414
- `pairLink()` · línea 1423
- `readPair()` · línea 1424

## Avisos (línea 1433)
- `alerts()` · línea 1434

## Gráficos interactivos (SVG propios, sin librerías) (línea 1451)
- constante `CHARTS` · línea 1453
- `svgLine(pts,{h,w,id='nw',col}={})` · línea 1456
- `svgCompare(m)` · línea 1471
- `svgDays(m)` · línea 1485
- `svgMonths(months)` · línea 1494
- `donut(entries,{id='cats',label='Gastado',total)` · línea 1501
- `allocBar(parts,total)` · línea 1507
- `bindCharts(root=document)` · línea 1511

## Instalación PWA, radar y Copiloto (línea 1544)
- `installState()` · línea 1549
- `installApp()` · línea 1550
- `repairPWA()` · línea 1555
- `aiPayload(kind)` · línea 1560
- `localAdvice(kind)` · línea 1566
- `portfolioMetricsFromPayload(rows)` · línea 1575
- `runAI(kind)` · línea 1576
- `vCopilot()` · línea 1587
- `calcTechnical(closes)` · línea 1595
- `loadAssetIntel(sym)` · línea 1600
- `loadRadar()` · línea 1606
- `assetIntelHTML(sym)` · línea 1607

## Navegación (línea 1609)
- constante `VIEWS` · línea 1611
- constante `TABS` · línea 1612
- constante `CORE_VIEWS` · línea 1613
- constante `RANGES` · línea 1615
- `go(v,f)` · línea 1616
- `navBtn(id,n,i,cls='nav')` · línea 1622
- `navBtns(cls)` · línea 1623
- `sideNav()` · línea 1624
- `drawerNav()` · línea 1625
- `renderNav()` · línea 1626
- `render()` · línea 1635
- `head(title,sub,actions='')` · línea 1645
- `catInitials(c)` · línea 1647
- `initials(s)` · línea 1649
- `assetColor(sym)` · línea 1651
- `moneyBig(eur)` · línea 1653
- `rangeBtns()` · línea 1658
- `deltaPill(chg,base,txt)` · línea 1660
- constante `RANGE_TXT` · línea 1661

## Inicio (línea 1663)
- `vResumenMobile()` · línea 1664
- `greeting()` · línea 1680
- `safeToSpend()` · línea 1682
- `accValue(a,rows)` · línea 1683
- `accCard(a,rows)` · línea 1684
- `vResumen()` · línea 1689
- `catRow(k,v,max,total,attrs)` · línea 1708
- `onboarding()` · línea 1712
- `txItem(t)` · línea 1720
- `goalRow(g)` · línea 1724
- `goalSaved(g)` · línea 1729

## Movimientos (pestaña «Gastos») (línea 1731)
- `filtered()` · línea 1732
- `vMovs()` · línea 1737
- `editTx(id)` · línea 1765
- `quickAdd()` · línea 1776

## Objetivos y presupuestos (línea 1791)
- `vGoals()` · línea 1792
- `editGoal(id)` · línea 1800

## Inversiones (línea 1810)
- `costBasis()` · línea 1811
- `invSeries(days)` · línea 1813
- `portfolioMetrics(list,total)` · línea 1817
- `vInv()` · línea 1820
- `holdingRow(x)` · línea 1826
- `riskStrip(pm,list,total)` · línea 1827
- `radarHTML(trends)` · línea 1828
- constante `PAL` · línea 1830
- `invDonut(list,total)` · línea 1831
- `accTable(rows)` · línea 1832
- constante `OPK` · línea 1836
- `opsTable(ops)` · línea 1837
- `tvSymbol(sym)` · línea 1842
- `tradingViewURL(sym)` · línea 1849
- `assetDetail(sym)` · línea 1850
- `editOp(id)` · línea 1861
- `editDeriv(id)` · línea 1873

## Impuestos (línea 1886)
- `vTax()` · línea 1888
- `taxCSV(year)` · línea 1912
- `taxAIText(year)` · línea 1921

## Cuentas (línea 1932)
- constante `KIND_NAMES` · línea 1933
- constante `KIND_ICON` · línea 1934
- `vCuentas()` · línea 1935
- `editAcc(id)` · línea 1945

## Ajustes (línea 1956)
- constante `WORKER_STEPS` · línea 1957
- `vAjustes()` · línea 1958
- `workerInfoHTML(i)` · línea 1977
- `vMas()` · línea 1982

## Ventana, descargas y acciones (línea 1996)
- `modal(title,html)` · línea 1997
- `download(name,text,type='application/json')` · línea 1998
- `copyText(t,msg='Copiado')` · línea 1999
- `resetDrawerGesture()` · línea 2003
- `openDrawer()` · línea 2004
- `closeDrawer()` · línea 2005
- `gestureStart(e)` · línea 2007
- `gestureMove(e)` · línea 2015
- `gestureEnd(e)` · línea 2026
- `act(a,el)` · línea 2033
- `confirmTwice(el)` · línea 2126
- `afterRender()` · línea 2164

## Arranque (línea 2182)
- `refreshAll(force)` · línea 2184
- `init()` · línea 2190
