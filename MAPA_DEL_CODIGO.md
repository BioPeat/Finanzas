# MAPA DEL CÓDIGO · Finanzas v10

Generado automáticamente. Busca por función; las líneas cambian.


## Utilidades · línea 562
- `localDate(d)` · línea 571
- `addDays(s,n)` · línea 572
- `monthAdd(m,n)` · línea 574
- `fmtDate(s,o={day:'numeric',month:'short'})` · línea 578
- `nf(n,d=2,min=d)` · línea 579
- `money(eur,opts={})` · línea 581
- `toNum(v)` · línea 592
- `toDate(v,dmy=true)` · línea 603

## Estado y guardado · línea 652
- `defaults()` · línea 658
- `load()` · línea 677
- `migrate(o)` · línea 682
- `autoBackup()` · línea 692
- `backupInfo()` · línea 700
- `restoreAutomaticBackup()` · línea 701
- `save(sync=true)` · línea 702
- `stampChanges(before)` · línea 709
- `change(fn,msg)` · línea 726
- `undo()` · línea 733
- `toast(text,canUndo=false)` · línea 743

## Categorías · línea 750
- `merchantOf(desc)` · línea 785
- `categorize(t)` · línea 793

## Importar archivos (Excel .xlsx y CSV) · línea 803
- `unzip(buf)` · línea 805
- `readXlsx(buf)` · línea 820
- `parseCSV(text)` · línea 827
- `findHeader(rows,needles)` · línea 841
- `detect(rows)` · línea 854
- `col(hs,...names)` · línea 858
- `parseBank(rows,fmt,head)` · línea 860
- `normAsset(a)` · línea 875
- `binanceKind(op,acct)` · línea 880
- `krakenKind(type,sub)` · línea 892
- `parseLedger(rows,fmt,head,map)` · línea 901
- `parseOFX(text)` · línea 932
- `parseQIF(text)` · línea 940
- `readFile(file)` · línea 946
- `importFiles(files)` · línea 955
- `openImport(rows,det,fname,map)` · línea 967
- `openMapper(rows,fname)` · línea 1003
- `openPositionsImport(rows,head,fname,map)` · línea 1028
- `importBackup(o)` · línea 1036

## Activos y precios · línea 1042
- `ensureAsset(sym)` · línea 1047
- `priceEUR(sym)` · línea 1050
- `fx(cur)` · línea 1056
- `trackedAssets()` · línea 1058
- `refreshPrices(force=false)` · línea 1065
- `directPrices(cryptos)` · línea 1080
- `priceAt(sym,t)` · línea 1088

## Cartera: qué tienes y cuánto vale · línea 1105
- `bankBalance(a)` · línea 1106
- `positionRows()` · línea 1115
- `derivRows()` · línea 1127
- `netWorth()` · línea 1136
- `investmentSummary()` · línea 1144
- `snapshot()` · línea 1152
- `bankHistory(days=365)` · línea 1159
- `reliableHistory(points)` · línea 1170
- `netSeries(days)` · línea 1182
- `changeWindow(days)` · línea 1194

## Movimientos: resúmenes del mes · línea 1202
- `monthTotals(m)` · línea 1203
- `lastMonths(n)` · línea 1210
- `recurring()` · línea 1212

## Análisis: de un vistazo · línea 1224
- `liquidity()` · línea 1226
- `avgMonthlyExpense()` · línea 1228
- `cushion()` · línea 1230
- `pace()` · línea 1232
- `upcoming(days=31)` · línea 1238
- `forecast()` · línea 1248
- `topMerchants(m,n=5)` · línea 1260
- `dailySpend(m)` · línea 1261
- `insights()` · línea 1263

## Fiscalidad (España): FIFO, base del ahorro, borrador · línea 1276
- `cuotaAhorro(base)` · línea 1279
- `matchTransfers(L)` · línea 1281
- `taxGroups()` · línea 1287
- `taxPrefetch(onStep)` · línea 1293
- `taxCompute()` · línea 1302
- `balancesAt(date)` · línea 1343
- `modelo721(year)` · línea 1344
- `taxSummary(year,extra=0)` · línea 1350
- `byCoin(disp)` · línea 1355

## Conexión con el Worker (exchanges, precios, sincronización) · línea 1357
- `api(path,opts={})` · línea 1359
- `syncBalances(manual=false)` · línea 1378

## Sincronización cifrada entre dispositivos · línea 1399
- `b64u(b)` · línea 1402
- `syncKey()` · línea 1404
- `syncId()` · línea 1405
- `syncPayload()` · línea 1407
- `encrypt(obj)` · línea 1408
- `decrypt(s)` · línea 1414
- `mergeStates(local,remote)` · línea 1420
- `scheduleSync(ms=1500)` · línea 1447
- `syncNow(manual=false)` · línea 1448
- `ago(t)` · línea 1484
- `paintSync()` · línea 1485
- `pairLink()` · línea 1494
- `readPair()` · línea 1495

## Avisos · línea 1504
- `alerts()` · línea 1505

