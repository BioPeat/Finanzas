# MAPA DEL CÓDIGO · Finanzas v7

Generado automáticamente. Busca por función; las líneas cambian.


## Utilidades · línea 546
- `localDate(d)` · línea 555
- `addDays(s,n)` · línea 556
- `monthAdd(m,n)` · línea 558
- `fmtDate(s,o={day:'numeric',month:'short'})` · línea 562
- `nf(n,d=2,min=d)` · línea 563
- `money(eur,opts={})` · línea 565
- `toNum(v)` · línea 576
- `toDate(v,dmy=true)` · línea 587

## Estado y guardado · línea 636
- `defaults()` · línea 642
- `load()` · línea 661
- `migrate(o)` · línea 666
- `autoBackup()` · línea 676
- `backupInfo()` · línea 684
- `restoreAutomaticBackup()` · línea 685
- `save(sync=true)` · línea 686
- `stampChanges(before)` · línea 693
- `change(fn,msg)` · línea 710
- `undo()` · línea 717
- `toast(text,canUndo=false)` · línea 727

## Categorías · línea 734
- `merchantOf(desc)` · línea 769
- `categorize(t)` · línea 777

## Importar archivos (Excel .xlsx y CSV) · línea 787
- `unzip(buf)` · línea 789
- `readXlsx(buf)` · línea 804
- `parseCSV(text)` · línea 811
- `findHeader(rows,needles)` · línea 825
- `detect(rows)` · línea 838
- `col(hs,...names)` · línea 842
- `parseBank(rows,fmt,head)` · línea 844
- `normAsset(a)` · línea 859
- `binanceKind(op,acct)` · línea 864
- `krakenKind(type,sub)` · línea 876
- `parseLedger(rows,fmt,head,map)` · línea 885
- `parseOFX(text)` · línea 916
- `parseQIF(text)` · línea 924
- `readFile(file)` · línea 930
- `importFiles(files)` · línea 939
- `openImport(rows,det,fname,map)` · línea 951
- `openMapper(rows,fname)` · línea 987
- `openPositionsImport(rows,head,fname,map)` · línea 1012
- `importBackup(o)` · línea 1020

## Activos y precios · línea 1026
- `ensureAsset(sym)` · línea 1031
- `priceEUR(sym)` · línea 1034
- `fx(cur)` · línea 1040
- `trackedAssets()` · línea 1042
- `refreshPrices(force=false)` · línea 1049
- `directPrices(cryptos)` · línea 1064
- `priceAt(sym,t)` · línea 1072

## Cartera: qué tienes y cuánto vale · línea 1089
- `bankBalance(a)` · línea 1090
- `positionRows()` · línea 1099
- `derivRows()` · línea 1111
- `netWorth()` · línea 1120
- `investmentSummary()` · línea 1128
- `snapshot()` · línea 1136
- `bankHistory(days=365)` · línea 1143
- `reliableHistory(points)` · línea 1154
- `netSeries(days)` · línea 1166
- `changeWindow(days)` · línea 1178

## Movimientos: resúmenes del mes · línea 1186
- `monthTotals(m)` · línea 1187
- `lastMonths(n)` · línea 1194
- `recurring()` · línea 1196

## Análisis: de un vistazo · línea 1208
- `liquidity()` · línea 1210
- `avgMonthlyExpense()` · línea 1212
- `cushion()` · línea 1214
- `pace()` · línea 1216
- `upcoming(days=31)` · línea 1222
- `forecast()` · línea 1232
- `topMerchants(m,n=5)` · línea 1244
- `dailySpend(m)` · línea 1245
- `insights()` · línea 1247

## Fiscalidad (España): FIFO, base del ahorro, borrador · línea 1260
- `cuotaAhorro(base)` · línea 1263
- `matchTransfers(L)` · línea 1265
- `taxGroups()` · línea 1271
- `taxPrefetch(onStep)` · línea 1277
- `taxCompute()` · línea 1286
- `balancesAt(date)` · línea 1327
- `modelo721(year)` · línea 1328
- `taxSummary(year,extra=0)` · línea 1334
- `byCoin(disp)` · línea 1339

## Conexión con el Worker (exchanges, precios, sincronización) · línea 1341
- `api(path,opts={})` · línea 1343
- `syncBalances(manual=false)` · línea 1362

## Sincronización cifrada entre dispositivos · línea 1383
- `b64u(b)` · línea 1386
- `syncKey()` · línea 1388
- `syncId()` · línea 1389
- `syncPayload()` · línea 1391
- `encrypt(obj)` · línea 1392
- `decrypt(s)` · línea 1398
- `mergeStates(local,remote)` · línea 1404
- `scheduleSync(ms=1500)` · línea 1431
- `syncNow(manual=false)` · línea 1432
- `ago(t)` · línea 1468
- `paintSync()` · línea 1469
- `pairLink()` · línea 1478
- `readPair()` · línea 1479

## Avisos · línea 1488
- `alerts()` · línea 1489

