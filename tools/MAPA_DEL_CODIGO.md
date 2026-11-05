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
- `api(path,opts={})` · línea 1292
- constante `EXCH` · línea 1304
- `syncBalances(manual=false)` · línea 1306

## Sincronización cifrada entre dispositivos (línea 1327)
- `b64u(b)` · línea 1330
- `syncKey()` · línea 1332
- `syncId()` · línea 1333
- constante `LOCAL_ONLY` · línea 1334
- `syncPayload()` · línea 1335
- `encrypt(obj)` · línea 1336
- `decrypt(s)` · línea 1342
- `mergeStates(local,remote)` · línea 1348
- `scheduleSync(ms=1500)` · línea 1375
- `syncNow(manual=false)` · línea 1376
- `ago(t)` · línea 1412
- `paintSync()` · línea 1413
- `pairLink()` · línea 1422
- `readPair()` · línea 1423

## Avisos (línea 1432)
- `alerts()` · línea 1433

## Gráficos interactivos (SVG propios, sin librerías) (línea 1450)
- constante `CHARTS` · línea 1452
- `svgLine(pts,{h,w,id='nw',col}={})` · línea 1455
- `svgCompare(m)` · línea 1470
- `svgDays(m)` · línea 1484
- `svgMonths(months)` · línea 1493
- `donut(entries,{id='cats',label='Gastado',total)` · línea 1500
- `allocBar(parts,total)` · línea 1506
- `bindCharts(root=document)` · línea 1510

## Instalación PWA, radar y Copiloto (línea 1543)
- `installState()` · línea 1548
- `installApp()` · línea 1549
- `repairPWA()` · línea 1554
- `aiPayload(kind)` · línea 1559
- `localAdvice(kind)` · línea 1565
- `portfolioMetricsFromPayload(rows)` · línea 1574
- `runAI(kind)` · línea 1575
- `vCopilot()` · línea 1586
- `calcTechnical(closes)` · línea 1594
- `loadAssetIntel(sym)` · línea 1599
- `loadRadar()` · línea 1605
- `assetIntelHTML(sym)` · línea 1606

## Navegación (línea 1608)
- constante `VIEWS` · línea 1610
- constante `TABS` · línea 1611
- constante `CORE_VIEWS` · línea 1612
- constante `RANGES` · línea 1614
- `go(v,f)` · línea 1615
- `navBtn(id,n,i,cls='nav')` · línea 1621
- `navBtns(cls)` · línea 1622
- `sideNav()` · línea 1623
- `drawerNav()` · línea 1624
- `renderNav()` · línea 1625
- `render()` · línea 1634
- `head(title,sub,actions='')` · línea 1644
- `catInitials(c)` · línea 1646
- `initials(s)` · línea 1648
- `assetColor(sym)` · línea 1650
- `moneyBig(eur)` · línea 1652
- `rangeBtns()` · línea 1657
- `deltaPill(chg,base,txt)` · línea 1659
- constante `RANGE_TXT` · línea 1660

## Inicio (línea 1662)
- `vResumenMobile()` · línea 1663
- `greeting()` · línea 1679
- `safeToSpend()` · línea 1681
- `accValue(a,rows)` · línea 1682
- `accCard(a,rows)` · línea 1683
- `vResumen()` · línea 1688
- `catRow(k,v,max,total,attrs)` · línea 1707
- `onboarding()` · línea 1711
- `txItem(t)` · línea 1719
- `goalRow(g)` · línea 1723
- `goalSaved(g)` · línea 1728

## Movimientos (pestaña «Gastos») (línea 1730)
- `filtered()` · línea 1731
- `vMovs()` · línea 1736
- `editTx(id)` · línea 1764
- `quickAdd()` · línea 1775

## Objetivos y presupuestos (línea 1790)
- `vGoals()` · línea 1791
- `editGoal(id)` · línea 1799

## Inversiones (línea 1809)
- `costBasis()` · línea 1810
- `invSeries(days)` · línea 1812
- `portfolioMetrics(list,total)` · línea 1816
- `vInv()` · línea 1819
- `holdingRow(x)` · línea 1825
- `riskStrip(pm,list,total)` · línea 1826
- `radarHTML(trends)` · línea 1827
- constante `PAL` · línea 1829
- `invDonut(list,total)` · línea 1830
- `accTable(rows)` · línea 1831
- constante `OPK` · línea 1835
- `opsTable(ops)` · línea 1836
- `tvSymbol(sym)` · línea 1841
- `tradingViewURL(sym)` · línea 1848
- `assetDetail(sym)` · línea 1849
- `editOp(id)` · línea 1860
- `editDeriv(id)` · línea 1872

## Impuestos (línea 1885)
- `vTax()` · línea 1887
- `taxCSV(year)` · línea 1911
- `taxAIText(year)` · línea 1920

## Cuentas (línea 1931)
- constante `KIND_NAMES` · línea 1932
- constante `KIND_ICON` · línea 1933
- `vCuentas()` · línea 1934
- `editAcc(id)` · línea 1944

## Ajustes (línea 1955)
- constante `WORKER_STEPS` · línea 1956
- `vAjustes()` · línea 1957
- `workerInfoHTML(i)` · línea 1976
- `vMas()` · línea 1981

## Ventana, descargas y acciones (línea 1995)
- `modal(title,html)` · línea 1996
- `download(name,text,type='application/json')` · línea 1997
- `copyText(t,msg='Copiado')` · línea 1998
- `resetDrawerGesture()` · línea 2002
- `openDrawer()` · línea 2003
- `closeDrawer()` · línea 2004
- `gestureStart(e)` · línea 2006
- `gestureMove(e)` · línea 2014
- `gestureEnd(e)` · línea 2025
- `act(a,el)` · línea 2032
- `confirmTwice(el)` · línea 2125
- `afterRender()` · línea 2163

## Arranque (línea 2181)
- `refreshAll(force)` · línea 2183
- `init()` · línea 2189