## Gráficos interactivos (SVG propios, sin librerías) · línea 1522
- `svgLine(pts,{h,w,id='nw',col}={})` · línea 1527
- `svgCompare(m)` · línea 1542
- `svgDays(m)` · línea 1556
- `svgMonths(months)` · línea 1565
- `donut(entries,{id='cats',label='Gastado',total}={})` · línea 1572
- `allocBar(parts,total)` · línea 1578
- `bindCharts(root=document)` · línea 1582

## Instalación PWA, radar y Copiloto · línea 1615
- `installState()` · línea 1620
- `installApp()` · línea 1621
- `repairPWA()` · línea 1626
- `aiPayload(kind)` · línea 1631
- `localAdvice(kind)` · línea 1637
- `portfolioMetricsFromPayload(rows)` · línea 1665
- `runAI(kind)` · línea 1666
- `vCopilot()` · línea 1677
- `calcTechnical(closes)` · línea 1685
- `loadAssetIntel(sym)` · línea 1690
- `loadRadar()` · línea 1696
- `assetIntelHTML(sym)` · línea 1697

## Navegación · línea 1699
- `go(v,f)` · línea 1706
- `navBtn(id,n,i,cls='nav')` · línea 1712
- `navBtns(cls)` · línea 1713
- `sideNav()` · línea 1714
- `drawerNav()` · línea 1715
- `renderNav()` · línea 1716
- `render()` · línea 1725
- `head(title,sub,actions='')` · línea 1735
- `catInitials(c)` · línea 1737
- `initials(s)` · línea 1739
- `assetColor(sym)` · línea 1741
- `moneyBig(eur)` · línea 1743
- `rangeBtns()` · línea 1748
- `deltaPill(chg,base,txt)` · línea 1750

## Inicio · línea 1753
- `accountLine(a,rows)` · línea 1754
- `homeAssets(rows)` · línea 1758
- `changeCell(days,label)` · línea 1762
- `compactEmpty(title,text,action)` · línea 1765
- `vResumenMobile()` · línea 1766
- `greeting()` · línea 1780
- `safeToSpend()` · línea 1782
- `accValue(a,rows)` · línea 1783
- `accCard(a,rows)` · línea 1784
- `vResumen()` · línea 1789
- `catRow(k,v,max,total,attrs)` · línea 1808
- `onboarding()` · línea 1812
- `txItem(t)` · línea 1820
- `goalRow(g)` · línea 1824
- `goalSaved(g)` · línea 1829

## Movimientos (pestaña «Gastos») · línea 1831
- `filtered()` · línea 1832
- `vMovs()` · línea 1837
- `editTx(id)` · línea 1865
- `quickAdd()` · línea 1876

## Objetivos y presupuestos · línea 1891
- `vGoals()` · línea 1892
- `editGoal(id)` · línea 1900

## Inversiones · línea 1910
- `costBasis()` · línea 1911
- `invSeries(days)` · línea 1913
- `portfolioMetrics(list,total)` · línea 1917
- `portfolioScore(pm,coverage)` · línea 1920
- `decisionPanel(pm,coverage,list)` · línea 1925
- `scenarioPanel(total)` · línea 1935
- `exposurePanel(dn,pm)` · línea 1939
- `marketTabs()` · línea 1940
- `positionsPanel(list,ops,ders)` · línea 1941
- `vInv()` · línea 1942
- `holdingRow(x)` · línea 1955
- `riskStrip(pm,list,total)` · línea 1956
- `radarHTML(trends)` · línea 1957
- `invDonut(list,total)` · línea 1961
- `accTable(rows)` · línea 1962
- `opsTable(ops)` · línea 1967
- `tvSymbol(sym)` · línea 1972
- `tradingViewURL(sym)` · línea 1979
- `assetDetail(sym)` · línea 1980
- `editOp(id)` · línea 1992
- `editDeriv(id)` · línea 2004

## Impuestos · línea 2017
- `vTax()` · línea 2019
- `taxCSV(year)` · línea 2043
- `taxAIText(year)` · línea 2052

## Cuentas · línea 2063
- `vCuentas()` · línea 2066
- `editAcc(id)` · línea 2076

## Ajustes · línea 2087
- `vAjustes()` · línea 2089
- `workerInfoHTML(i)` · línea 2108
- `vMas()` · línea 2113

## Ventana, descargas y acciones · línea 2127
- `modal(title,html)` · línea 2128
- `download(name,text,type='application/json')` · línea 2129
- `copyText(t,msg='Copiado')` · línea 2130
- `resetDrawerGesture()` · línea 2134
- `openDrawer()` · línea 2135
- `closeDrawer()` · línea 2136
- `gestureStart(e)` · línea 2138
- `gestureMove(e)` · línea 2150
- `gestureEnd(e)` · línea 2164
- `act(a,el)` · línea 2172
- `confirmTwice(el)` · línea 2265
- `afterRender()` · línea 2305

## Arranque · línea 2323
- `refreshAll(force)` · línea 2325
- `init()` · línea 2331