## Gráficos interactivos (SVG propios, sin librerías) · línea 1506
- `svgLine(pts,{h,w,id='nw',col}={})` · línea 1511
- `svgCompare(m)` · línea 1526
- `svgDays(m)` · línea 1540
- `svgMonths(months)` · línea 1549
- `donut(entries,{id='cats',label='Gastado',total}={})` · línea 1556
- `allocBar(parts,total)` · línea 1562
- `bindCharts(root=document)` · línea 1566

## Instalación PWA, radar y Copiloto · línea 1599
- `installState()` · línea 1604
- `installApp()` · línea 1605
- `repairPWA()` · línea 1610
- `aiPayload(kind)` · línea 1615
- `localAdvice(kind)` · línea 1621
- `portfolioMetricsFromPayload(rows)` · línea 1649
- `runAI(kind)` · línea 1650
- `vCopilot()` · línea 1661
- `calcTechnical(closes)` · línea 1669
- `loadAssetIntel(sym)` · línea 1674
- `loadRadar()` · línea 1680
- `assetIntelHTML(sym)` · línea 1681

## Navegación · línea 1683
- `go(v,f)` · línea 1690
- `navBtn(id,n,i,cls='nav')` · línea 1696
- `navBtns(cls)` · línea 1697
- `sideNav()` · línea 1698
- `drawerNav()` · línea 1699
- `renderNav()` · línea 1700
- `render()` · línea 1709
- `head(title,sub,actions='')` · línea 1719
- `catInitials(c)` · línea 1721
- `initials(s)` · línea 1723
- `assetColor(sym)` · línea 1725
- `moneyBig(eur)` · línea 1727
- `rangeBtns()` · línea 1732
- `deltaPill(chg,base,txt)` · línea 1734

## Inicio · línea 1737
- `accountLine(a,rows)` · línea 1738
- `homeAssets(rows)` · línea 1742
- `changeCell(days,label)` · línea 1746
- `compactEmpty(title,text,action)` · línea 1749
- `vResumenMobile()` · línea 1750
- `greeting()` · línea 1764
- `safeToSpend()` · línea 1766
- `accValue(a,rows)` · línea 1767
- `accCard(a,rows)` · línea 1768
- `vResumen()` · línea 1773
- `catRow(k,v,max,total,attrs)` · línea 1791
- `onboarding()` · línea 1795
- `txItem(t)` · línea 1803
- `goalRow(g)` · línea 1807
- `goalSaved(g)` · línea 1812

## Movimientos (pestaña «Gastos») · línea 1814
- `filtered()` · línea 1815
- `vMovs()` · línea 1820
- `editTx(id)` · línea 1848
- `quickAdd()` · línea 1859

## Objetivos y presupuestos · línea 1874
- `vGoals()` · línea 1875
- `editGoal(id)` · línea 1883

## Inversiones · línea 1893
- `costBasis()` · línea 1894
- `invSeries(days)` · línea 1896
- `portfolioMetrics(list,total)` · línea 1900
- `portfolioScore(pm,coverage)` · línea 1903
- `decisionPanel(pm,coverage,list)` · línea 1908
- `scenarioPanel(total)` · línea 1918
- `exposurePanel(dn,pm)` · línea 1922
- `marketTabs()` · línea 1923
- `positionsPanel(list,ops,ders)` · línea 1924
- `vInv()` · línea 1925
- `holdingRow(x)` · línea 1938
- `riskStrip(pm,list,total)` · línea 1939
- `radarHTML(trends)` · línea 1940
- `invDonut(list,total)` · línea 1944
- `accTable(rows)` · línea 1945
- `opsTable(ops)` · línea 1950
- `tvSymbol(sym)` · línea 1955
- `tradingViewURL(sym)` · línea 1962
- `assetDetail(sym)` · línea 1963
- `editOp(id)` · línea 1975
- `editDeriv(id)` · línea 1987

## Impuestos · línea 2000
- `vTax()` · línea 2002
- `taxCSV(year)` · línea 2026
- `taxAIText(year)` · línea 2035

## Cuentas · línea 2046
- `vCuentas()` · línea 2049
- `editAcc(id)` · línea 2059

## Ajustes · línea 2070
- `vAjustes()` · línea 2072
- `workerInfoHTML(i)` · línea 2091
- `vMas()` · línea 2096

## Ventana, descargas y acciones · línea 2110
- `modal(title,html)` · línea 2111
- `download(name,text,type='application/json')` · línea 2112
- `copyText(t,msg='Copiado')` · línea 2113
- `resetDrawerGesture()` · línea 2117
- `openDrawer()` · línea 2118
- `closeDrawer()` · línea 2119
- `gestureStart(e)` · línea 2121
- `gestureMove(e)` · línea 2129
- `gestureEnd(e)` · línea 2140
- `act(a,el)` · línea 2147
- `confirmTwice(el)` · línea 2240
- `afterRender()` · línea 2279

## Arranque · línea 2297
- `refreshAll(force)` · línea 2299
- `init()` · línea 2305
